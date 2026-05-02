# STEP 3D Web Tool

A pure front-end STEP model processing, visualization, face-coloring, and export tool built with Nuxt 3, TypeScript, Three.js, and `occt-import-js`.

This project runs entirely in the browser. It does not require a back-end service and does not depend on any server-side STEP processing API.

## Overview

The application provides a browser-based workflow for:

- importing local `.step` / `.stp` files
- converting STEP geometry to Three.js meshes in the browser
- preserving STEP face mapping during triangulation
- automatically cleaning and normalizing imported models
- selecting faces with raycasting
- applying Morandi-style matte colors to faces
- separating selected faces into independent meshes
- exporting the full processed model as GLB

The tool is designed around a modular Nuxt 3 Composition API architecture so later geometry editing, export formats, and interaction tools can be added cleanly.

## Tech Stack

- Nuxt 3
- Vue 3 Composition API
- TypeScript with strict mode
- Three.js
- `occt-import-js` for browser-side STEP parsing
- `GLTFExporter` from Three.js for GLB export

## Current Features

### STEP Import Pipeline

- local file and folder selection for `.step` / `.stp`
- browser-side STEP parsing using OpenCascade WebAssembly
- conversion from imported STEP mesh data to Three.js `BufferGeometry`
- preservation of original STEP face ranges through `brep_faces`

### Automatic Geometry Processing

After import, the model is processed in the following order:

1. STEP parsing and mesh extraction
2. original face-to-triangle mapping preservation
3. invalid triangle removal
4. empty node cleanup
5. geometric bounding-box center calculation
6. vertex translation to move the model center to `(0, 0, 0)`
7. uniform vertex-only scaling to fit within `1m × 1m × 1m`
8. vertex normal recomputation
9. outward normal correction
10. back-face culling material setup

Notes:

- only vertex positions are modified during normalization
- `mesh.scale` remains `1`
- the processed model structure is preserved for later interaction and export

### 3D Viewport

- Three.js scene, camera, renderer, and lights
- OrbitControls rotation, zoom, and pan
- responsive canvas resizing
- helper grid and axes

### Face Interaction

- raycast face picking on the canvas
- mapping clicked triangles back to original STEP faces
- single-face highlight with bright red emissive material
- one selected face at a time
- support for both original and separated faces

### Face Coloring

- 7 predefined Morandi-style matte materials
- manual coloring mode toggle
- click-to-color selected face
- auto-coloring across the full model

### Face Separation

- separate the currently selected face into a new independent mesh
- keep world position unchanged
- remove the detached face from the original mesh
- rebuild remaining mesh geometry, groups, and materials

### Model Export

- export the full processed model as `.glb`
- preserve:
  - full geometry
  - separated meshes
  - material colors
  - structure/group hierarchy
  - normalized scale and centering
  - computed normals

## Project Structure

```text
optimizer/
├─ assets/
│  └─ css/
│     └─ main.css
├─ components/
│  ├─ layout/
│  ├─ panels/
│  └─ viewer/
├─ composables/
│  ├─ useFaceInteractionState.ts
│  ├─ useModelExport.ts
│  ├─ useMorandiPalette.ts
│  ├─ useOcctLoader.ts
│  ├─ useProcessedModelState.ts
│  ├─ useStepImporter.ts
│  ├─ useStepImportState.ts
│  ├─ useStepModelProcessor.ts
│  └─ useThreeViewport.ts
├─ pages/
├─ public/
│  ├─ occt-import-js.js
│  ├─ occt-import-js.wasm
│  └─ occt-import-js-worker.js
├─ types/
│  ├─ occt-import-js.d.ts
│  └─ step-model.ts
├─ app.vue
├─ nuxt.config.ts
├─ package.json
└─ README.md
```

## Main Modules

### `useOcctLoader.ts`

Loads the OpenCascade WebAssembly runtime in the browser and resolves the `.wasm` asset path.

### `useStepImporter.ts`

Reads a selected STEP file and converts it into a processed application model using the STEP processor.

### `useStepModelProcessor.ts`

Core geometry-processing module. Responsible for:

- mesh cleanup
- face mapping preservation
- material creation
- centering and scaling
- normal correction
- face highlighting
- face recoloring
- face separation

### `useThreeViewport.ts`

Owns the Three.js scene lifecycle and viewport interaction layer:

- scene setup
- OrbitControls
- file import rendering
- raycast face picking
- highlight updates
- auto-color and separation reactions

### `useModelExport.ts`

Exports the full processed model group as binary GLB for direct browser download.

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

Default local development server:

- `http://localhost:3000`

## Production Build

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Usage Flow

1. Open the app in the browser.
2. Select one or more local STEP files.
3. Choose the active file from the left panel.
4. Wait for automatic parsing and geometry processing.
5. Rotate, zoom, and pan the model in the center viewport.
6. Click a face to select it.
7. Optionally:
   - apply a Morandi color
   - auto-color the full model
   - separate the selected face
8. Export the full processed result as GLB.

## Engineering Notes

- The project uses strict TypeScript constraints.
- Browser-side STEP parsing is large because OCCT WebAssembly is heavy.
- Face selection depends on preserved STEP face range metadata rather than raw triangle-only interaction.
- Export is intentionally limited to the full processed model to keep downstream output consistent.

## Known Limitations

- The bundle is relatively large because of `occt-import-js` and Three.js export tooling.
- Export currently supports GLB only.
- STEP files with very large or highly complex topology may take noticeable time in the browser.
- The current face-color interaction is designed for manual editing, not high-volume batch material authoring yet.

## Recommended Next Improvements

- add export progress / loading feedback
- add undo / redo for coloring and separation
- add selection hover preview
- add GLB export options
- optimize chunk splitting to reduce client bundle size
- add automated geometry regression tests for face separation and color preservation

## Scripts

- `npm run dev`: start the Nuxt development server
- `npm run build`: create a production build
- `npm run preview`: preview the production build
- `npm run generate`: generate static output if needed for static deployment scenarios

## License

This project currently does not define a dedicated project license file. Check third-party package licenses, especially `occt-import-js` and Three.js, before distribution.
