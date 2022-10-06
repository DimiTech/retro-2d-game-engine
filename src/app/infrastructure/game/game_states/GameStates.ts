import IGameState from './IGameState'
import GameStateLoading from './GameStateLoading'
import GameStateMainMenu from './GameStateMainMenu'
import GameStatePlaying from './GameStatePlaying'
import GameStatePaused from './GameStatePaused'
import GameStateGameOver from './GameStateGameOver'
import GameStateVictory from './GameStateVictory'

const GAME_STATES: {[ key: string ]: IGameState } = {
  LOADING   : new GameStateLoading(),
  MAIN_MENU : new GameStateMainMenu(),
  PLAYING   : new GameStatePlaying(),
  PAUSED    : new GameStatePaused(),
  GAME_OVER : new GameStateGameOver(),
  VICTORY   : new GameStateVictory(),
}

export default GAME_STATES