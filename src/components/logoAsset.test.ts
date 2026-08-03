import { readFile } from 'node:fs/promises'
import { BufferGeometry, Group, Mesh, MeshBasicMaterial } from 'three'
import { describe, expect, it } from 'vitest'
import {
  LOGO_GLB_ROTATION,
  LOGO_GLB_SCALE,
  LOGO_MATERIAL_FRONT_AXIS,
  LOGO_SYMBOL_MESH_NAME,
  LOGO_WORDMARK_MESH_NAME,
  prepareLogoScene,
} from './logoAsset'

describe('logo GLB asset', () => {
  it('ships a valid binary glTF asset', async () => {
    const file = await readFile('public/assets/logo/logo.glb')

    expect(file.subarray(0, 4).toString('ascii')).toBe('glTF')
    expect(file.length).toBeGreaterThan(100_000)
  })

  it('ships separate named symbol and wordmark meshes', async () => {
    const file = await readFile('public/assets/logo/logo.glb')
    const jsonLength = file.readUInt32LE(12)
    const json = JSON.parse(
      file
        .subarray(20, 20 + jsonLength)
        .toString('utf8')
        .replace(/\0/g, ''),
    ) as { nodes?: Array<{ name?: string }> }
    const names = json.nodes?.map(({ name }) => name) ?? []

    expect(names).toContain(LOGO_SYMBOL_MESH_NAME)
    expect(names).toContain(LOGO_WORDMARK_MESH_NAME)
  })

  it('clones render meshes and applies role-specific metal materials', () => {
    const source = new Group()
    const originalMaterial = new MeshBasicMaterial()
    const symbolMaterial = new MeshBasicMaterial()
    const wordmarkMaterial = new MeshBasicMaterial()
    const symbolMesh = new Mesh(new BufferGeometry(), originalMaterial)
    const wordmarkMesh = new Mesh(new BufferGeometry(), originalMaterial)
    symbolMesh.name = LOGO_SYMBOL_MESH_NAME
    wordmarkMesh.name = LOGO_WORDMARK_MESH_NAME
    source.add(symbolMesh, wordmarkMesh)

    const prepared = prepareLogoScene(source, {
      symbol: symbolMaterial,
      wordmark: wordmarkMaterial,
    })
    const preparedSymbol = prepared.children[0] as Mesh
    const preparedWordmark = prepared.children[1] as Mesh

    expect(prepared).not.toBe(source)
    expect(preparedSymbol.material).toBe(symbolMaterial)
    expect(preparedWordmark.material).toBe(wordmarkMaterial)
    expect(preparedSymbol.castShadow).toBe(true)
    expect(preparedWordmark.receiveShadow).toBe(true)
    expect(symbolMesh.material).toBe(originalMaterial)
  })

  it('rotates the source diagonal XZ face toward the camera', () => {
    expect(LOGO_GLB_ROTATION[1]).toBe(-Math.PI / 4)
    expect(LOGO_GLB_SCALE).toBeGreaterThan(1)
    expect(LOGO_MATERIAL_FRONT_AXIS).toEqual([1, 0, 1])
  })
})
