import * as CONFIG from '@app/configuration/config.json'

import { KEYBOARD_KEYS } from '@app/peripherals/constants/KeyCodes'

import Canvas, { context } from '@app/infrastructure/Canvas'
import Raycaster from '@app/infrastructure/Raycaster'
import CollisionBox, {
  collisionBoxesIntersect,
} from '@app/infrastructure/CollisionBox'
import { angleBetweenPoints } from '@app/infrastructure/geometry/Point'

import Creature from '@app/domain/Creature'
import Map from '@app/domain/map/Map'
import Crosshair from './Crosshair'
import Projectile from './Projectile'

import SoundFX from '@app/audio/SoundFX'

export default class Player extends Creature {
  public alive: boolean = true
  public rotation: number = 0
  public sightLineLength = 10
  private shooting = false
  private shootingCooldown = 6
  private projectiles: Projectile[] = []

  constructor(public x: number, public y: number) {
    super()
    this.initializeHealth()

    this.maxSpeed = 2
    this.maxSpeedDiagonal = Math.round(Math.sin(45) * this.maxSpeed) // TODO: Extract function

    this.collisionBox = new CollisionBox(12, 12)

    this.updateMapPosition()
  }

  public update(): void {
    this.resetBlocked()
    this.calculateNextCoordinates()

    this.checkForCollisionWithEnemies()
    this.move()
    this.adjustCollisionWithWalls()
    this.updateMapPosition()
    this.updateTileDeltas()
    this.shoot()
    this.projectiles.forEach((p, i) => {
      p.update(this.x, this.y)
      if (p.alive === false) {
        this.projectiles.splice(i, 1) // Remove the projectile
      }
    })
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
        break
      case KEYBOARD_KEYS.a:
        this.moving.left = true
        break
      case KEYBOARD_KEYS.s:
        this.moving.down = true
        break
      case KEYBOARD_KEYS.d:
        this.moving.right = true
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

  public shoot(): void {
    if (this.shooting && this.shootingCooldown <= 0) {
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
      this.shootingCooldown = 6

      SoundFX.playSMG()
    } else {
      --this.shootingCooldown
    }
  }

  public setShooting(isShooting: boolean): void {
    this.shooting = isShooting
  }

  public takeDamage(damageAmount: number): void {
    this.health = this.health - damageAmount
    if (this.health <= 0) {
      this.die()
    }
  }

  private move(): void {
    if (this.moving.left && !this.blocked.left) {
      if (this.moving.up || this.moving.down) {
        this.x -= this.maxSpeedDiagonal
      } else {
        this.x -= this.maxSpeed
      }
    }
    if (this.moving.right && !this.blocked.right) {
      if (this.moving.up || this.moving.down) {
        this.x += this.maxSpeedDiagonal
      } else {
        this.x += this.maxSpeed
      }
    }
    if (this.moving.up && !this.blocked.up) {
      if (this.moving.left || this.moving.right) {
        this.y -= this.maxSpeedDiagonal
      } else {
        this.y -= this.maxSpeed
      }
    }
    if (this.moving.down && !this.blocked.down) {
      if (this.moving.left || this.moving.right) {
        this.y += this.maxSpeedDiagonal
      } else {
        this.y += this.maxSpeed
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

  // TODO: Not DRY... generalize this functionality
  private updateMapPosition(): void {
    this.row = Math.floor(this.y / CONFIG.TILE_SIZE)
    this.col = Math.floor(this.x / CONFIG.TILE_SIZE)
  }

  private updateTileDeltas(): void {
    this.deltas.dyTop = this.y % CONFIG.TILE_SIZE
    this.deltas.dyBottom = CONFIG.TILE_SIZE - this.deltas.dyTop
    this.deltas.dxLeft = this.x % CONFIG.TILE_SIZE
    this.deltas.dxRight = CONFIG.TILE_SIZE - this.deltas.dxLeft
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
        this.checkIfBlockedByCreature(e, nextPlayerState)
      })
    }
  }

  private die(): void {
    // TODO: Re-use CreatureState
    this.alive = false
  }
}
