import Canvas from '@app/infrastructure/Canvas'
import Player from '@app/domain/Player'

export default class Mouse {
	public static x: number = 0
	public static y: number = 0
  public static init(player: Player) {
    this.hijackRightClick()
    this.trackMouseOnCanvas()
    this.listenForLeftClicks(player)
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

  private static listenForLeftClicks(player: Player): void {
    const canvas: HTMLCanvasElement = Canvas.getCanvasDomElement()
    canvas.addEventListener('mousedown', e => {
      player.setShooting(true)
    }, false)
    canvas.addEventListener('mouseup', e => {
      player.setShooting(false)
    }, false)
  }
}
