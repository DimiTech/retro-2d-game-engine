import * as CONFIG from '@app/configuration/config.json'

import { KEYBOARD_KEYS } from '@app/peripherals/constants/KeyCodes'

import Game from '@app/infrastructure/game/Game'
import { context } from '@app/infrastructure/Canvas'

import IGameState from './IGameState'
import GAME_STATES from './GameStates'

export default class GameStateVictory implements IGameState {
  public enter(): void {
    window.addEventListener('keydown', this.handleEnterPress)
  }
  public exit(): void {
    window.removeEventListener('keydown', this.handleEnterPress)
  }

  public update(): void {
    return
  }

  public render(): void {
    this.drawGameOverScreen()
  }

  private handleEnterPress = (e: KeyboardEvent) => {
    switch (e.keyCode) {
      case KEYBOARD_KEYS.ENTER:
        Game.stateManager.setState(GAME_STATES.MAIN_MENU)
        break
    }
  }

  private drawGameOverScreen(): void {
    context.beginPath()
      context.fillStyle = '#00dd00'
      context.font = '32px Monospace'
      context.fillText(
        'VICTORY!',
        CONFIG.CANVAS_WIDTH / 2 - 80,
        (CONFIG.CANVAS_HEIGHT / 2) + 10
      )
    context.stroke()
  }
}
