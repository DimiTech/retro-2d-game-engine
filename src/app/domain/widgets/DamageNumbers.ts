import * as CONFIG from '@app/configuration/config.json'

import Game from "@app/infrastructure/game/Game"
import GameTime from '@app/infrastructure/GameTime'
import CollisionBox from '@app/infrastructure/CollisionBox'
import GAME_STATES from "@app/infrastructure/game/game_states/GameStates"
import Canvas, { context } from '@app/infrastructure/Canvas'

import AttackEdgeCases from '@app/domain/AttackEdgeCases'
export interface IWidget {
  update(): void
  render(playerX: number, playerY: number): void
}

export enum DamageNumberColors {
  red    = '220, 50, 50',
  yellow = '180, 180, 50',
  gray   = '180, 180, 180',
}

export class DamageNumberFactory {
  public static create(
    x: number,
    y: number,
    collisionBox: CollisionBox,
    damage: number,
    color: DamageNumberColors = DamageNumberColors.red,
    attackEdgeCase: AttackEdgeCases = null,
  ): DamageNumber {
    return new DamageNumber(
      x,
      y - collisionBox.halfHeight * 0.9,
      (Math.random() * collisionBox.height)       - collisionBox.halfHeight,
      (Math.random() * collisionBox.width  / 1.5) - collisionBox.halfWidth / 1.5,
      attackEdgeCase ? attackEdgeCase : damage.toString(),
      color
    )
  }
}

export class DamageNumber {
  constructor(
    public x: number,
    public y: number,
    protected randomFactorX: number,
    protected randomFactorY: number,
    private damage: string,
    private color: string
  ) {
    this.damageTextHalfWidth = (this.damage.length * this.fontWidth) / 2
  }

  public animationFinished = false

  // Adjust for animation feel
  private animationElapsed              = 0   // Milliseconds
  private animationLength               = 800 // Milliseconds
  private animationCompletionPercentage = 0.0 // 0.0 - 1.0
  private maxHeight                     = 30  // px

  public advanceAnimation() {
    this.animationElapsed += GameTime.elapsedTimeFactor
    this.animationCompletionPercentage = this.animationElapsed / this.animationLength
    if (this.animationHasFinished()) {
      this.animationFinished = true
    }
  }
  public animationHasFinished() {
    return (this.animationElapsed >= this.animationLength)
  }

  private fontSize = 8
  private font = `${this.fontSize}px Monospace`
  private fontWidth = this.fontSize / 2
  private damageTextHalfWidth: number = 0

  public draw(playerX: number, playerY: number) {
    context.beginPath()
      const opacity = 1 - this.animationCompletionPercentage
      context.fillStyle = `rgba(${this.color}, ${opacity})`
      context.font = this.font
      context.fillText(
        `${this.damage}`,
        this.randomFactorX + (this.x + Canvas.center.x - playerX) - this.damageTextHalfWidth,
        this.randomFactorY + (this.y + Canvas.center.y - playerY) - (this.animationCompletionPercentage * this.maxHeight),
      )
    context.stroke()
  }
}

export default class DamageNumbers implements IWidget {

  private damageNumbers: DamageNumber[] = []

  public update(): void {
    if (Game.stateManager.getState() === GAME_STATES.PLAYING) {
      this.damageNumbers.forEach((dmgNum, i) => {
        dmgNum.advanceAnimation()

        if (dmgNum.animationFinished === true) {
          this.damageNumbers.splice(i, 1) // Remove the DamageNumber
        }
      })
    }
  }

  public render(playerX: number, playerY: number): void {
    if (CONFIG.FEATURES.DAMAGE_NUMBERS_SHOW) {
      this.feature_drawDamageNumbers(playerX, playerY)
    }
  }

  public push(damageNumber: DamageNumber): void {
    this.damageNumbers.push(damageNumber)
  }


  public feature_drawDamageNumbers(playerX: number, playerY: number) {
    this.damageNumbers.forEach(dmgNumber => dmgNumber.draw(playerX, playerY))
  }
}

export type Widget = IWidget & DamageNumbers