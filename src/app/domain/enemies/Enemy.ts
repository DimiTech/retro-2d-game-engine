import * as CONFIG from '@app/configuration/config.json'

import GameTime from '@app/infrastructure/GameTime'
import CollisionBox from '@app/infrastructure/CollisionBox'
import { PathNode } from '@app/infrastructure/Pathfinding'
import CreatureSprite from '@app/graphics/sprites/CreatureSprite'

import Creature from '@app/domain/Creature'
import CreatureState from '@app/domain/CreatureState'
import Player from '@app/domain/player/Player'
import Map from '@app/domain//map/Map'
import DamageNumbers, { DamageNumberFactory } from '@app/domain/widgets/DamageNumbers'

import SoundFX from '@app/audio/SoundFX'

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
  protected attackCooldown: number       // ms

  protected animationLengthAttack   : number // ms
  protected animationProgressAttack : number // ms
  protected animationLengthMove     : number // ms
  protected animationProgressMove   : number // ms

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

    // Widgets
    this.widgets.damageNumbers = new DamageNumbers()
  }

  public draw(player: Player): void {
    Object.values(this.widgets).forEach(widget => widget.render(player.x, player.y)) // Render widgets
  }

  public update(player: Player): void {
    Object.values(this.widgets).forEach(widget => widget.update()) // Update widgets
  }

  public isOnScreen(playerX: number, playerY: number): boolean {
    const offScreenOffset = CONFIG.TILE_SIZE * 2
    return (
      Math.abs(this.x - playerX) < CONFIG.CANVAS_WIDTH / 2 + offScreenOffset &&
      Math.abs(this.y - playerY) < CONFIG.CANVAS_HEIGHT / 2 + offScreenOffset
    )
  }

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

  public takeDamage(damageAmount: number): void {
    SoundFX.playEnemyHit()

    this.health -= damageAmount

    this.widgets.damageNumbers.push(DamageNumberFactory.create(this.x, this.y, this.collisionBox, damageAmount))

    if (this.health <= 0) {
      this.die()
    } else {
      SoundFX.playEnemyHit()
    }
  }

  public die() {
    SoundFX.playEnemyDeath()
    this.setState(CreatureState.Decaying)
  }

  protected dealDamage(p: Player) {
    p.takeDamage(this.getDamage())
  }

  // TODO: Implement damage range
  protected getDamage() {
    return 10
  }

  public setState(newState: CreatureState) {
    this.previousState = this.state
    this.state = newState
    this.resetAnimation()
  }

  // Move to Animation objects
  protected resetAnimation() {
    this.animationSpritePosition = 0
    this.animationProgressAttack = 0
    this.animationProgressMove = 0
  }
}
