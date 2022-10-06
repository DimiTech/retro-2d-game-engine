import * as CONFIG from '@app/configuration/config.json'

import Wall from '@app/domain/objects/wall/Wall'
import MapKeys from '@app/domain/map/MapKeys'

export default class WallFactory {
  public static createWall(row: number, col: number, mapKey: MapKeys): Wall {
    switch (mapKey) {
      case MapKeys.WallGray:
        return new Wall(row, col, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE, '#4B4B4B', false)
      case MapKeys.WallGreen:
        return new Wall(row, col, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE, '#27531B')
      case MapKeys.WallBlue:
        return new Wall(row, col, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE, '#572F17')
      default:
        throw new Error('No such Wall!')
    }
  }
}
