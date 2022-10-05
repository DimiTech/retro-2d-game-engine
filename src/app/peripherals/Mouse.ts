import Canvas from '@app/infrastructure/Canvas'

type MouseEventHandler = (e: MouseEvent) => void

export default class Mouse {
  public static x: number = window.innerWidth  / 2 + 100
  public static y: number = window.innerHeight / 2 + 50
  public static init(mouseDownListener: MouseEventHandler, mouseUpListener: MouseEventHandler) {
    this.hijackRightClick()
    this.trackMouseOnCanvas()
    this.listenForLeftClicks(mouseDownListener, mouseUpListener)
  }
  private static hijackRightClick(): void {
    window.addEventListener('contextmenu', e => {
      e.preventDefault()
    }, false)
  }

  private static trackMouseOnCanvas(): void {
    const canvas: HTMLCanvasElement = Canvas.getCanvasDomElement()
    canvas.addEventListener('mousemove', e => {
      this.x = e.pageX
      this.y = e.pageY
    }, false)
  }

  private static listenForLeftClicks(mouseDownListener: MouseEventHandler, mouseUpListener: MouseEventHandler): void {
    const canvas: HTMLCanvasElement = Canvas.getCanvasDomElement()
    canvas.addEventListener('mousedown', mouseDownListener, false)
    canvas.addEventListener('mouseup', mouseUpListener, false)
  }

  public static removeMouseLeftClickListeners(mouseDownListener: MouseEventHandler, mouseUpListener: MouseEventHandler) {
    const canvas: HTMLCanvasElement = Canvas.getCanvasDomElement()
    canvas.removeEventListener('mousedown', mouseDownListener)
    canvas.removeEventListener('mouseup', mouseUpListener)
  }
}
