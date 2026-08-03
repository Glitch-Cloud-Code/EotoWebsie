import { LogoHalo } from './LogoHalo'
import type { LogoLayout } from './logoGeometry'
import {
  shouldRenderSmoke,
  type LogoQuality,
} from './logoQuality'
import { LOGO_MODEL_SCALE } from './logoSparks'
import { ParticleField } from './ParticleField'
import { SparkBurst } from './SparkBurst'
import type { LogoSparkBurst } from './useLogoInteraction'

export function AttachedLogoEffects({
  logoLayout,
  quality,
}: {
  logoLayout: LogoLayout
  quality: LogoQuality
}) {
  return (
    <>
      {shouldRenderSmoke(quality) ? (
        <ParticleField
          emitters={logoLayout.smokeEmitters}
          kind="smoke"
          quality={quality}
        />
      ) : null}
      <ParticleField
        emitters={logoLayout.flameEmitters}
        kind="flame"
        quality={quality}
      />
    </>
  )
}

type DetachedLogoEffectsProps = {
  logoLayout: LogoLayout
  onSparkComplete: (id: number) => void
  reduceMotion: boolean
  sparkBursts: LogoSparkBurst[]
}

export function DetachedLogoEffects({
  logoLayout,
  onSparkComplete,
  reduceMotion,
  sparkBursts,
}: DetachedLogoEffectsProps) {
  return (
    <>
      <LogoHalo height={logoLayout.height} width={logoLayout.width} />
      {!reduceMotion ? sparkBursts.map((burst) => (
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
      )) : null}
    </>
  )
}
