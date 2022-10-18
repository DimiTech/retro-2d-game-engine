import * as CONFIG from '@app/configuration/config.json'

import { KEYBOARD_KEYS } from '@app/peripherals/constants/KeyCodes'

import Canvas, { context } from '@app/infrastructure/Canvas'
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
import RangedWeapon from './weapons/RangedWeapon'
import RifleLine from './weapons/RifleLine'
import RifleCircle from './weapons/RifleCircle'

import DamageNumbers, { DamageNumberColors, DamageNumberFactory } from '@app/domain/widgets/DamageNumbers'

import SoundFX from '@app/audio/SoundFX'

export default class Player extends Creature {
  public alive = true
  public rotation = 0
  public sightLineLength = 10

  private AvailableWeapons: { [key: number]: RangedWeapon } = {
    1: new RifleCircle(),
    2: new RifleLine(),
  }

  private equipedWeapon: RangedWeapon = this.AvailableWeapons[1]

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

    Object.values(this.AvailableWeapons).forEach(w => w.update(this.x, this.y))

    Object.values(this.widgets).forEach(widget => widget.update()) // Update widgets
  }

  public draw(): void {
    const theta = this.calculateTheta()
    this.drawPlayer(theta)
    this.drawPlayerVisionRays(theta)

    Crosshair.draw()

    Object.values(this.AvailableWeapons).forEach(w => w.draw(this.x, this.y))
  }

  private _keydownHandler = (e: KeyboardEvent) => {
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
      case KEYBOARD_KEYS[1]:
        this.switchWeapons(1)
        break
      case KEYBOARD_KEYS[2]:
        this.switchWeapons(2)
        break
    }
  }
  public get keydownHandler() {
    return this._keydownHandler
  }
  public set keydownHandler(value) {
    this._keydownHandler = value
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

    if (CONFIG.DEBUG.PLAYER_WEAPON_DISPLAY) {
      this.debug_drawWeaponDisplay()
    }
  }

  private drawPlayerVisionRays(theta: number) {
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

  public setShooting(isShooting: boolean): void {
    Object.values(this.AvailableWeapons).forEach(w => w.setShooting(false))
    this.equipedWeapon.setShooting(isShooting)
  }

  private switchWeapons(weaponIndex: number) {
    this.equipedWeapon = this.AvailableWeapons[weaponIndex]
  }

  private die(): void {
    // TODO: Re-use CreatureState
    this.alive = false

    SoundFX.playPlayerDeath()
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

  private debug_drawWeaponDisplay() {
    context.beginPath()
      context.fillStyle = '#DD0000'
      context.font = '8px Monospace'
      const [ equippedWeaponIndex ] = Object.entries(this.AvailableWeapons).find(([, w]) => w === this.equipedWeapon)
      context.fillText(`Weapon: ${equippedWeaponIndex}`, 10, CONFIG.CANVAS_HEIGHT - 36)
    context.stroke()
  }
}
