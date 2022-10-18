import * as CONFIG from '@app/configuration/config.json'

import { context } from '@app/infrastructure/Canvas'
import Game from '@app/infrastructure/game/Game'
import GameTime from '@app/infrastructure/GameTime'
import GAME_STATES from '@app/infrastructure/game/game_states/GameStates'

import PortalObject from './PortalObject'

export default class Portal extends PortalObject {
  public isOpen = false

  protected static openColor   = '50, 120, 50'
  protected static closedColor = '180, 50, 50'
  protected static opacityBaseline = 0.05
  protected static opacityRange    = 0.2

  private opacity = Portal.opacityRange

  // Adjust for animation feel
  private animationElapsed              = 0    // Milliseconds
  private animationLength               = 4000 // Milliseconds
  private animationCompletionPercentage = 0.0  // 0.0 - 1.0

  draw(): void {
    if (Game.stateManager.getState() === GAME_STATES.PLAYING) {
      this.advanceAnimation()
    }

    context.fillStyle = this.getColor()
    context.beginPath()
      context.rect(
        this.x,
        this.y,
        CONFIG.TILE_SIZE,
        CONFIG.TILE_SIZE
      )
    context.fill()
  }

  public advanceAnimation() {
    this.animationElapsed = (this.animationElapsed + GameTime.elapsedTimeFactor) % this.animationLength

    this.animationCompletionPercentage = this.animationElapsed / this.animationLength

    const sineFunction = Math.sin(this.animationCompletionPercentage * (Math.PI * 2)) // returns: -1 to 1 (approximately, because of float arithmetic)

    this.opacity = Portal.opacityBaseline + ((sineFunction + 1) / 2) * Portal.opacityRange
  }

  public open() {
    this.isOpen = true
  }

  private getColor(): string {
    if (this.isOpen) {
      return `rgba(${Portal.openColor}, ${this.opacity})`
    }
    else {
      return `rgba(${Portal.closedColor}, ${this.opacity})`
    }
  }
}
