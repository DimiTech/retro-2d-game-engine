import * as CONFIG from '@app/configuration/config.json'

import Creature from '@app/domain/Creature'
import Player from '@app/domain/player/Player'
import CollisionBox from '@app/infrastructure/CollisionBox'
import { PathNode } from '@app/infrastructure/Pathfinding'
import CreatureSprite from '@app/graphics/sprites/CreatureSprite'
import SoundFX from '@app/audio/SoundFX'

import { getEnemiesOnScreen } from '../map/Map'
import CreatureState from '../CreatureState'

export default abstract class Enemy extends Creature {
  protected stuck: boolean // TODO: Use stuck for something?

  protected distanceFromTarget: number
  protected thereAreObstaclesBetweenPlayerAndThisEnemy: boolean
  protected pathfindingInterval: number = 0
  protected pathfindingPeriod: number = 30
  protected pathfindingNodes: PathNode[]
  protected shortestPath: PathNode[] = []

  protected sprite: CreatureSprite

  protected readonly attackSpeed: number // Frames
  protected attackCooldown: number

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

    this.attackCooldown = this.attackSpeed // TODO: Extract to initializeAttackParameters() or somehting...
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

  protected targetInRange(target: Creature) {
    const sumOfCollisionBoxHalfDiagonals = (target.collisionBox.halfWidth + this.collisionBox.halfWidth) * Math.sqrt(2)
    return this.distanceFromTarget < sumOfCollisionBoxHalfDiagonals
  }
  
  protected resetAttackCooldown() {
    this.attackCooldown = this.attackSpeed
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

  protected attack(p: Player): void {
    if (this.state === CreatureState.Attacking && this.attackCooldown <= 0) {
      this.resetAttackCooldown()

      SoundFX.playSMG() // TODO: Change the SFX
      this.dealDamage(p)
    } else {
      --this.attackCooldown
    }
  }

  protected dealDamage(p: Player) {
    p.takeDamage(this.getDamage())
  }

  // TODO: Implement damage range
  protected getDamage() {
    return 10
  }
}
