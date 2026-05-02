import {
  BufferAttribute,
  Color,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  type Material
} from 'three'

const DEFAULT_EXPORT_COLOR = '#9ea4a8'
const FBX_VERSION = 7400
const FBX_HEADER_VERSION = 1003
const FBX_DOCUMENT_ID = 1
const FBX_ROOT_NODE_ID = 0
const FBX_UNIT_SCALE_FACTOR = 100

interface FbxModelRecord {
  id: number
  parentId: number
  name: string
  type: 'Null' | 'Mesh'
  translation: [number, number, number]
  rotation: [number, number, number]
  scaling: [number, number, number]
  geometryId: number | null
  materialIds: number[]
}

interface FbxGeometryRecord {
  id: number
  name: string
  vertices: number[]
  polygonVertexIndices: number[]
  normals: number[]
  polygonMaterialIndices: number[]
}

interface FbxMaterialRecord {
  id: number
  name: string
  diffuseColor: [number, number, number]
}

interface FbxSceneGraph {
  rootName: string
  models: FbxModelRecord[]
  geometries: FbxGeometryRecord[]
  materials: FbxMaterialRecord[]
}

/**
 * Export the current static Three.js object hierarchy into an ASCII FBX document.
 * The exporter focuses on browser-side mesh, hierarchy, normals, and material color data.
 */
export const useFbxExport = () => {
  const exportObjectAsFbx = (rootObject: Object3D, sourceName: string): Blob => {
    rootObject.updateMatrixWorld(true)

    const sceneGraph = createSceneGraph(rootObject, sourceName)
    const fileContent = buildFbxDocument(sceneGraph, sourceName)

    return new Blob([fileContent], {
      type: 'application/octet-stream'
    })
  }

  return {
    exportObjectAsFbx
  }
}

const createSceneGraph = (rootObject: Object3D, sourceName: string): FbxSceneGraph => {
  const nextId = createIdGenerator()
  const models: FbxModelRecord[] = []
  const geometries: FbxGeometryRecord[] = []
  const materials: FbxMaterialRecord[] = []

  const visitObject = (object: Object3D, parentId: number): void => {
    if (!object.visible) {
      return
    }

    const modelId = nextId()
    const modelName = createObjectName(object, sourceName, models.length)
    const modelRecord: FbxModelRecord = {
      id: modelId,
      parentId,
      name: modelName,
      type: object instanceof Mesh ? 'Mesh' : 'Null',
      translation: [
        object.position.x,
        object.position.y,
        object.position.z
      ],
      rotation: [
        MathUtils.radToDeg(object.rotation.x),
        MathUtils.radToDeg(object.rotation.y),
        MathUtils.radToDeg(object.rotation.z)
      ],
      scaling: [
        object.scale.x,
        object.scale.y,
        object.scale.z
      ],
      geometryId: null,
      materialIds: []
    }

    if (object instanceof Mesh) {
      const geometryRecord = createGeometryRecord(object, modelName, nextId)
      const materialRecords = createMaterialRecords(object, modelName, nextId)

      modelRecord.geometryId = geometryRecord.id
      modelRecord.materialIds = materialRecords.map((record) => record.id)

      geometries.push(geometryRecord)
      materials.push(...materialRecords)
    }

    models.push(modelRecord)

    object.children.forEach((childObject) => {
      visitObject(childObject, modelId)
    })
  }

  visitObject(rootObject, FBX_ROOT_NODE_ID)

  return {
    rootName: sanitizeName(sourceName.replace(/\.(step|stp)$/i, '')),
    models,
    geometries,
    materials
  }
}

const createGeometryRecord = (
  mesh: Mesh,
  modelName: string,
  nextId: () => number
): FbxGeometryRecord => {
  const positionAttribute = mesh.geometry.getAttribute('position') as BufferAttribute | undefined
  const indexAttribute = mesh.geometry.getIndex()

  if (!positionAttribute) {
    throw new Error(`FBX 导出失败：模型 ${modelName} 缺少顶点坐标。`)
  }

  const vertices = serializePositionAttribute(positionAttribute)
  const polygonVertexIndices = serializePolygonIndices(positionAttribute, indexAttribute)
  const normals = serializeNormals(mesh, positionAttribute)
  const polygonMaterialIndices = serializePolygonMaterialIndices(mesh)

  return {
    id: nextId(),
    name: `${modelName}_geometry`,
    vertices,
    polygonVertexIndices,
    normals,
    polygonMaterialIndices
  }
}

const createMaterialRecords = (
  mesh: Mesh,
  modelName: string,
  nextId: () => number
): FbxMaterialRecord[] => {
  const materials = normalizeMaterials(mesh.material)

  return materials.map((material, materialIndex) => ({
    id: nextId(),
    name: `${modelName}_material_${materialIndex + 1}`,
    diffuseColor: extractMaterialColor(material)
  }))
}

