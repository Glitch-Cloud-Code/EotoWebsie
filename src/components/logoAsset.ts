import { Mesh, type Material, type Object3D } from 'three'

export const LOGO_GLB_ROTATION: [number, number, number] = [0, -Math.PI / 4, 0]
export const LOGO_GLB_SCALE = 30
export const LOGO_MATERIAL_FRONT_AXIS: [number, number, number] = [1, 0, 1]

export function prepareLogoScene(source: Object3D, material: Material) {
  const scene = source.clone(true)

  scene.traverse((object) => {
    if (!(object instanceof Mesh)) {
      return
    }

    object.castShadow = true
    object.material = material
    object.receiveShadow = true
  })

  return scene
}
