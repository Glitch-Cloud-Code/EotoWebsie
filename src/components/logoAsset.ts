import { Mesh, type Material, type Object3D } from 'three'

export const LOGO_GLB_ROTATION: [number, number, number] = [0, -Math.PI / 4, 0]
export const LOGO_GLB_SCALE = 30
export const LOGO_MATERIAL_FRONT_AXIS: [number, number, number] = [1, 0, 1]
export const LOGO_SYMBOL_MESH_NAME = 'LogoSymbol'
export const LOGO_WORDMARK_MESH_NAME = 'LogoWordmark'

export type LogoMaterials = {
  symbol: Material
  wordmark: Material
}

export function prepareLogoScene(
  source: Object3D,
  materials: LogoMaterials,
) {
  const scene = source.clone(true)

  scene.traverse((object) => {
    if (!(object instanceof Mesh)) {
      return
    }

    object.castShadow = true
    object.material =
      object.name === LOGO_WORDMARK_MESH_NAME
        ? materials.wordmark
        : materials.symbol
    object.receiveShadow = true
  })

  return scene
}
