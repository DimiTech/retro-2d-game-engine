import * as CONFIG from '@app/configuration/config.json'

import { context } from '@app/infrastructure/Canvas'
import PortalObject from './PortalObject'

export default class Portal extends PortalObject {
  public isOpen = false

  protected static openColor   = 'rgba(50, 120, 50, 0.2)'
  protected static closedColor = 'rgba(180, 50, 50, 0.2)'

  draw(): void {
    context.fillStyle = this.getColor()
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

  private getColor(): string {
    if (this.isOpen) {
      return Portal.openColor
    }
    else {
      return Portal.closedColor
    }
  }
}
