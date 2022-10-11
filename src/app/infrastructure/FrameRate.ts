import * as CONFIG from '@app/configuration/config.json'

import { context } from './Canvas'

const FPS_ARR: number[] = [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ]
let FPS: number

export default class FrameRate {

  public static restart() {
    for (let i = 0; i < FPS_ARR.length; ++i) {
      FPS_ARR[i] = 0
    }
  }

  public static calculateFrameRate(lastFrameTime: number, frameElapsedTime: number): void {
    if (!lastFrameTime) {
      FPS = 0
    } else {
      FPS_ARR.unshift(1000 / frameElapsedTime)
      FPS_ARR.pop()
      FPS = FPS_ARR.reduce((sum, current) => sum += current, 0) / FPS_ARR.length
    }
  }

  public static debug_drawFPS() {
    context.beginPath()
      context.fillStyle = '#FFC100'
      context.font = '8px Monospace'

      context.fillText(`FPS: ${FPS && FPS.toFixed(2) || 'unknown'}`, 10, CONFIG.CANVAS_HEIGHT - 10)
    context.stroke()
  }
}