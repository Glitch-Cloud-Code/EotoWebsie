import { Environment, Lightformer } from '@react-three/drei'
import { LOGO_ENVIRONMENT_LIGHTS } from './logoSceneConfig'

export function LogoEnvironment() {
  return (
    <Environment frames={1} resolution={256}>
      {LOGO_ENVIRONMENT_LIGHTS.map((light) => (
        <Lightformer
          color={light.color}
          form="rect"
          intensity={light.intensity}
          key={light.key}
          position={light.position}
          rotation={light.rotation}
          scale={light.scale}
        />
      ))}
    </Environment>
  )
}
