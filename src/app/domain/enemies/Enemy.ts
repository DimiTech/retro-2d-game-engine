import * as CONFIG from '@app/configuration/config.json'

import CollisionBox from '@app/infrastructure/CollisionBox'
import Creature from '@app/domain/Creature'
import Player from '@app/domain/player/Player'
import { PathNode } from '@app/infrastructure/Pathfinding'
import CreatureSprite from '@app/graphics/sprites/CreatureSprite'
import { getEnemiesOnScreen } from '../map/Map'

export default abstract class Enemy extends Creature {
  public alive: boolean = true

  protected stuck: boolean

  protected distanceFromPlayer: number
  protected thereAreObstaclesBetweenPlayerAndThisEnemy: boolean
  protected pathfindingInterval: number = 0
  protected pathfindingPeriod: number = 30
  protected pathfindingNodes: PathNode[]
  protected shortestPath: PathNode[] = []

  protected sprite: CreatureSprite

  constructor(
    public x: number,
    public y: number,
    collisionBox: CollisionBox,
    maxSpeed: number,
    healthPercentage: number,
  ) {
    super()
    this.initializeHealth(healthPercentage)

    this.maxSpeed = maxSpeed
    this.maxSpeedDiagonal = Math.round(Math.sin(45) * this.maxSpeed)

    this.collisionBox = collisionBox
  }

  public abstract draw(player: Player): void
  public abstract update(player: Player, enemies: Enemy[]): void

  public isOnScreen(playerX: number, playerY: number): boolean {
    const offScreenOffset = CONFIG.TILE_SIZE * 2
    return (
      Math.abs(this.x - playerX) < CONFIG.CANVAS_WIDTH / 2 + offScreenOffset &&
      Math.abs(this.y - playerY) < CONFIG.CANVAS_HEIGHT / 2 + offScreenOffset
    )
  }

  public abstract takeDamage(damageAmount: number): void
  protected abstract advanceAnimation(): void

  protected checkForCollisionWithPlayer(player: Player): void {
    const nextEnemyState = {
      x: this.nextX,
      y: this.nextY,
      collisionBox: this.collisionBox,
    }
    this.checkIfBlockedByCreature(player, nextEnemyState)
  }

  protected checkForCollisionWithOtherEnemies(player: Player): void {
    const nextEnemyState = {
      x: this.nextX,
      y: this.nextY,
      collisionBox: this.collisionBox,
    }
    const enemiesInScreenRangeFromThis = getEnemiesOnScreen(this.x, this.y)

    enemiesInScreenRangeFromThis.forEach((e) => {
      if (this !== e) {
        this.checkIfBlockedByCreature(e, nextEnemyState)
      }
    })
  }

  protected checkIfStuck(): boolean {
    const xIsStatic = this.prevX.every((x) => x === this.prevX[0])
    const yIsStatic = this.prevY.every((y) => y === this.prevY[0])
    if (xIsStatic && yIsStatic) {
      return true
    } else {
      return false
    }
  }
}
