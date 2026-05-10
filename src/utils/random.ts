export type RandomFn = () => number

export function createSeededRandom(initialSeed: number): RandomFn {
  let seed = initialSeed % 2147483647

  if (seed <= 0) {
    seed += 2147483646
  }

  return () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
}
