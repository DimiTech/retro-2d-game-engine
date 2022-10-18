import Canvas, { context } from '@app/infrastructure/Canvas'

import Projectile from './Projectile'

export default class ProjectileCircle extends Projectile {
  public speed: number = 24
  public minDamage: number = 6
  public maxDamage: number = 12
  public alive: boolean = true

  constructor(
    x: number,
    y: number,
    directionX: number,
    directionY: number,
  ) {
    super(x, y, directionX, directionY)

    for (let i = 0; i < this.numberOfIntermediatePositions; ++i) {
      this.intermediatePositions[i] = { x: null, y: null, row: null, col: null }
    }
  }

  public draw(playerX: number, playerY: number) {
    if (this.x === playerX && this.y === playerY) {
      // Don't draw the first projectile that is spawned at player position.
      return
    }
    context.strokeStyle = '#8AFCFF'
    context.lineWidth = 2
    context.beginPath()
    context.arc(
      this.x + Canvas.center.x - playerX,
      this.y + Canvas.center.y - playerY,
      0.8,
      0,
      (2 * Math.PI)
    )
    context.stroke()
  }
}