const normalizeMaterials = (material: Material | Material[]): Material[] => {
  const materialList = Array.isArray(material) ? material : [material]

  if (materialList.length) {
    return materialList
  }

  return [
    new MeshStandardMaterial({
      color: DEFAULT_EXPORT_COLOR
    })
  ]
}

const extractMaterialColor = (material: Material): [number, number, number] => {
  if ('color' in material && material.color instanceof Color) {
    return [
      material.color.r,
      material.color.g,
      material.color.b
    ]
  }

  const fallbackColor = new Color(DEFAULT_EXPORT_COLOR)
  return [fallbackColor.r, fallbackColor.g, fallbackColor.b]
}

const serializePositionAttribute = (positionAttribute: BufferAttribute): number[] => {
  const vertices: number[] = []

  for (let vertexIndex = 0; vertexIndex < positionAttribute.count; vertexIndex += 1) {
    vertices.push(
      positionAttribute.getX(vertexIndex),
      positionAttribute.getY(vertexIndex),
      positionAttribute.getZ(vertexIndex)
    )
  }

  return vertices
}

const serializePolygonIndices = (
  positionAttribute: BufferAttribute,
  indexAttribute: BufferAttribute | null
): number[] => {
  const polygonIndices: number[] = []
  const triangleIndexArray = indexAttribute
    ? Array.from(indexAttribute.array)
    : Array.from({ length: positionAttribute.count }, (_, index) => index)

  for (let triangleCursor = 0; triangleCursor < triangleIndexArray.length; triangleCursor += 3) {
    const first = triangleIndexArray[triangleCursor]
    const second = triangleIndexArray[triangleCursor + 1]
    const third = triangleIndexArray[triangleCursor + 2]

    polygonIndices.push(first, second, -third - 1)
  }

  return polygonIndices
}

const serializeNormals = (mesh: Mesh, positionAttribute: BufferAttribute): number[] => {
  let normalAttribute = mesh.geometry.getAttribute('normal') as BufferAttribute | undefined

  if (!normalAttribute) {
    mesh.geometry.computeVertexNormals()
    normalAttribute = mesh.geometry.getAttribute('normal') as BufferAttribute | undefined
  }

  if (!normalAttribute) {
    return new Array(positionAttribute.count * 3).fill(0)
  }

  const triangleIndexArray = mesh.geometry.getIndex()
    ? Array.from(mesh.geometry.getIndex()!.array)
    : Array.from({ length: positionAttribute.count }, (_, index) => index)
  const normals: number[] = []

  triangleIndexArray.forEach((vertexIndex) => {
    normals.push(
      normalAttribute.getX(vertexIndex),
      normalAttribute.getY(vertexIndex),
      normalAttribute.getZ(vertexIndex)
    )
  })

  return normals
}

const serializePolygonMaterialIndices = (mesh: Mesh): number[] => {
  const triangleIndexCount = mesh.geometry.getIndex()?.count ?? mesh.geometry.getAttribute('position').count
  const triangleCount = Math.floor(triangleIndexCount / 3)
  const polygonMaterialIndices = new Array<number>(triangleCount).fill(0)

  if (!mesh.geometry.groups.length) {
    return polygonMaterialIndices
  }

  mesh.geometry.groups.forEach((group) => {
    const triangleStart = Math.floor(group.start / 3)
    const triangleEnd = Math.floor((group.start + group.count) / 3)

    for (let triangleIndex = triangleStart; triangleIndex < triangleEnd; triangleIndex += 1) {
      polygonMaterialIndices[triangleIndex] = group.materialIndex ?? 0
    }
  })

  return polygonMaterialIndices
}

const buildFbxDocument = (
  sceneGraph: FbxSceneGraph,
  sourceName: string
): string => {
  const objectCount = sceneGraph.models.length + sceneGraph.geometries.length + sceneGraph.materials.length
  const sections = [
    '; FBX 7.4.0 project file',
    '',
    buildHeaderSection(sourceName),
    buildGlobalSettingsSection(),
    buildDocumentSection(sceneGraph.rootName),
    'References:  {',
    '}',
    buildDefinitionsSection(
      objectCount,
      sceneGraph.models.length,
      sceneGraph.geometries.length,
      sceneGraph.materials.length
    ),
    buildObjectsSection(sceneGraph),
    buildConnectionsSection(sceneGraph),
    'Takes:  {',
    '\tCurrent: ""',
    '}'
  ]

  return sections.join('\n')
}

const buildHeaderSection = (sourceName: string): string => {
  return [
    'FBXHeaderExtension:  {',
    `\tFBXHeaderVersion: ${FBX_HEADER_VERSION}`,
    `\tFBXVersion: ${FBX_VERSION}`,
    `\tCreator: "STEP 3D Web Tool - ${escapeFbxString(sourceName)}"`,
    '}'
  ].join('\n')
}

