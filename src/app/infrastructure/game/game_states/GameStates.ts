import GameStateLoading from './GameStateLoading'
import GameStateMainMenu from './GameStateMainMenu'
import GameStatePlaying from './GameStatePlaying'
import GameStatePaused from './GameStatePaused'
import GameStateGameOver from './GameStateGameOver'

// TODO: Add a IGameState type definition
const GAME_STATES = {
  LOADING   : new GameStateLoading(),
  MAIN_MENU : new GameStateMainMenu(),
  PLAYING   : new GameStatePlaying(),
  PAUSED    : new GameStatePaused(),
  GAME_OVER : new GameStateGameOver(),
}

export default GAME_STATES