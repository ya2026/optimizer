import {
  Box3,
  BufferAttribute,
  BufferGeometry,
  Color,
  FrontSide,
  Group,
  Mesh,
  MeshStandardMaterial,
  Vector3
} from 'three'
import { useMorandiPalette } from '~/composables/useMorandiPalette'
import type {
  MorandiColorOption,
  OcctFaceRange,
  OcctMeshResult,
  OcctNodeResult,
  OcctStepReadResult,
  ProcessedStepMesh,
  ProcessedStepModel,
  SelectedStepFace,
  StepFaceMapping
} from '~/types/step-model'

const DEFAULT_MODEL_COLOR = '#9ea4a8'
const HIGHLIGHT_COLOR = '#ff2a2a'
const WORLD_UP = new Vector3(0, 1, 0)

interface MeshBuildContext {
  sourceMesh: OcctMeshResult
  meshIndex: number
}

interface GeometryCleanupResult {
  geometry: BufferGeometry
  faceMappings: StepFaceMapping[]
}

interface FaceTriangleRecord {
  faceId: string
  triangleOffset: number
  indices: [number, number, number]
}

/**
 * Convert STEP mesh data into editable Three.js meshes while preserving original face topology ranges.
 */
export const useStepModelProcessor = () => {
  const { morandiColors } = useMorandiPalette()

  const processStepResult = (
    result: OcctStepReadResult,
    sourceName: string
  ): ProcessedStepModel => {
    if (!result.success || !result.meshes.length) {
      throw new Error('The STEP file could not be converted into mesh data.')
    }

    const group = new Group()
    group.name = sourceName

    const processedMeshes: ProcessedStepMesh[] = []
    const nodeToGroupMap = new Map<OcctNodeResult, Group>()

    const rootGroup = new Group()
    rootGroup.name = result.root.name || sourceName
    group.add(rootGroup)
    nodeToGroupMap.set(result.root, rootGroup)

    traverseNodeTree(result.root, (node) => {
      const parentGroup = nodeToGroupMap.get(node) ?? rootGroup

      for (const childNode of node.children ?? []) {
        const childGroup = new Group()
        childGroup.name = childNode.name || 'StepNode'
        parentGroup.add(childGroup)
        nodeToGroupMap.set(childNode, childGroup)
      }

      for (const meshIndex of node.meshes ?? []) {
        const sourceMesh = result.meshes[meshIndex]
        if (!sourceMesh) {
          continue
        }

        const processedMesh = buildProcessedMesh({
          sourceMesh,
          meshIndex
        })

        if (!processedMesh) {
          continue
        }

        processedMeshes.push(processedMesh)
        parentGroup.add(processedMesh.mesh)
      }
    })

    removeEmptyGroups(group)

    if (!processedMeshes.length) {
      throw new Error('No valid mesh geometry remained after cleanup.')
    }

    normalizeModelGeometry(processedMeshes)
    unifyMeshNormalsOutward(processedMeshes)
    group.updateMatrixWorld(true)

    return {
      group,
      meshes: processedMeshes,
      sourceName
    }
  }

  const traverseNodeTree = (
    rootNode: OcctNodeResult,
    visitor: (node: OcctNodeResult) => void
  ): void => {
    visitor(rootNode)

    for (const childNode of rootNode.children ?? []) {
      traverseNodeTree(childNode, visitor)
    }
  }

  const buildProcessedMesh = (
    context: MeshBuildContext
  ): ProcessedStepMesh | null => {
    const { sourceMesh, meshIndex } = context
    const geometry = createGeometryFromOcctMesh(sourceMesh)
    const cleanupResult = cleanupGeometry(geometry, sourceMesh.brep_faces ?? [], meshIndex)

    if (!cleanupResult) {
      geometry.dispose()
      return null
    }

    const materials = createFaceMaterials(cleanupResult.faceMappings, sourceMesh.color)
    const meshId = `mesh-${meshIndex}-${sourceMesh.name || 'unnamed'}`
    const mesh = new Mesh(cleanupResult.geometry, materials)

    mesh.name = sourceMesh.name || `StepMesh-${meshIndex}`
    mesh.frustumCulled = true
    mesh.castShadow = false
    mesh.receiveShadow = true
    mesh.scale.set(1, 1, 1)
    mesh.userData.meshId = meshId

    return {
      id: meshId,
      name: mesh.name,
      geometry: cleanupResult.geometry,
      mesh,
      materials,
      faceMappings: cleanupResult.faceMappings,
      isSeparatedFace: false
    }
  }

  const createGeometryFromOcctMesh = (sourceMesh: OcctMeshResult): BufferGeometry => {
    const geometry = new BufferGeometry()
    geometry.name = sourceMesh.name
    geometry.setAttribute(
      'position',
      new BufferAttribute(new Float32Array(sourceMesh.attributes.position.array), 3)
    )
    geometry.setIndex(new BufferAttribute(Uint32Array.from(sourceMesh.index.array), 1))

    if (sourceMesh.attributes.normal?.array.length) {
      geometry.setAttribute(
        'normal',
        new BufferAttribute(new Float32Array(sourceMesh.attributes.normal.array), 3)
      )
    }

    return geometry
  }

  /**
   * Remove invalid triangles and preserve the original STEP face-to-triangle mapping.
   */
  const cleanupGeometry = (
    geometry: BufferGeometry,
    faceRanges: OcctFaceRange[],
    meshIndex: number
  ): GeometryCleanupResult | null => {
    const positionAttribute = geometry.getAttribute('position') as BufferAttribute
    const indexAttribute = geometry.getIndex()

    if (!positionAttribute || !indexAttribute) {
      return null
    }

    const validIndices: number[] = []
    const triangleRemap: number[] = []
    const sourceIndexArray = Array.from(indexAttribute.array)
    const triangleCount = sourceIndexArray.length / 3

    for (let triangleIndex = 0; triangleIndex < triangleCount; triangleIndex += 1) {
      const first = sourceIndexArray[triangleIndex * 3]
      const second = sourceIndexArray[triangleIndex * 3 + 1]
      const third = sourceIndexArray[triangleIndex * 3 + 2]

      const isIndexInvalid =
        first === second ||
        second === third ||
        first === third ||
        !isFiniteVertex(positionAttribute, first) ||
        !isFiniteVertex(positionAttribute, second) ||
        !isFiniteVertex(positionAttribute, third)

      if (isIndexInvalid) {
        triangleRemap.push(-1)
        continue
      }

      const area = calculateTriangleArea(positionAttribute, first, second, third)
      if (area <= 1e-12) {
        triangleRemap.push(-1)
        continue
      }

      triangleRemap.push(validIndices.length / 3)
      validIndices.push(first, second, third)
    }

    if (!validIndices.length) {
      geometry.dispose()
      return null
    }

    geometry.setIndex(validIndices)
    geometry.deleteAttribute('normal')

    const faceMappings = mapStepFaces(faceRanges, triangleRemap, meshIndex)
    rebuildGeometryGroups(geometry, faceMappings)

    return {
      geometry,
      faceMappings
    }
  }

  const isFiniteVertex = (positionAttribute: BufferAttribute, vertexIndex: number): boolean => {
    return Number.isFinite(positionAttribute.getX(vertexIndex)) &&
      Number.isFinite(positionAttribute.getY(vertexIndex)) &&
      Number.isFinite(positionAttribute.getZ(vertexIndex))
  }

  const calculateTriangleArea = (
    positionAttribute: BufferAttribute,
    first: number,
    second: number,
    third: number
  ): number => {
    const a = new Vector3(
      positionAttribute.getX(first),
      positionAttribute.getY(first),
      positionAttribute.getZ(first)
    )
    const b = new Vector3(
      positionAttribute.getX(second),
      positionAttribute.getY(second),
      positionAttribute.getZ(second)
    )
    const c = new Vector3(
      positionAttribute.getX(third),
      positionAttribute.getY(third),
      positionAttribute.getZ(third)
    )

    return b.sub(a).cross(c.sub(a)).length() * 0.5
  }

  const mapStepFaces = (
    faceRanges: OcctFaceRange[],
    triangleRemap: number[],
    meshIndex: number
  ): StepFaceMapping[] => {
    const mappings: StepFaceMapping[] = []

    faceRanges.forEach((faceRange, faceIndex) => {
      const mappedTriangles: number[] = []

      for (let triangleIndex = faceRange.first; triangleIndex <= faceRange.last; triangleIndex += 1) {
        const remappedTriangleIndex = triangleRemap[triangleIndex]

        if (typeof remappedTriangleIndex === 'number' && remappedTriangleIndex >= 0) {
          mappedTriangles.push(remappedTriangleIndex)
        }
      }

      if (!mappedTriangles.length) {
        return
      }

      const triangleStart = mappedTriangles[0]
      const triangleEnd = mappedTriangles[mappedTriangles.length - 1]
      const materialIndex = mappings.length

      mappings.push({
        id: `mesh-${meshIndex}-face-${faceIndex}`,
        faceIndex,
        triangleStart,
        triangleEnd,
        indexStart: triangleStart * 3,
        indexCount: mappedTriangles.length * 3,
        color: faceRange.color ?? null,
        materialIndex
      })
    })

    return mappings
  }

  const rebuildGeometryGroups = (
    geometry: BufferGeometry,
    faceMappings: StepFaceMapping[]
  ): void => {
    geometry.clearGroups()

    if (!faceMappings.length) {
      const count = geometry.getIndex()?.count ?? 0
      geometry.addGroup(0, count, 0)
      return
    }

    faceMappings.forEach((mapping, mappingIndex) => {
      mapping.materialIndex = mappingIndex
      geometry.addGroup(mapping.indexStart, mapping.indexCount, mapping.materialIndex)
    })
  }

  const createFaceMaterials = (
    faceMappings: StepFaceMapping[],
    baseColor?: [number, number, number]
  ): MeshStandardMaterial[] => {
    if (!faceMappings.length) {
      return [createStandardMaterial(baseColor)]
    }

    return faceMappings.map((mapping) => {
      if (mapping.color) {
        return createStandardMaterial(mapping.color)
      }

      return createStandardMaterial(baseColor)
    })
  }

  const createStandardMaterial = (
    colorInput?: [number, number, number] | string
  ): MeshStandardMaterial => {
    const color = Array.isArray(colorInput)
      ? new Color(colorInput[0], colorInput[1], colorInput[2])
      : new Color(colorInput ?? DEFAULT_MODEL_COLOR)

    return new MeshStandardMaterial({
      color,
      roughness: 0.84,
      metalness: 0.06,
      side: FrontSide
    })
  }

  const createHighlightMaterial = (): MeshStandardMaterial => {
    return new MeshStandardMaterial({
      color: new Color(HIGHLIGHT_COLOR),
      emissive: new Color(HIGHLIGHT_COLOR),
      emissiveIntensity: 1.45,
      roughness: 0.5,
      metalness: 0.04,
      side: FrontSide
    })
  }

  const createMorandiMaterial = (colorOption: MorandiColorOption): MeshStandardMaterial => {
    return new MeshStandardMaterial({
      color: new Color(colorOption.hex),
      roughness: 0.9,
      metalness: 0.03,
      side: FrontSide
    })
  }

  const normalizeModelGeometry = (meshes: ProcessedStepMesh[]): void => {
    const modelBounds = new Box3()

    meshes.forEach(({ geometry }) => {
      geometry.computeBoundingBox()

      if (geometry.boundingBox) {
        modelBounds.union(geometry.boundingBox)
      }
    })

    const center = modelBounds.getCenter(new Vector3())
    const size = modelBounds.getSize(new Vector3())
    const maxDimension = Math.max(size.x, size.y, size.z, 1e-9)
    const scaleFactor = 1 / maxDimension

    meshes.forEach(({ geometry, mesh }) => {
      const positionAttribute = geometry.getAttribute('position') as BufferAttribute

      for (let vertexIndex = 0; vertexIndex < positionAttribute.count; vertexIndex += 1) {
        positionAttribute.setXYZ(
          vertexIndex,
          (positionAttribute.getX(vertexIndex) - center.x) * scaleFactor,
          (positionAttribute.getY(vertexIndex) - center.y) * scaleFactor,
          (positionAttribute.getZ(vertexIndex) - center.z) * scaleFactor
        )
      }

      positionAttribute.needsUpdate = true
      geometry.computeBoundingBox()
      geometry.computeBoundingSphere()
      mesh.scale.set(1, 1, 1)
    })
  }

  const unifyMeshNormalsOutward = (meshes: ProcessedStepMesh[]): void => {
    meshes.forEach(({ geometry }) => {
      geometry.computeVertexNormals()

      const positionAttribute = geometry.getAttribute('position') as BufferAttribute
      const normalAttribute = geometry.getAttribute('normal') as BufferAttribute
      const indexAttribute = geometry.getIndex()

      if (!normalAttribute || !indexAttribute) {
        return
      }

      let orientationAccumulator = 0

      for (let triangleOffset = 0; triangleOffset < indexAttribute.count; triangleOffset += 3) {
        const first = indexAttribute.getX(triangleOffset)
        const second = indexAttribute.getX(triangleOffset + 1)
        const third = indexAttribute.getX(triangleOffset + 2)

        const centroid = new Vector3(
          (
            positionAttribute.getX(first) +
            positionAttribute.getX(second) +
            positionAttribute.getX(third)
          ) / 3,
          (
            positionAttribute.getY(first) +
            positionAttribute.getY(second) +
            positionAttribute.getY(third)
          ) / 3,
          (
            positionAttribute.getZ(first) +
            positionAttribute.getZ(second) +
            positionAttribute.getZ(third)
          ) / 3
        )

        const triangleNormal = new Vector3(
          (
            normalAttribute.getX(first) +
            normalAttribute.getX(second) +
            normalAttribute.getX(third)
          ) / 3,
          (
            normalAttribute.getY(first) +
            normalAttribute.getY(second) +
            normalAttribute.getY(third)
          ) / 3,
          (
            normalAttribute.getZ(first) +
            normalAttribute.getZ(second) +
            normalAttribute.getZ(third)
          ) / 3
        ).normalize()

        orientationAccumulator += centroid.dot(triangleNormal)
      }

      if (orientationAccumulator < 0) {
        flipGeometryWinding(geometry)
        geometry.computeVertexNormals()
      }

      geometry.normalizeNormals()
    })
  }

  const flipGeometryWinding = (geometry: BufferGeometry): void => {
    const indexAttribute = geometry.getIndex()

    if (!indexAttribute) {
      return
    }

    for (let triangleOffset = 0; triangleOffset < indexAttribute.count; triangleOffset += 3) {
      const second = indexAttribute.getX(triangleOffset + 1)
      const third = indexAttribute.getX(triangleOffset + 2)

      indexAttribute.setX(triangleOffset + 1, third)
      indexAttribute.setX(triangleOffset + 2, second)
    }

    indexAttribute.needsUpdate = true
  }

  const removeEmptyGroups = (group: Group): void => {
    const children = [...group.children]

    children.forEach((child) => {
      if (child instanceof Group) {
        removeEmptyGroups(child)

        if (!child.children.length) {
          group.remove(child)
        }
      }
    })
  }

  const fitCameraToModel = (
    model: ProcessedStepModel
  ): { center: Vector3; radius: number; up: Vector3 } => {
    const bounds = new Box3().setFromObject(model.group)
    const center = bounds.getCenter(new Vector3())
    const size = bounds.getSize(new Vector3())
    const radius = Math.max(size.length() * 0.5, 0.5)

    return {
      center,
      radius,
      up: WORLD_UP.clone()
    }
  }

  const findFaceMapping = (
    processedMesh: ProcessedStepMesh,
    faceId: string
  ): StepFaceMapping | null => {
    return processedMesh.faceMappings.find((mapping) => mapping.id === faceId) ?? null
  }

  const resetMeshMaterials = (processedMesh: ProcessedStepMesh): void => {
    processedMesh.mesh.material = processedMesh.materials
  }

  const clearTemporaryMaterials = (processedMesh: ProcessedStepMesh): void => {
    const currentMaterial = processedMesh.mesh.material

    if (!Array.isArray(currentMaterial)) {
      return
    }

    currentMaterial.forEach((material, materialIndex) => {
      if (material !== processedMesh.materials[materialIndex]) {
        material.dispose()
      }
    })

    resetMeshMaterials(processedMesh)
  }

  const highlightFace = (
    processedMesh: ProcessedStepMesh,
    faceId: string
  ): void => {
    clearTemporaryMaterials(processedMesh)

    const mapping = findFaceMapping(processedMesh, faceId)
    if (!mapping) {
      return
    }

    const highlightMaterials = processedMesh.materials.map((material) => material.clone())
    highlightMaterials[mapping.materialIndex]?.dispose()
    highlightMaterials[mapping.materialIndex] = createHighlightMaterial()
    processedMesh.mesh.material = highlightMaterials
  }

  const applyColorToFace = (
    processedMesh: ProcessedStepMesh,
    faceId: string,
    colorOption: MorandiColorOption
  ): void => {
    const mapping = findFaceMapping(processedMesh, faceId)

    if (!mapping) {
      return
    }

    clearTemporaryMaterials(processedMesh)
    processedMesh.materials[mapping.materialIndex]?.dispose()
    processedMesh.materials[mapping.materialIndex] = createMorandiMaterial(colorOption)
    mapping.color = hexToRgbTuple(colorOption.hex)
    resetMeshMaterials(processedMesh)
  }

  const autoColorModel = (model: ProcessedStepModel): void => {
    model.meshes.forEach((processedMesh, meshIndex) => {
      clearTemporaryMaterials(processedMesh)

      processedMesh.faceMappings.forEach((mapping, faceIndex) => {
        const colorOption = morandiColors[(meshIndex + faceIndex) % morandiColors.length]

        processedMesh.materials[mapping.materialIndex]?.dispose()
        processedMesh.materials[mapping.materialIndex] = createMorandiMaterial(colorOption)
        mapping.color = hexToRgbTuple(colorOption.hex)
      })

      resetMeshMaterials(processedMesh)
    })
  }

  const separateFace = (
    model: ProcessedStepModel,
    selectedFace: SelectedStepFace
  ): ProcessedStepMesh | null => {
    const sourceMesh = model.meshes.find((meshItem) => meshItem.id === selectedFace.meshId)

    if (!sourceMesh) {
      return null
    }

    clearTemporaryMaterials(sourceMesh)

    const selectedMapping = findFaceMapping(sourceMesh, selectedFace.faceId)
    const sourceIndexAttribute = sourceMesh.geometry.getIndex()
    const sourcePositionAttribute = sourceMesh.geometry.getAttribute('position') as BufferAttribute

    if (!selectedMapping || !sourceIndexAttribute || !sourcePositionAttribute) {
      return null
    }

    const allFaceTriangles = collectFaceTriangles(sourceMesh)
    const detachedTriangles = allFaceTriangles.filter((record) => record.faceId === selectedMapping.id)
    const remainingTriangles = allFaceTriangles.filter((record) => record.faceId !== selectedMapping.id)

    if (!detachedTriangles.length || !remainingTriangles.length) {
      return null
    }

    const detachedGeometry = createGeometryFromTriangleRecords(
      sourcePositionAttribute,
      detachedTriangles
    )

    const detachedMaterial = createStandardMaterial(
      selectedMapping.color ? selectedMapping.color : DEFAULT_MODEL_COLOR
    )
    const detachedMesh = new Mesh(detachedGeometry, [detachedMaterial])
    detachedMesh.name = `${sourceMesh.name}-face-${selectedMapping.faceIndex}`
    detachedMesh.frustumCulled = true
    detachedMesh.castShadow = false
    detachedMesh.receiveShadow = true
    detachedMesh.scale.set(1, 1, 1)

    const detachedProcessedMesh: ProcessedStepMesh = {
      id: `${sourceMesh.id}-separated-${selectedMapping.faceIndex}-${Date.now()}`,
      name: detachedMesh.name,
      geometry: detachedGeometry,
      mesh: detachedMesh,
      materials: [detachedMaterial],
      faceMappings: [
        {
          ...selectedMapping,
          id: `${selectedMapping.id}-separated`,
          triangleStart: 0,
          triangleEnd: detachedTriangles.length - 1,
          indexStart: 0,
          indexCount: detachedTriangles.length * 3,
          materialIndex: 0
        }
      ],
      isSeparatedFace: true
    }

    detachedMesh.userData.meshId = detachedProcessedMesh.id

    rebuildMeshFromTriangleRecords(sourceMesh, remainingTriangles)
    sourceMesh.mesh.parent?.add(detachedMesh)
    model.meshes.push(detachedProcessedMesh)

    return detachedProcessedMesh
  }

  const collectFaceTriangles = (
    processedMesh: ProcessedStepMesh
  ): FaceTriangleRecord[] => {
    const indexAttribute = processedMesh.geometry.getIndex()

    if (!indexAttribute) {
      return []
    }

    const records: FaceTriangleRecord[] = []

    processedMesh.faceMappings.forEach((mapping) => {
      const end = mapping.indexStart + mapping.indexCount

      for (let indexCursor = mapping.indexStart; indexCursor < end; indexCursor += 3) {
        records.push({
          faceId: mapping.id,
          triangleOffset: indexCursor / 3,
          indices: [
            indexAttribute.getX(indexCursor),
            indexAttribute.getX(indexCursor + 1),
            indexAttribute.getX(indexCursor + 2)
          ]
        })
      }
    })

    return records
  }

  const createGeometryFromTriangleRecords = (
    sourcePositionAttribute: BufferAttribute,
    triangleRecords: FaceTriangleRecord[]
  ): BufferGeometry => {
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', sourcePositionAttribute.clone())
    geometry.setIndex(triangleRecords.flatMap((record) => record.indices))
    geometry.computeVertexNormals()
    geometry.computeBoundingBox()
    geometry.computeBoundingSphere()
    return geometry
  }

  const rebuildMeshFromTriangleRecords = (
    processedMesh: ProcessedStepMesh,
    triangleRecords: FaceTriangleRecord[]
  ): void => {
    const groupedTriangles = new Map<string, FaceTriangleRecord[]>()
    const previousMaterialByFaceId = new Map<string, MeshStandardMaterial>()

    processedMesh.faceMappings.forEach((mapping) => {
      const previousMaterial = processedMesh.materials[mapping.materialIndex]
      if (previousMaterial) {
        previousMaterialByFaceId.set(mapping.id, previousMaterial)
      }
    })

    triangleRecords.forEach((record) => {
      const currentGroup = groupedTriangles.get(record.faceId) ?? []
      currentGroup.push(record)
      groupedTriangles.set(record.faceId, currentGroup)
    })

    const nextFaceMappings: StepFaceMapping[] = []
    let runningTriangleIndex = 0

    processedMesh.faceMappings.forEach((mapping) => {
      const faceTriangles = groupedTriangles.get(mapping.id)
      if (!faceTriangles?.length) {
        return
      }

      nextFaceMappings.push({
        ...mapping,
        triangleStart: runningTriangleIndex,
        triangleEnd: runningTriangleIndex + faceTriangles.length - 1,
        indexStart: runningTriangleIndex * 3,
        indexCount: faceTriangles.length * 3,
        materialIndex: nextFaceMappings.length
      })

      runningTriangleIndex += faceTriangles.length
    })

    const nextIndexArray = nextFaceMappings.flatMap((mapping) => {
      const faceTriangles = groupedTriangles.get(mapping.id) ?? []
      return faceTriangles.flatMap((record) => record.indices)
    })

    processedMesh.geometry.setIndex(nextIndexArray)
    processedMesh.geometry.computeVertexNormals()
    processedMesh.geometry.computeBoundingBox()
    processedMesh.geometry.computeBoundingSphere()

    const nextMaterials = nextFaceMappings.map((mapping) => {
      const previousMaterial = previousMaterialByFaceId.get(mapping.id)

      if (previousMaterial) {
        return previousMaterial.clone()
      }

      return createStandardMaterial(mapping.color ?? DEFAULT_MODEL_COLOR)
    })

    disposeMaterials(processedMesh.materials)
    processedMesh.faceMappings = nextFaceMappings
    processedMesh.materials = nextMaterials
    rebuildGeometryGroups(processedMesh.geometry, processedMesh.faceMappings)
    resetMeshMaterials(processedMesh)
  }

  const disposeMaterials = (materials: MeshStandardMaterial[]): void => {
    materials.forEach((material) => material.dispose())
  }

  const hexToRgbTuple = (hexColor: string): [number, number, number] => {
    const color = new Color(hexColor)
    return [color.r, color.g, color.b]
  }

  return {
    processStepResult,
    fitCameraToModel,
    findFaceMapping,
    highlightFace,
    clearTemporaryMaterials,
    resetMeshMaterials,
    applyColorToFace,
    autoColorModel,
    separateFace
  }
}
