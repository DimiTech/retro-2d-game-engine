import * as CONFIG from '@app/configuration/config.json'

import Point from '@app/infrastructure/geometry/Point'
import Mouse from '@app/peripherals/Mouse'

const canvas = document.getElementById('canvas') as HTMLCanvasElement
canvas.width  = CONFIG.CANVAS_WIDTH
canvas.height = CONFIG.CANVAS_HEIGHT
canvas.style.width  = CONFIG.SCALE !== 1 ? (CONFIG.SCALE * CONFIG.CANVAS_WIDTH ) + 'px' : 'auto'
canvas.style.height = CONFIG.SCALE !== 1 ? (CONFIG.SCALE * CONFIG.CANVAS_HEIGHT) + 'px' : 'auto'
export const context = canvas.getContext('2d')

context.imageSmoothingEnabled = false // Disables anti-aliasing on Chrome

export default class Canvas {
  public static halfWidth  = canvas.width  / 2
  public static halfHeight = canvas.height / 2
  public static rows = Math.floor(canvas.height / CONFIG.TILE_SIZE)
  public static cols = Math.floor(canvas.width  / CONFIG.TILE_SIZE)
  public static halfRows = Math.floor((canvas.height / 2) / CONFIG.TILE_SIZE)
  public static halfCols = Math.floor((canvas.width  / 2) / CONFIG.TILE_SIZE)
  public static rowRemainder = (canvas.height / 2) % CONFIG.TILE_SIZE
  public static colRemainder = (canvas.width  / 2) % CONFIG.TILE_SIZE
  public static mousePosition: Point

  public static center: Point = {
    x: CONFIG.CANVAS_WIDTH  / 2,
    y: CONFIG.CANVAS_HEIGHT / 2,
  }

  public static clear(): void {
    context.clearRect(0, 0, canvas.width, canvas.height)
  }

  public static getCanvasDomElement = (): HTMLCanvasElement => canvas

  public static updateMousePosition() {
    this.mousePosition = {
      x: Math.floor((Mouse.x - canvas.offsetLeft) / CONFIG.SCALE),
      y: Math.floor((Mouse.y - canvas.offsetTop ) / CONFIG.SCALE)
    }
  }
}
