import { readFile } from 'node:fs/promises'
import { BufferGeometry, Group, Mesh, MeshBasicMaterial } from 'three'
import { describe, expect, it } from 'vitest'
import {
  LOGO_GLB_ROTATION,
  LOGO_GLB_SCALE,
  prepareLogoScene,
} from './logoAsset'

describe('logo GLB asset', () => {
  it('ships a valid binary glTF asset', async () => {
    const file = await readFile('public/assets/logo/logo.glb')

    expect(file.subarray(0, 4).toString('ascii')).toBe('glTF')
    expect(file.length).toBeGreaterThan(100_000)
  })

  it('clones render meshes and applies the shared metal material', () => {
    const source = new Group()
    const originalMaterial = new MeshBasicMaterial()
    const metalMaterial = new MeshBasicMaterial()
    const sourceMesh = new Mesh(new BufferGeometry(), originalMaterial)
    source.add(sourceMesh)

    const prepared = prepareLogoScene(source, metalMaterial)
    const preparedMesh = prepared.children[0] as Mesh

    expect(prepared).not.toBe(source)
    expect(preparedMesh.material).toBe(metalMaterial)
    expect(preparedMesh.castShadow).toBe(true)
    expect(preparedMesh.receiveShadow).toBe(true)
    expect(sourceMesh.material).toBe(originalMaterial)
  })

  it('faces the source X plane toward the camera at scene scale', () => {
    expect(LOGO_GLB_ROTATION[1]).toBe(-Math.PI / 4)
    expect(LOGO_GLB_SCALE).toBeGreaterThan(1)
  })
})
