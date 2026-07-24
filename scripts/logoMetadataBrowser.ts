import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js'
import { buildLogoLayout } from '../src/components/logoGeometry'

export async function generateLogoMetadata(svgUrl: string) {
  const response = await fetch(svgUrl)
  if (!response.ok) {
    throw new Error(`Logo SVG request failed: ${response.status}`)
  }

  const source = await response.text()
  const svg = new SVGLoader().parse(source)
  const shapes = svg.paths.flatMap((path) => SVGLoader.createShapes(path))

  return buildLogoLayout(shapes)
}
