import * as CONFIG from '@app/configuration/config.json'

import Canvas from '@app/infrastructure/Canvas'
import Point from '@app/infrastructure/geometry/Point'

import Map from '@app/domain/map/Map'
import Enemy from '@app/domain/enemies/Enemy'
import CreatureState from '@app/domain/CreatureState'
import { randomInRange } from '@app/infrastructure/math/MathUtils'

interface IntermediatePoint {
  x: number
  y: number
  row: number
  col: number
}

export default abstract class Projectile {
  public speed: number
  public minDamage: number
  public maxDamage: number
  public alive: boolean
  public row: number
  public col: number
  protected previousX: number
  protected previousY: number

  public abstract draw(playerX: number, playerY: number): void

  /*
   * Intermediate positions/points solve the bullet phasing problem
   */
  protected numberOfIntermediatePositions = 3 // More intermediate points give more precision, 3 are just fine
  protected intermediatePositions: IntermediatePoint[] = []

  constructor(
    public x: number,
    public y: number,
    public directionX: number,
    public directionY: number,
  ) {
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

  // TODO: There could be space for optimization here
  //       Instead of finding the nearest enemies every time, maybe just take
  //       the enemies that are visible on the screen (+ some offset)?
  protected getNearbyEnemies(): Enemy[] {
    return [ ...Map.enemies ].filter(e => (
      Math.abs(e.x - this.x) <= CONFIG.TILE_SIZE &&
      Math.abs(e.y - this.y) <= CONFIG.TILE_SIZE
    ))
  }

  protected isOffScreen(playerX: number, playerY: number): boolean {
    return (
      this.x < playerX - Canvas.center.x - CONFIG.TILE_SIZE || this.x > playerX + Canvas.center.x + CONFIG.TILE_SIZE ||
      this.y < playerY - Canvas.center.y - CONFIG.TILE_SIZE || this.y > playerY + Canvas.center.y + CONFIG.TILE_SIZE
    )
  }

  protected checkCollisionWithEnemies(nearbyEnemies: Enemy[], point?: Point): void {
    if (!point) {
      point = this as Point
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

  protected checkCollisionWithWall(point?: Point): void {
    if (!point) {
      point = this as Point
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

  protected getDamage(): number {
    return randomInRange(this.minDamage, this.maxDamage)
  }
}