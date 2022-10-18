export default interface Point {
  x: number
  y: number
  row?: number
  col?: number
  deltas?: {
    dyTop    : number
    dyBottom : number
    dxLeft   : number
    dxRight  : number
  }
}

export function pointToPointDistance(p1: Point, p2: Point) {
  return Math.sqrt((p2.x - p1.x) * (p2.x - p1.x) + (p2.y - p1.y) * (p2.y - p1.y))
}

export function angleBetweenPoints(p1: Point, p2: Point): number {
  const theta = Math.atan2((p1.y - p2.y), (p1.x - p2.x))
  return theta
}
