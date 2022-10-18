import * as CONFIG from '@app/configuration/config.json'

import Canvas, { context } from '@app/infrastructure/Canvas'

import Map from '@app/domain/map/Map'
import Enemy from '@app/domain/enemies/Enemy'
import CreatureState from '@app/domain/CreatureState'

import Projectile from './Projectile'

interface IntermediatePoint {
  x: number
  y: number
  row: number
  col: number
}

export default class ProjectileLine extends Projectile {
  public speed: number = 24
  public damage: number = 5
  public alive: boolean = true

  /*
   * Intermediate positions/points solve the bullet phasing problem
   */
  private numberOfIntermediatePositions: number = 3 // More intermediate points give more precision, 3 are just fine
  private intermediatePositions: IntermediatePoint[] = []

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

  public update(playerX: number, playerY: number): void {
    this.previousX = this.x
    this.previousY = this.y
    this.x += this.directionX * this.speed
    this.y += this.directionY * this.speed
    this.row = Math.floor(this.y / CONFIG.TILE_SIZE)
    this.col = Math.floor(this.x / CONFIG.TILE_SIZE)

    const nearbyEnemies = this.getNearbyEnemies()

    this.calculateIntermediatePoints()

    if (this.isOffScreen(playerX, playerY)) {
      this.alive = false
    }

    this.intermediatePositions.forEach(intermediatePoint => {
      if (this.alive) {
        this.checkCollisionWithEnemies(nearbyEnemies, intermediatePoint)
        this.checkCollisionWithWall(intermediatePoint)
      }
    })
    if (this.alive) {
      this.checkCollisionWithEnemies(nearbyEnemies)
      this.checkCollisionWithWall()
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
  // TODO: There could be space for optimization here
  //       Instead of finding the nearest enemies every time, maybe just take
  //       the enemies that are visible on the screen (+ some offset)?
  private getNearbyEnemies(): Enemy[] {
    return [ ...Map.enemies ].filter(e => (
      Math.abs(e.x - this.x) <= CONFIG.TILE_SIZE &&
      Math.abs(e.y - this.y) <= CONFIG.TILE_SIZE
    ))
  }
  /**
   *                                     (this.x, this.y)
   *  (this.previousX, this.previousY)   /
   *  /                                 /
   * x-------o-------o--------o--------x
   *         |       |        |
   *          \      |       /
   *        Intermediate points
   */
  private calculateIntermediatePoints(): void {
    const intermediateIntervalX = (this.x - this.previousX) / (this.numberOfIntermediatePositions + 1)
    const intermediateIntervalY = (this.y - this.previousY) / (this.numberOfIntermediatePositions + 1)
    for (let i = this.numberOfIntermediatePositions - 1; i >= 0; --i) {
      this.intermediatePositions[i].x = this.x - intermediateIntervalX * (i + 1)
      this.intermediatePositions[i].y = this.y - intermediateIntervalY * (i + 1)
      this.intermediatePositions[i].row = Math.floor(this.intermediatePositions[i].y / CONFIG.TILE_SIZE)
      this.intermediatePositions[i].col = Math.floor(this.intermediatePositions[i].x / CONFIG.TILE_SIZE)
    }
  }

  private isOffScreen(playerX: number, playerY: number): boolean {
    return (
      this.x < playerX - Canvas.center.x - CONFIG.TILE_SIZE || this.x > playerX + Canvas.center.x + CONFIG.TILE_SIZE ||
      this.y < playerY - Canvas.center.y - CONFIG.TILE_SIZE || this.y > playerY + Canvas.center.y + CONFIG.TILE_SIZE
    )
  }

  private checkCollisionWithEnemies(nearbyEnemies: Enemy[], point?: IntermediatePoint | ProjectileLine): void {
    if (!point) {
      point = this
    }

    nearbyEnemies.forEach(e => {
      if (
        point.x >= e.x - e.collisionBox.halfWidth &&
        point.x <= e.x + e.collisionBox.halfWidth &&
        point.y >= e.y - e.collisionBox.halfHeight &&
        point.y <= e.y + e.collisionBox.halfHeight
      ) {

        if (e.state >= CreatureState.Dying) {
          return
        }

        this.alive = false
        e.takeDamage(this.getDamage())
      }
    })
  }

  private checkCollisionWithWall(point?: IntermediatePoint | ProjectileLine): void {
    if (!point) {
      point = this
    }

    const wall = Map.walls[point.row][point.col]
    if (wall) {
        wall.takeDamage(this.getDamage())
        this.alive = false
        if (wall.destructable) {
          Map.walls[point.row][point.col] = null
        }
    }
  }

  private getDamage(): number {
    return this.damage // TODO: Randomize this a bit
  }
}
