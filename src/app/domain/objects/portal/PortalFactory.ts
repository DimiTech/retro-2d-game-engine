import * as CONFIG from '@app/configuration/config.json'

import Portal from '@app/domain/objects/portal/Portal'

export default class PortalFactory {
  public static createExitPortal(row: number, col: number): Portal {
    return new Portal(row, col, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE, 'rgba(50, 100, 180, 0.2)', false)
  }
}
