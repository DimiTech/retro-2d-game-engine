export const Pi2Decimals = +Math.PI.toFixed(2)

export function random(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min + 1))
}

export function radiansToDegrees(radians: number) {
  return radians * (180 / Math.PI)
}