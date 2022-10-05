import * as CONFIG from '@app/configuration/config.json'

import { KEYBOARD_KEYS } from '@app/peripherals/constants/KeyCodes'

import { context } from '@app/infrastructure/Canvas'
import Game from '@app/infrastructure/game/Game'
import IGameState from './IGameState'
import GAME_STATES from './GameStates'

export default class GameStatePaused implements IGameState {
  public enter(): void {
    window.addEventListener('keydown', this.pauseHandler)
  }

  public exit(): void {
    window.removeEventListener('keydown', this.pauseHandler)
  }

  public update(): void {
    return
  }

  public render(): void {
    GAME_STATES.PLAYING.render()
    this.drawPauseMenu()
  }

  private pauseHandler = (e: KeyboardEvent) => {
    switch (e.keyCode) {
      case KEYBOARD_KEYS.ESC:
        e.preventDefault()
        GAME_STATES.PLAYING.destroyGame()
        Game.stateManager.setState(GAME_STATES.MAIN_MENU)
        break
      case KEYBOARD_KEYS.p:
        Game.stateManager.setState(GAME_STATES.PLAYING)
        break
    }
  }

  private drawPauseMenu(): void {
    context.beginPath()
      context.fillStyle = '#FFC100'
      context.font = '20px Monospace'

      context.fillText(`Paused`, CONFIG.CANVAS_WIDTH / 2 - 36, CONFIG.CANVAS_HEIGHT / 2 - 54)
      context.font = '12px Monospace'
      context.fillText('  p - Resume',    CONFIG.CANVAS_WIDTH / 2 - 50, CONFIG.CANVAS_HEIGHT / 2 - 34)
      context.fillText('ESC - Main Menu', CONFIG.CANVAS_WIDTH / 2 - 50, CONFIG.CANVAS_HEIGHT / 2 - 18)
    context.stroke()
  }
}
