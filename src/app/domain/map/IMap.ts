import Point from '@app/infrastructure/geometry/Point'

export default interface IMap {
  player: Point,
  gameObjects: number[][]
  enemies: Array<Point & { healthPercentage: number }>
}
