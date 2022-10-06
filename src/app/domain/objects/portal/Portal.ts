import * as CONFIG from '@app/configuration/config.json'

import { context } from '@app/infrastructure/Canvas'
import GameObject from '../GameObject'

export default class Portal extends GameObject { // TODO: Don't extend Game Object ?
  public isOpen = false

  private static openColor   = 'rgba(50, 120, 50, 0.2)'
  private static closedColor = 'rgba(180, 50, 50, 0.2)'

  draw(): void {
    if (this.isOpen) {
      this.color = Portal.openColor
    }
    else {
      this.color = Portal.closedColor
    }
    context.fillStyle = this.color
    context.fillStyle = this.color
    context.beginPath()
      context.rect(
        this.x,
        this.y,
        CONFIG.TILE_SIZE,
        CONFIG.TILE_SIZE
      );
    context.fill()
  }

  public open() {
    this.isOpen = true
  }

  public takeDamage(damageAmount: number): void { // TODO: Remove this
    return
  }
}
