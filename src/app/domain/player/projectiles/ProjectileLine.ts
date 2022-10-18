import Canvas, { context } from '@app/infrastructure/Canvas'

import Projectile from './Projectile'

export default class ProjectileLine extends Projectile {
  public speed: number = 24
  public damage: number = 5
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
    context.strokeStyle = '#FFFFF'
    context.lineWidth = 1

    context.beginPath()
      context.beginPath()
        context.moveTo(
          this.x + Canvas.center.x - playerX,
          this.y + Canvas.center.y - playerY,
        )
        context.lineTo(
          this.previousX + Canvas.center.x - playerX,
          this.previousY + Canvas.center.y - playerY,
        )
    context.stroke()
  }
}
