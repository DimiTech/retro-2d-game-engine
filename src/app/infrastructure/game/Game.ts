import * as CONFIG from '@app/configuration/config.json'

import AudioLoader from '@app/audio/AudioLoader'
import GraphicsLoader from '@app/graphics/GraphicsLoader'
import Canvas from '@app/infrastructure/Canvas'

import FrameRate from '../FrameRate'
import GAME_STATES from './game_states/GameStates'
import GameStateManager from './game_states/GameStateManager'
import GameAssets from '../GameAssets'

export default class Game {
  public static loaded: boolean = false
  public static loadedPercentage: number = 0.0
  public static loadedPercentages: Map<GameAssets, { loaded: number, weight: number }> = new Map()

  public static stateManager: GameStateManager = new GameStateManager()

  constructor() {
    window.onfocus = () => {
      FrameRate.restart()
    }

    Game.loadedPercentages.set(GameAssets.Graphics, { weight: 0.3, loaded: 0.0 })
    Game.loadedPercentages.set(GameAssets.Audio,    { weight: 0.7, loaded: 0.0 })

    AudioLoader.load(   percentage => this.gameAssetLoaded(GameAssets.Audio, percentage))
    GraphicsLoader.load(percentage => this.gameAssetLoaded(GameAssets.Graphics, percentage))
  }

  public start(): void {
    const loadInterval = setInterval(() => {
      if (Game.loaded) {
        clearInterval(loadInterval)
        Game.stateManager.setState(GAME_STATES.MAIN_MENU)
      }
    }, 250)

    this.gameLoop()
  }

  private gameAssetLoaded(asset: GameAssets, percentage: number) {
    const assetValue = Game.loadedPercentages.get(asset)
    assetValue.loaded = percentage
    Game.loadedPercentages.set(asset, assetValue)

    Game.loadedPercentage = 0
    for (const [_key, value] of Game.loadedPercentages) {
      Game.loadedPercentage += value.loaded * value.weight
    }

    if (Game.loadedPercentage === 1.0) {
      Game.loaded = true
    }
  }

  private gameLoop(): void {
    this.update()
    this.render()

    FrameRate.calculateFrameRate()

    window.requestAnimationFrame(() => this.gameLoop())
  }

  private update(): void {
    Game.stateManager.update()
  }

  private render(): void {
    Canvas.clear()
    Game.stateManager.render()
    if (CONFIG.DEBUG.FPS) {
      FrameRate.drawFPS()
    }
  }
}
