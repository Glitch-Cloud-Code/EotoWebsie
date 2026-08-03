import { readFile, writeFile } from 'node:fs/promises'
import { BufferGeometry, Group, Mesh } from 'three'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

const SOURCE_PATH = new URL(
  './assets/logo-source.glb',
  import.meta.url,
)
const OUTPUT_PATH = new URL('../public/assets/logo/logo.glb', import.meta.url)
const POSITION_PRECISION = 4
const SYMBOL_HEIGHT_RATIO = 0.08

class NodeFileReader {
  result = null
  onerror = null
  onloadend = null

  readAsArrayBuffer(blob) {
    blob
      .arrayBuffer()
      .then((result) => {
        this.result = result
        this.onloadend?.()
      })
      .catch((error) => this.onerror?.(error))
  }
}

globalThis.FileReader ??= NodeFileReader
globalThis.ProgressEvent ??= class ProgressEvent {}

function findRoot(parents, index) {
  let root = index

  while (parents[root] !== root) {
    root = parents[root]
  }

  while (parents[index] !== index) {
    const parent = parents[index]
    parents[index] = root
    index = parent
  }

  return root
}

function joinRoots(parents, left, right) {
  const leftRoot = findRoot(parents, left)
  const rightRoot = findRoot(parents, right)

  if (leftRoot !== rightRoot) {
    parents[rightRoot] = leftRoot
  }
}

function getVertexKey(position, index) {
  return [
    position.getX(index),
    position.getY(index),
    position.getZ(index),
  ]
    .map((value) => value.toFixed(POSITION_PRECISION))
    .join(',')
}

function compactGeometry(source, indices) {
  const geometry = source.clone()
  geometry.setIndex(indices)
  const compact = geometry.toNonIndexed()
  geometry.dispose()
  compact.computeBoundingBox()
  compact.computeBoundingSphere()
  return compact
}

function splitGeometry(source) {
  const index = source.index
  const position = source.attributes.position

  if (!index || !position) {
    throw new Error('Logo source must contain indexed position geometry')
  }

  source.computeBoundingBox()
  const bounds = source.boundingBox
  if (!bounds) {
    throw new Error('Logo source bounds unavailable')
  }

  const triangleCount = index.count / 3
  const parents = Int32Array.from(
    { length: triangleCount },
    (_, triangleIndex) => triangleIndex,
  )
  const firstTriangleByVertex = new Map()

  for (let triangleIndex = 0; triangleIndex < triangleCount; triangleIndex += 1) {
    for (let corner = 0; corner < 3; corner += 1) {
      const vertexIndex = index.getX(triangleIndex * 3 + corner)
      const key = getVertexKey(position, vertexIndex)
      const firstTriangle = firstTriangleByVertex.get(key)

      if (firstTriangle === undefined) {
        firstTriangleByVertex.set(key, triangleIndex)
      } else {
        joinRoots(parents, triangleIndex, firstTriangle)
      }
    }
  }

  const components = new Map()
  for (let triangleIndex = 0; triangleIndex < triangleCount; triangleIndex += 1) {
    const root = findRoot(parents, triangleIndex)
    const component = components.get(root) ?? {
      indices: [],
      maxY: Number.NEGATIVE_INFINITY,
      minY: Number.POSITIVE_INFINITY,
    }

    for (let corner = 0; corner < 3; corner += 1) {
      const vertexIndex = index.getX(triangleIndex * 3 + corner)
      const y = position.getY(vertexIndex)
      component.indices.push(vertexIndex)
      component.maxY = Math.max(component.maxY, y)
      component.minY = Math.min(component.minY, y)
    }

    components.set(root, component)
  }

  const height = bounds.max.y - bounds.min.y
  const symbolThreshold = height * SYMBOL_HEIGHT_RATIO
  const symbolIndices = []
  const wordmarkIndices = []

  for (const component of components.values()) {
    const target =
      component.minY < -symbolThreshold || component.maxY > symbolThreshold
        ? symbolIndices
        : wordmarkIndices
    target.push(...component.indices)
  }

  if (symbolIndices.length === 0 || wordmarkIndices.length === 0) {
    throw new Error('Logo split did not produce both identity meshes')
  }

  return {
    symbol: compactGeometry(source, symbolIndices),
    wordmark: compactGeometry(source, wordmarkIndices),
  }
}

async function loadSource() {
  const file = await readFile(SOURCE_PATH)
  const arrayBuffer = file.buffer.slice(
    file.byteOffset,
    file.byteOffset + file.byteLength,
  )
  const gltf = await new Promise((resolve, reject) => {
    new GLTFLoader().parse(arrayBuffer, '', resolve, reject)
  })
  let sourceMesh = null

  gltf.scene.traverse((object) => {
    if (sourceMesh === null && object instanceof Mesh) {
      sourceMesh = object
    }
  })

  if (!sourceMesh) {
    throw new Error('Logo source mesh unavailable')
  }

  return sourceMesh
}

async function exportLogo(scene) {
  return new Promise((resolve, reject) => {
    new GLTFExporter().parse(scene, resolve, reject, {
      binary: true,
      onlyVisible: false,
    })
  })
}

const sourceMesh = await loadSource()
const split = splitGeometry(sourceMesh.geometry)
const scene = new Group()
scene.name = 'EotoLogo'

const symbol = new Mesh(split.symbol, sourceMesh.material.clone())
symbol.name = 'LogoSymbol'
symbol.material.name = 'LogoSymbolSource'

const wordmark = new Mesh(split.wordmark, sourceMesh.material.clone())
wordmark.name = 'LogoWordmark'
wordmark.material.name = 'LogoWordmarkSource'

scene.add(symbol, wordmark)
const binary = await exportLogo(scene)
await writeFile(OUTPUT_PATH, Buffer.from(binary))

console.log(
  `Wrote ${OUTPUT_PATH.pathname}: ${split.symbol.attributes.position.count} symbol vertices, ${split.wordmark.attributes.position.count} wordmark vertices`,
)
