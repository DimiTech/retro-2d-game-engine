import Map from '@app/domain/map/Map'

import { totalNumberOfMaps } from '@app/domain/map/Maps'

export default class Level {
  public static lastLevel = totalNumberOfMaps

  public static readonly startingLevel = 1

  public static currentLevel = Level.startingLevel

  public static resetToStartingLevel() {
    Level.currentLevel = Level.startingLevel

    LevelTimer.reset()
  }

  public static nextLevel() {
    Map.clear()

    Level.currentLevel++

    LevelTimer.reset()
  }

  public static isLastLevel() {
    return (Level.currentLevel === Level.lastLevel)
  }
}

import * as CONFIG from '@app/configuration/config.json'

import { context } from '@app/infrastructure/Canvas'
import GameTime from '@app/infrastructure/GameTime'

export class LevelTimer {
  public static timeSpentOnCurrentLevel = 0 // ms

  public static incrementTimeSpentOnCurrentLevel() {
    LevelTimer.timeSpentOnCurrentLevel += GameTime.frameElapsedTime
  }

  public static reset() {
    LevelTimer.timeSpentOnCurrentLevel = 0
  }

  public static debug_displayTimeSpentOnCurrentLevel() {
    context.beginPath()
      context.fillStyle = '#9999ff'
      context.font = '8px Monospace'
      const levelTimeInSeconds = Math.round(LevelTimer.timeSpentOnCurrentLevel / 1000)
      context.fillText(`Level ${Level.currentLevel} Time: ${levelTimeInSeconds}`, 10, CONFIG.CANVAS_HEIGHT - 24)
    context.stroke()
  }
}