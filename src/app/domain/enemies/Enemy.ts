import * as CONFIG from '@app/configuration/config.json'

import GameTime from '@app/infrastructure/GameTime'
import CollisionBox from '@app/infrastructure/CollisionBox'
import { PathNode } from '@app/infrastructure/Pathfinding'
import CreatureSprite from '@app/graphics/sprites/CreatureSprite'

import Creature from '@app/domain/Creature'
import Player from '@app/domain/player/Player'

import SoundFX from '@app/audio/SoundFX'

import Map from '../map/Map'

export default abstract class Enemy extends Creature {
  protected stuck: boolean // TODO: Use stuck for something?

  protected distanceFromTarget: number
  protected thereAreObstaclesBetweenPlayerAndThisEnemy: boolean
  protected pathfindingTimer: number = 0
  protected pathfindingInterval: number = 500 // ms
  protected pathfindingNodes: PathNode[]
  protected shortestPath: PathNode[] = []

  protected sprite: CreatureSprite

  // TODO: Move this to Weapon
  protected readonly attackSpeed: number // seconds
  protected attackCooldown: number       // milliseconds

  constructor(
    x: number,
    y: number,
    collisionBox: CollisionBox,
    speed: number,
    healthPercentage: number,
  ) {
    super(x, y, collisionBox, speed, healthPercentage)

    // TODO: Move this function to Weapon
    this.resetAttackCooldown()
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
    const enemiesInScreenRangeFromThis = Map.getEnemiesOnScreen(this.x, this.y)

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
    if (this.attackCooldown <= 0) {
      this.resetAttackCooldown()

      SoundFX.playSMG() // TODO: Change the SFX
      this.dealDamage(p)
    } else {
      this.attackCooldown -= GameTime.frameElapsedTime
    }
  }

  protected resetAttackCooldown() {
    this.attackCooldown = (1000 * this.attackSpeed) / CONFIG.GAME_SPEED
  }

  protected dealDamage(p: Player) {
    p.takeDamage(this.getDamage())
  }

  // TODO: Implement damage range
  protected getDamage() {
    return 10
  }
}
