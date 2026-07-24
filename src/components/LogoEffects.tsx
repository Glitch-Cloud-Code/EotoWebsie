import { GodRays } from './GodRays'
import { LogoHalo } from './LogoHalo'
import type { LogoLayout } from './logoGeometry'
import { LOGO_MODEL_SCALE } from './logoSparks'
import { ParticleField } from './ParticleField'
import { SparkBurst } from './SparkBurst'
import type { LogoSparkBurst } from './useLogoInteraction'

export function AttachedLogoEffects({ logoLayout }: { logoLayout: LogoLayout }) {
  return (
    <>
      <ParticleField emitters={logoLayout.smokeEmitters} kind="smoke" />
      <ParticleField emitters={logoLayout.flameEmitters} kind="flame" />
    </>
  )
}

type DetachedLogoEffectsProps = {
  logoLayout: LogoLayout
  onSparkComplete: (id: number) => void
  sparkBursts: LogoSparkBurst[]
}

export function DetachedLogoEffects({
  logoLayout,
  onSparkComplete,
  sparkBursts,
}: DetachedLogoEffectsProps) {
  return (
    <>
      <LogoHalo height={logoLayout.height} width={logoLayout.width} />
      <GodRays height={logoLayout.height} width={logoLayout.width} />
      {sparkBursts.map((burst) => (
        <group
          key={burst.id}
          name="logo-spark-burst"
          position={[burst.origin.x, burst.origin.y, burst.origin.z]}
          scale={[LOGO_MODEL_SCALE, -LOGO_MODEL_SCALE, LOGO_MODEL_SCALE]}
        >
          <SparkBurst
            id={burst.id}
            onComplete={onSparkComplete}
            origin={{ x: 0, y: 0, z: 0 }}
          />
        </group>
      ))}
    </>
  )
}