const buildGlobalSettingsSection = (): string => {
  return [
    'GlobalSettings:  {',
    '\tVersion: 1000',
    '\tProperties70:  {',
    '\t\tP: "UpAxis", "int", "Integer", "",1',
    '\t\tP: "UpAxisSign", "int", "Integer", "",1',
    '\t\tP: "FrontAxis", "int", "Integer", "",2',
    '\t\tP: "FrontAxisSign", "int", "Integer", "",1',
    '\t\tP: "CoordAxis", "int", "Integer", "",0',
    '\t\tP: "CoordAxisSign", "int", "Integer", "",1',
    `\t\tP: "UnitScaleFactor", "double", "Number", "",${formatFbxNumber(FBX_UNIT_SCALE_FACTOR)}`,
    `\t\tP: "OriginalUnitScaleFactor", "double", "Number", "",${formatFbxNumber(FBX_UNIT_SCALE_FACTOR)}`,
    '\t}',
    '}'
  ].join('\n')
}

const buildDocumentSection = (rootName: string): string => {
  return [
    'Documents:  {',
    '\tCount: 1',
    `\tDocument: ${FBX_DOCUMENT_ID}, "Document::${escapeFbxString(rootName)}", "Scene" {`,
    '\t\tProperties70:  {',
    '\t\t}',
    '\t\tRootNode: 0',
    '\t}',
    '}'
  ].join('\n')
}

const buildDefinitionsSection = (
  objectCount: number,
  modelCount: number,
  geometryCount: number,
  materialCount: number
): string => {
  return [
    'Definitions:  {',
    '\tVersion: 100',
    `\tCount: ${objectCount}`,
    '\tObjectType: "Model" {',
    `\t\tCount: ${modelCount}`,
    '\t\tPropertyTemplate: "FbxNode" {',
    '\t\t}',
    '\t}',
    '\tObjectType: "Geometry" {',
    `\t\tCount: ${geometryCount}`,
    '\t\tPropertyTemplate: "FbxMesh" {',
    '\t\t}',
    '\t}',
    '\tObjectType: "Material" {',
    `\t\tCount: ${materialCount}`,
    '\t\tPropertyTemplate: "FbxSurfacePhong" {',
    '\t\t}',
    '\t}',
    '}'
  ].join('\n')
}

const buildObjectsSection = (sceneGraph: FbxSceneGraph): string => {
  const geometryBlocks = sceneGraph.geometries.map(buildGeometryBlock)
  const materialBlocks = sceneGraph.materials.map(buildMaterialBlock)
  const modelBlocks = sceneGraph.models.map(buildModelBlock)

  return [
    'Objects:  {',
    geometryBlocks.join('\n'),
    materialBlocks.join('\n'),
    modelBlocks.join('\n'),
    '}'
  ].filter(Boolean).join('\n')
}

const buildGeometryBlock = (geometryRecord: FbxGeometryRecord): string => {
  return [
    `\tGeometry: ${geometryRecord.id}, "Geometry::${escapeFbxString(geometryRecord.name)}", "Mesh" {`,
    '\t\tGeometryVersion: 124',
    `\t\tVertices: *${geometryRecord.vertices.length} {`,
    `\t\t\ta: ${formatFbxArray(geometryRecord.vertices)}`,
    '\t\t}',
    `\t\tPolygonVertexIndex: *${geometryRecord.polygonVertexIndices.length} {`,
    `\t\t\ta: ${formatFbxArray(geometryRecord.polygonVertexIndices)}`,
    '\t\t}',
    '\t\tLayerElementNormal: 0 {',
    '\t\t\tVersion: 101',
    '\t\t\tName: ""',
    '\t\t\tMappingInformationType: "ByPolygonVertex"',
    '\t\t\tReferenceInformationType: "Direct"',
    `\t\t\tNormals: *${geometryRecord.normals.length} {`,
    `\t\t\t\ta: ${formatFbxArray(geometryRecord.normals)}`,
    '\t\t\t}',
    '\t\t}',
    '\t\tLayerElementMaterial: 0 {',
    '\t\t\tVersion: 101',
    '\t\t\tName: ""',
    '\t\t\tMappingInformationType: "ByPolygon"',
    '\t\t\tReferenceInformationType: "IndexToDirect"',
    `\t\t\tMaterials: *${geometryRecord.polygonMaterialIndices.length} {`,
    `\t\t\t\ta: ${formatFbxArray(geometryRecord.polygonMaterialIndices)}`,
    '\t\t\t}',
    '\t\t}',
    '\t\tLayer: 0 {',
    '\t\t\tVersion: 100',
    '\t\t\tLayerElement:  {',
    '\t\t\t\tType: "LayerElementNormal"',
    '\t\t\t\tTypedIndex: 0',
    '\t\t\t}',
    '\t\t\tLayerElement:  {',
    '\t\t\t\tType: "LayerElementMaterial"',
    '\t\t\t\tTypedIndex: 0',
    '\t\t\t}',
    '\t\t}',
    '\t}'
  ].join('\n')
}

