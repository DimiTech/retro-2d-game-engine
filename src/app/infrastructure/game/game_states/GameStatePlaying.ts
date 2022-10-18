import * as CONFIG from '@app/configuration/config.json'

import IGameState from './IGameState'
import GAME_STATES from './GameStates'

import Game from '@app/infrastructure/game/Game'
import Canvas from '@app/infrastructure/Canvas'

import Keyboard from '@app/peripherals/Keyboard'
import { KEYBOARD_KEYS } from '@app/peripherals/constants/KeyCodes'
import Mouse from '@app/peripherals/Mouse'
import Gamepads from '@app/peripherals/Gamepads'

import Map from '@app/domain/map/Map'
import Player from '@app/domain/player/Player'
import Level, { LevelTimer } from '@app/domain/Level'

export default class GameStatePlaying implements IGameState {
  private player: Player
  private map: Map

  public enter(previousState: IGameState): void {
    if (previousState !== GAME_STATES.PAUSED) {
      this.startNewGame()
    }
    this.setupOwnEventListeners()
  }

  private setupOwnEventListeners() {
    window.onblur = () => {
      Game.stateManager.setState(GAME_STATES.PAUSED)
    }
    window.addEventListener('keydown', this.pauseHandler)
  }

  public exit(nextState: IGameState): void {
    this.clearOwnEventListeners()
    if (nextState !== GAME_STATES.PAUSED) {
      this.destroyGame()
    }
  }

  private clearOwnEventListeners() {
    window.onblur = null
    window.removeEventListener('keydown', this.pauseHandler)
  }

  public update(): void {
    if (this.player.alive) {
      Canvas.updateMousePosition()
      Gamepads.update(this.player)
      this.player.update()
      this.map.update()
      this.checkForLevelClearedCondition()

      LevelTimer.incrementTimeSpentOnCurrentLevel()
    } else {
      Level.resetToStartingLevel()
      Game.stateManager.setState(GAME_STATES.GAME_OVER)
    }
  }

  public render(): void {
    this.map.draw()
    this.player.draw()
    if (CONFIG.DEBUG.SHOW_LEVEL_TIME) {
      LevelTimer.debug_displayTimeSpentOnCurrentLevel()
    }
  }

  private startNewGame(): void {
    this.map = new Map()
    this.player = this.map.player

    Keyboard.addListenerKeydown(this.player.keydownHandler)
    Keyboard.addListenerKeyup(this.player.keyupHandler)

    Mouse.init(this.playerSetShootingTrue, this.playerSetShootingFalse)
  }

  private checkForLevelClearedCondition() {
    if ( // TODO: Extract Level Cleared conditions (they won't be the same for every level)
      Map.enemiesRemaining() === 0 &&
      this.checkIfPlayerIsInsideExitPortal()
    ) {
        Game.stateManager.setState(GAME_STATES.LEVEL_CLEARED)  
    }
  }

  private checkIfPlayerIsInsideExitPortal(): boolean {
    return (
      this.player.row === Map.exitPortal.row &&
      this.player.col === Map.exitPortal.col
    )
  }

  public destroyGame(): void {
    Keyboard.removeKeydownAndKeyupListeners(this.player.keydownHandler)
    Mouse.removeMouseLeftClickListeners(this.playerSetShootingTrue, this.playerSetShootingFalse)

    this.map.destroy()
    this.map = null
    this.player = null
  }

  public playerSetShootingTrue = () => {
    this.player.setShooting(true) // TODO: Move to state: player.setState(CreatureState.Attacking)
  }
  public playerSetShootingFalse = () => {
    this.player.setShooting(false)
  }

  private pauseHandler = (e: KeyboardEvent) => {
    switch (e.keyCode) {
      case KEYBOARD_KEYS.ESC:
      case KEYBOARD_KEYS.p:
        e.preventDefault()
        Game.stateManager.setState(GAME_STATES.PAUSED)
        break
    }
  }
}
