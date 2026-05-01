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
import type {
  OcctFaceRange,
  OcctMeshResult,
  OcctNodeResult,
  OcctStepReadResult,
  ProcessedStepMesh,
  ProcessedStepModel,
  StepFaceMapping
} from '~/types/step-model'

const DEFAULT_MODEL_COLOR = '#9ea4a8'
const WORLD_UP = new Vector3(0, 1, 0)

interface MeshBuildContext {
  sourceMesh: OcctMeshResult
  meshIndex: number
}

interface GeometryCleanupResult {
  geometry: BufferGeometry
  faceMappings: StepFaceMapping[]
}

/**
 * Convert imported STEP JSON meshes into a cleaned Three.js model group.
 * The pipeline preserves STEP face ranges so later face selection can address original topology.
 */
export const useStepModelProcessor = () => {
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

      const childNodes = node.children ?? []
      childNodes.forEach((childNode) => {
        const childGroup = new Group()
        childGroup.name = childNode.name || 'StepNode'
        parentGroup.add(childGroup)
        nodeToGroupMap.set(childNode, childGroup)
      })

      const meshIndices = node.meshes ?? []
      meshIndices.forEach((meshIndex) => {
        const sourceMesh = result.meshes[meshIndex]
        if (!sourceMesh) {
          return
        }

        const processedMesh = buildProcessedMesh({
          sourceMesh,
          meshIndex
        })

        if (!processedMesh) {
          return
        }

        processedMeshes.push(processedMesh)
        parentGroup.add(processedMesh.mesh)
      })
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

    const cleanupResult = cleanupGeometry(geometry, sourceMesh.brep_faces ?? [])

    if (!cleanupResult) {
      geometry.dispose()
      return null
    }

    const material = createStandardMaterial(sourceMesh.color)
    const mesh = new Mesh(cleanupResult.geometry, material)
    mesh.name = sourceMesh.name || `StepMesh-${meshIndex}`
    mesh.frustumCulled = true
    mesh.castShadow = false
    mesh.receiveShadow = true
    mesh.scale.set(1, 1, 1)
    mesh.userData.faceMappings = cleanupResult.faceMappings

    return {
      name: mesh.name,
      geometry: cleanupResult.geometry,
      mesh,
      faceMappings: cleanupResult.faceMappings
    }
  }

  const createGeometryFromOcctMesh = (sourceMesh: OcctMeshResult): BufferGeometry => {
    const geometry = new BufferGeometry()
    const positionArray = new Float32Array(sourceMesh.attributes.position.array)
    const indexArray = Uint32Array.from(sourceMesh.index.array)

    geometry.name = sourceMesh.name
    geometry.setAttribute('position', new BufferAttribute(positionArray, 3))
    geometry.setIndex(new BufferAttribute(indexArray, 1))

    if (sourceMesh.attributes.normal?.array.length) {
      geometry.setAttribute(
        'normal',
        new BufferAttribute(new Float32Array(sourceMesh.attributes.normal.array), 3)
      )
    }

    return geometry
  }

  /**
   * Remove invalid triangles and preserve the mapping from original STEP faces to triangle ranges.
   */
  const cleanupGeometry = (
    geometry: BufferGeometry,
    faceRanges: OcctFaceRange[]
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

    const faceMappings = mapStepFaces(faceRanges, triangleRemap)
    geometry.clearGroups()
    applyGeometryGroups(geometry, faceMappings)

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

  /**
   * Preserve original STEP face integrity by remapping each source face range to surviving triangles.
   */
  const mapStepFaces = (
    faceRanges: OcctFaceRange[],
    triangleRemap: number[]
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

      mappings.push({
        faceIndex,
        triangleStart,
        triangleEnd,
        indexStart: triangleStart * 3,
        indexCount: mappedTriangles.length * 3,
        color: faceRange.color ?? null
      })
    })

    return mappings
  }

  const applyGeometryGroups = (
    geometry: BufferGeometry,
    faceMappings: StepFaceMapping[]
  ): void => {
    if (!faceMappings.length) {
      const count = geometry.getIndex()?.count ?? 0
      geometry.addGroup(0, count, 0)
      return
    }

    faceMappings.forEach((mapping) => {
      geometry.addGroup(mapping.indexStart, mapping.indexCount, 0)
    })
  }

  const createStandardMaterial = (meshColor?: [number, number, number]): MeshStandardMaterial => {
    const color = meshColor
      ? new Color(meshColor[0], meshColor[1], meshColor[2])
      : new Color(DEFAULT_MODEL_COLOR)

    return new MeshStandardMaterial({
      color,
      roughness: 0.72,
      metalness: 0.08,
      side: FrontSide
    })
  }

  /**
   * Center the model at the world origin and uniformly scale it into a 1m cube by editing vertices only.
   */
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
        const x = (positionAttribute.getX(vertexIndex) - center.x) * scaleFactor
        const y = (positionAttribute.getY(vertexIndex) - center.y) * scaleFactor
        const z = (positionAttribute.getZ(vertexIndex) - center.z) * scaleFactor

        positionAttribute.setXYZ(vertexIndex, x, y, z)
      }

      positionAttribute.needsUpdate = true
      geometry.computeBoundingBox()
      geometry.computeBoundingSphere()
      mesh.scale.set(1, 1, 1)
    })
  }

  /**
   * Recompute normals, then flip whole meshes when their average normal points inward.
   */
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

  return {
    processStepResult,
    fitCameraToModel
  }
}