const buildMaterialBlock = (materialRecord: FbxMaterialRecord): string => {
  const [red, green, blue] = materialRecord.diffuseColor

  return [
    `\tMaterial: ${materialRecord.id}, "Material::${escapeFbxString(materialRecord.name)}", "" {`,
    '\t\tVersion: 102',
    '\t\tShadingModel: "phong"',
    '\t\tMultiLayer: 0',
    '\t\tProperties70:  {',
    '\t\t\tP: "Emissive", "Vector3D", "Vector", "",0,0,0',
    '\t\t\tP: "Ambient", "Vector3D", "Vector", "",0,0,0',
    `\t\t\tP: "DiffuseColor", "ColorRGB", "Color", "",${formatFbxNumber(red)},${formatFbxNumber(green)},${formatFbxNumber(blue)}`,
    '\t\t\tP: "SpecularColor", "ColorRGB", "Color", "",0.12,0.12,0.12',
    '\t\t\tP: "TransparencyFactor", "double", "Number", "",0',
    '\t\t\tP: "Shininess", "double", "Number", "",12',
    '\t\t\tP: "ReflectionFactor", "double", "Number", "",0',
    '\t\t}',
    '\t}'
  ].join('\n')
}

const buildModelBlock = (modelRecord: FbxModelRecord): string => {
  const [translateX, translateY, translateZ] = modelRecord.translation
  const [rotateX, rotateY, rotateZ] = modelRecord.rotation
  const [scaleX, scaleY, scaleZ] = modelRecord.scaling

  return [
    `\tModel: ${modelRecord.id}, "Model::${escapeFbxString(modelRecord.name)}", "${modelRecord.type}" {`,
    '\t\tVersion: 232',
    '\t\tProperties70:  {',
    `\t\t\tP: "Lcl Translation", "Lcl Translation", "", "A",${formatFbxNumber(translateX)},${formatFbxNumber(translateY)},${formatFbxNumber(translateZ)}`,
    `\t\t\tP: "Lcl Rotation", "Lcl Rotation", "", "A",${formatFbxNumber(rotateX)},${formatFbxNumber(rotateY)},${formatFbxNumber(rotateZ)}`,
    `\t\t\tP: "Lcl Scaling", "Lcl Scaling", "", "A",${formatFbxNumber(scaleX)},${formatFbxNumber(scaleY)},${formatFbxNumber(scaleZ)}`,
    '\t\t}',
    '\t\tShading: T',
    '\t\tCulling: "CullingOff"',
    '\t}'
  ].join('\n')
}

const buildConnectionsSection = (sceneGraph: FbxSceneGraph): string => {
  const connectionLines = [
    `\tC: "OO",${FBX_DOCUMENT_ID},${FBX_ROOT_NODE_ID}`
  ]

  sceneGraph.models.forEach((modelRecord) => {
    connectionLines.push(`\tC: "OO",${modelRecord.id},${modelRecord.parentId}`)

    if (modelRecord.geometryId !== null) {
      connectionLines.push(`\tC: "OO",${modelRecord.geometryId},${modelRecord.id}`)
    }

    modelRecord.materialIds.forEach((materialId) => {
      connectionLines.push(`\tC: "OO",${materialId},${modelRecord.id}`)
    })
  })

  return [
    'Connections:  {',
    ...connectionLines,
    '}'
  ].join('\n')
}

const createIdGenerator = (): (() => number) => {
  let currentId = 100000

  return () => {
    currentId += 1
    return currentId
  }
}

const createObjectName = (object: Object3D, sourceName: string, objectIndex: number): string => {
  if (object.name.trim()) {
    return sanitizeName(object.name)
  }

  if (objectIndex === 0) {
    return sanitizeName(sourceName.replace(/\.(step|stp)$/i, ''))
  }

  return sanitizeName(`${object.type}_${objectIndex}`)
}

const sanitizeName = (name: string): string => {
  return name.replace(/[\r\n"]/g, '_').trim() || 'Object'
}

const escapeFbxString = (value: string): string => {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

const formatFbxNumber = (value: number): string => {
  if (!Number.isFinite(value)) {
    return '0'
  }

  const normalizedValue = Object.is(value, -0) ? 0 : value

  if (Number.isInteger(normalizedValue)) {
    return `${normalizedValue}`
  }

  return normalizedValue
    .toFixed(6)
    .replace(/\.?0+$/, '')
}

const formatFbxArray = (values: number[]): string => {
  return values.map((value) => formatFbxNumber(value)).join(',')
}
