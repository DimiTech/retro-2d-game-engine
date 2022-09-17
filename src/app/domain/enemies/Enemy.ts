import * as CONFIG from '@app/configuration/config.json'

import CollisionBox from '@app/infrastructure/CollisionBox'
import Creature from '@app/domain/Creature'
import Player from '@app/domain/player/Player'
import { PathNode } from '@app/infrastructure/Pathfinding'
import CreatureSprite from '@app/graphics/sprites/CreatureSprite'
import { getEnemiesOnScreen } from '../map/Map'

export default abstract class Enemy extends Creature {
  public alive: boolean = true
  public maxHealth: number = 100
  public health: number

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

  // TODO: The color strings can be moved to a single hash map in order to optimize & localize the color searches
  protected getHealthColor(): string {
    if (this.health <= this.maxHealth * 0.1) {
      return '#FF5700'
    } else if (this.health <= this.maxHealth * 0.2) {
      return '#FF7B00'
    } else if (this.health <= this.maxHealth * 0.3) {
      return '#FF9E00'
    } else if (this.health <= this.maxHealth * 0.4) {
      return '#FFC100'
    } else if (this.health <= this.maxHealth * 0.5) {
      return '#FFE400'
    } else if (this.health <= this.maxHealth * 0.6) {
      return '#FFF600'
    } else if (this.health <= this.maxHealth * 0.7) {
      return '#E5FF00'
    } else if (this.health <= this.maxHealth * 0.8) {
      return '#D4FF00'
    } else if (this.health <= this.maxHealth * 0.9) {
      return '#B0FF00'
    } else if (this.health < this.maxHealth) {
      return '#8DFF00'
    } else if (this.health === this.maxHealth) {
      return '#6AFF00'
    }
  }

  private initializeHealth(healthPercentage: number): void {
    if (healthPercentage < 0.0 || healthPercentage > 1.0) {
      healthPercentage = 1.0
    }
    this.health = this.maxHealth * healthPercentage
  }
}
