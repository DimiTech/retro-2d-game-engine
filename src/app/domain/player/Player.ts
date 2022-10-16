import * as CONFIG from '@app/configuration/config.json'

import { KEYBOARD_KEYS } from '@app/peripherals/constants/KeyCodes'

import Canvas, { context } from '@app/infrastructure/Canvas'
import GameTime from '@app/infrastructure/GameTime'
import Raycaster from '@app/infrastructure/Raycaster'
import CollisionBox, {
  collisionBoxesIntersect,
} from '@app/infrastructure/CollisionBox'
import { angleBetweenPoints } from '@app/infrastructure/geometry/Point'

import Creature from '@app/domain/Creature'
import CreatureState from '@app/domain/CreatureState'
import AttackEdgeCases from '@app/domain/AttackEdgeCases'
import Map from '@app/domain/map/Map'
import Crosshair from './Crosshair'
import Projectile from './Projectile'

import DamageNumbers, { DamageNumberColors, DamageNumberFactory } from '@app/domain/widgets/DamageNumbers'

import SoundFX from '@app/audio/SoundFX'

export default class Player extends Creature {
  public alive: boolean = true
  public rotation: number = 0
  public sightLineLength = 10
  private shooting = false

  // TODO: Adjust for attack feeling
  private attackSpeed = 0.1 // seconds
  private attackCooldown = 0
  private maxAttackCooldown = (1000 * this.attackSpeed) / CONFIG.GAME_SPEED

  private projectiles: Projectile[] = []

  constructor(public x: number, public y: number) {
    super(x, y, new CollisionBox(12, 12), 0.18, 1)

    // Widgets
    if (CONFIG.FEATURES.DAMAGE_NUMBERS_ON_PLAYER) {
      this.widgets.damageNumbers = new DamageNumbers() // TODO: Move to Creature?
    }
  }

  public update(): void {
    this.resetBlocked()
    this.calculateNextCoordinates()

    this.checkForCollisionWithEnemies()
    this.move()
    this.adjustCollisionWithWalls() // Must come after move()
    this.updateTileDeltas()         // Must come after adjustCollisionWithWalls()
    this.updateMapPosition()        // Must come after adjustCollisionWithWalls()
    this.shoot()
    this.projectiles.forEach((p, i) => {
      p.update(this.x, this.y)
      if (p.alive === false) {
        this.projectiles.splice(i, 1) // Remove the projectile
      }
    })
    Object.values(this.widgets).forEach(widget => widget.update()) // Update widgets
  }

  public draw(): void {
    const theta = this.calculateTheta()
    this.drawPlayer(theta)
    this.drawPlayerVisionRay(theta)

    // TODO: Just for testing purposes. Delete this.
    if (CONFIG.DEBUG.PLAYER_VISION_RAY_SHOTGUN) {
      this.drawPlayerVisionRay(theta - 0.45)
      this.drawPlayerVisionRay(theta - 0.4)
      this.drawPlayerVisionRay(theta - 0.35)
      this.drawPlayerVisionRay(theta - 0.3)
      this.drawPlayerVisionRay(theta - 0.25)
      this.drawPlayerVisionRay(theta - 0.2)
      this.drawPlayerVisionRay(theta - 0.15)
      this.drawPlayerVisionRay(theta - 0.1)
      this.drawPlayerVisionRay(theta - 0.05)
      this.drawPlayerVisionRay(theta + 0.05)
      this.drawPlayerVisionRay(theta + 0.1)
      this.drawPlayerVisionRay(theta + 0.15)
      this.drawPlayerVisionRay(theta + 0.2)
      this.drawPlayerVisionRay(theta + 0.25)
      this.drawPlayerVisionRay(theta + 0.3)
      this.drawPlayerVisionRay(theta + 0.35)
      this.drawPlayerVisionRay(theta + 0.4)
      this.drawPlayerVisionRay(theta + 0.45)
    }

    Crosshair.draw()
    this.drawProjectiles()
  }

  public keydownHandler = (e: KeyboardEvent) => {
    switch (e.keyCode) {
      case KEYBOARD_KEYS.w:
        this.moving.up = true
        this.movingDirections.up = true
        break
      case KEYBOARD_KEYS.a:
        this.moving.left = true
        this.movingDirections.left = true
        break
      case KEYBOARD_KEYS.s:
        this.moving.down = true
        this.movingDirections.down = true
        break
      case KEYBOARD_KEYS.d:
        this.moving.right = true
        this.movingDirections.right = true
        break
    }
  }
  public keyupHandler = (e: KeyboardEvent) => {
    switch (e.keyCode) {
      case KEYBOARD_KEYS.w:
        this.moving.up = false
        break
      case KEYBOARD_KEYS.a:
        this.moving.left = false
        break
      case KEYBOARD_KEYS.s:
        this.moving.down = false
        break
      case KEYBOARD_KEYS.d:
        this.moving.right = false
        break
      }
  }

  public setShooting(isShooting: boolean): void {
    this.shooting = isShooting
  }

