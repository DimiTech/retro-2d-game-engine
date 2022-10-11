import * as CONFIG from '@app/configuration/config.json'

import { KEYBOARD_KEYS } from '@app/peripherals/constants/KeyCodes'

import Game from '@app/infrastructure/game/Game'
import { context } from '@app/infrastructure/Canvas'

import IGameState from './IGameState'
import GAME_STATES from './GameStates'

import Level, { LevelTimer } from '@app/domain/Level'

export default class GameStateLevelCleared implements IGameState {
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
    this.drawLevelClearedStatistics()
  }

  private handleEnterPress = (e: KeyboardEvent) => {
    if (e.keyCode === KEYBOARD_KEYS.ENTER) {
      if (Level.isLastLevel()) {
        Level.resetToStartingLevel()
        Game.stateManager.setState(GAME_STATES.VICTORY)  
      } else {
        Level.nextLevel()
        Game.stateManager.setState(GAME_STATES.PLAYING)
      }
    }
  }

  private drawLevelClearedStatistics(): void {
    context.beginPath()
      // Title
      context.fillStyle = '#5555ff'
      context.font = '22px Monospace'
      context.fillText(
        `Level ${Level.currentLevel} Cleared!`,
        CONFIG.CANVAS_WIDTH / 2 - 100,
        (CONFIG.CANVAS_HEIGHT / 2)
      )
      
      // Level Time
      context.font = '16px Monospace'
      context.fillStyle = '#9999ff'
      context.fillText(
        `Time: ${Math.round(LevelTimer.timeSpentOnCurrentLevel / 1000)} seconds`,
        CONFIG.CANVAS_WIDTH / 2 - 100,
        (CONFIG.CANVAS_HEIGHT / 2) + 30
      )
    context.stroke()
  }
}
