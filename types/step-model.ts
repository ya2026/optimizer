import type { BufferGeometry, Group, Mesh, MeshStandardMaterial } from 'three'

export interface OcctFaceRange {
  first: number
  last: number
  color?: [number, number, number] | null
}

export interface OcctMeshAttribute {
  array: number[]
}

export interface OcctMeshResult {
  name: string
  color?: [number, number, number]
  brep_faces?: OcctFaceRange[]
  attributes: {
    position: OcctMeshAttribute
    normal?: OcctMeshAttribute
  }
  index: {
    array: number[]
  }
}

export interface OcctNodeResult {
  name: string
  meshes?: number[]
  children?: OcctNodeResult[]
}

export interface OcctStepReadResult {
  success: boolean
  root: OcctNodeResult
  meshes: OcctMeshResult[]
}

export interface StepFaceMapping {
  id: string
  faceIndex: number
  triangleStart: number
  triangleEnd: number
  indexStart: number
  indexCount: number
  color: [number, number, number] | null
  materialIndex: number
}

export interface ProcessedStepMesh {
  id: string
  name: string
  geometry: BufferGeometry
  mesh: Mesh
  materials: MeshStandardMaterial[]
  faceMappings: StepFaceMapping[]
  isSeparatedFace: boolean
}

export interface ProcessedStepModel {
  group: Group
  meshes: ProcessedStepMesh[]
  sourceName: string
}

export interface MorandiColorOption {
  id: string
  name: string
  hex: string
}

export interface SelectedStepFace {
  meshId: string
  faceId: string
  meshName: string
  isSeparatedFace: boolean
}
