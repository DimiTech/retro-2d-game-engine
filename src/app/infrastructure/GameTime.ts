import * as CONFIG from '@app/configuration/config.json'

export default class GameTime {
  public static readonly ONE_SECOND = 1000

  public static previousTimestamp = 0 // Milliseconds
  public static frameElapsedTime  = 0 // Milliseconds

  // Determines the game & animation speed
  public static elapsedTimeFactor: number

  public static setFrameElapsedTime(t: number) {
    GameTime.frameElapsedTime  = t
    GameTime.elapsedTimeFactor = CONFIG.GAME_SPEED * GameTime.frameElapsedTime
  }
}