  public shoot(): void {
    if (this.attackCooldown >= 0) {
      this.attackCooldown -= GameTime.frameElapsedTime
      if (this.attackCooldown < 0) {
        this.attackCooldown = 0
      }
    }

    if (this.shooting === false) {
      return
    }

    if (this.attackCooldown <= 0) {
      const dx = Canvas.mousePosition.x - Canvas.center.x
      const dy = Canvas.mousePosition.y - Canvas.center.y
      let xVel = dx / (Math.abs(dx) + Math.abs(dy))
      let yVel = dy / (Math.abs(dx) + Math.abs(dy))

      // TODO: GAME FEATURE: Insert accuracy skill to reduce bullet motion randomness
      // TODO: Fix the problem with different bullet speeds caused by randomness
      if (CONFIG.FEATURES.SCATTER_PROJECTILES) {
        const randomFactorX = Math.random() * 0.1 - 0.05
        const randomFactorY = Math.random() * 0.1 - 0.05
        xVel += randomFactorX
        yVel += randomFactorY
      }

      this.projectiles.push(new Projectile(this.x, this.y, xVel, yVel))
      this.resetAttackCooldown()

      SoundFX.playSMG()
    }
  }

  protected resetAttackCooldown() {
    this.attackCooldown = this.maxAttackCooldown
  }

  public takeDamage(damageAmount: number, attackEdgeCase: AttackEdgeCases = null): void {
    this.health = this.health - damageAmount

    if (this.widgets.damageNumbers) {
      this.widgets.damageNumbers.push(
        DamageNumberFactory.create(this.x, this.y, this.collisionBox, damageAmount, DamageNumberColors.gray, attackEdgeCase)
      )
    }

    if (this.health <= 0) {
      this.die()
    }
    else {
      switch (attackEdgeCase) {
        case null:
          SoundFX.playPlayerHit()
          break
      }
    }
  }

  private calculateTheta(): number {
    const theta = angleBetweenPoints(Canvas.mousePosition, Canvas.center)
    context.fillStyle = '#44FF44'
    context.fillText(`θ = ${theta.toFixed(2)}`, 10, 56)
    return theta
  }

  private drawPlayer(theta: number): void {
    // Draw gun
    context.beginPath()
    context.fillStyle = '#00AA00'
    context.font = '10px Monospace'

    context.fillText(`p (${this.x}, ${this.y})`, 10, 20)

    context.strokeStyle = '#523DA5'
    context.lineWidth = 2
    context.moveTo(Canvas.center.x, Canvas.center.y)
    context.lineTo(
      Canvas.center.x + this.sightLineLength * Math.cos(theta),
      Canvas.center.y + this.sightLineLength * Math.sin(theta),
    )
    context.stroke()

    if (CONFIG.DEBUG.PLAYER_COLLISION_BOX) {
      this.debug_drawCollisionBox()
    }

    Object.values(this.widgets).forEach(widget => widget.render(this.x, this.y)) // Render widgets
  }

  private debug_drawCollisionBox() {
    context.strokeStyle = this.getHealthColor()

    context.lineWidth = 0.5
    context.beginPath()
    // Since this is just for debugging purposes, there is no need to
    // cache the vertex calculations.
    context.moveTo(
      -0.5 + Canvas.center.x - this.collisionBox.halfWidth,
      -0.5 + Canvas.center.y - this.collisionBox.halfHeight,
    )
    context.lineTo(
       0.5 + Canvas.center.x + this.collisionBox.halfWidth,
      -0.5 + Canvas.center.y - this.collisionBox.halfHeight,
    )
    context.lineTo(
      0.5 + Canvas.center.x + this.collisionBox.halfWidth,
      0.5 + Canvas.center.y + this.collisionBox.halfHeight,
    )
    context.lineTo(
      -0.5 + Canvas.center.x - this.collisionBox.halfWidth,
       0.5 + Canvas.center.y + this.collisionBox.halfHeight,
    )
    context.lineTo(
      -0.5 + Canvas.center.x - this.collisionBox.halfWidth,
      -0.5 + Canvas.center.y - this.collisionBox.halfHeight,
    )
    context.stroke()
  }

  private drawPlayerVisionRay(theta: number) {
    const { hitPoint, wallHit } = Raycaster.cast(this, theta)
    if (hitPoint) {
      if (wallHit) {
        Raycaster.drawRay(hitPoint, '#FF4444')
      } else {
        Raycaster.drawRay(hitPoint)
      }
    }
  }

  private drawProjectiles() {
    this.projectiles.forEach((p) => p.draw(this.x, this.y))
  }

  private checkForCollisionWithEnemies(): void { // TODO: Extract to Creature?
    const nextPlayerState = {
      x: this.nextX,
      y: this.nextY,
      collisionBox: this.collisionBox,
    }
    const enemiesOnScreen = Map.getEnemiesOnScreen(this.x, this.y)

    if (
      enemiesOnScreen.some((e) => collisionBoxesIntersect(e, nextPlayerState))
    ) {
      enemiesOnScreen.forEach((e) => {
        if (e.state >= CreatureState.Dying) {
          return
        }
        this.checkIfBlockedByCreature(e, nextPlayerState)
      })
    }
  }

  private die(): void {
    // TODO: Re-use CreatureState
    this.alive = false

    SoundFX.playPlayerDeath()
  }
}
