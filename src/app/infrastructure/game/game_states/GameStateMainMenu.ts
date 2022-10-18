import * as CONFIG from '@app/configuration/config.json'

import { KEYBOARD_KEYS } from '@app/peripherals/constants/KeyCodes'

import Game from '@app/infrastructure/game/Game'
import GameTime from '@app/infrastructure/GameTime'
import { context } from '@app/infrastructure/Canvas'

import IGameState from './IGameState'
import GAME_STATES from './GameStates'

export default class GameStateMainMenu implements IGameState {
  private animationProgress = 0
  private animationLength: number = GameTime.ONE_SECOND
  private instructionsVisible = true

  public enter(): void {
    window.addEventListener('keydown', this.handleMenuSelection)
  }
  public exit(): void {
    window.removeEventListener('keydown', this.handleMenuSelection)
  }

  public update(): void {
    this.animationProgress = (this.animationProgress + GameTime.frameElapsedTime) % this.animationLength
    if (this.animationProgress >= this.animationLength / 2) {
      this.instructionsVisible = false
    } else {
      this.instructionsVisible = true
    }
    return
  }

  public render(): void {
    this.drawMainMenu()
  }

  private drawMainMenu(): void {
    context.beginPath()
      context.fillStyle = '#FFC100'

      context.font = '12px Monospace'
      context.fillText('Retro 2D Top-Down Game Engine', CONFIG.CANVAS_WIDTH / 2 - 106, CONFIG.CANVAS_HEIGHT / 2 - 34)
      if (this.instructionsVisible) {
        context.font = '20px Monospace'
        context.fillText('Press Enter to start', CONFIG.CANVAS_WIDTH / 2 - 118, CONFIG.CANVAS_HEIGHT / 2 + 10)
      }
    context.stroke()
  }

  private handleMenuSelection = (e: KeyboardEvent) => {
    switch (e.keyCode) {
      case KEYBOARD_KEYS.ENTER:
        Game.stateManager.setState(GAME_STATES.PLAYING)
        break
    }
  }
}
