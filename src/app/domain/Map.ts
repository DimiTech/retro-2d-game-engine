import * as CONFIG from '@app/configuration/config.json'

import Grid from '@app/domain/Grid'

import Player from '@app/domain/Player'
import Canvas from '@app/infrastructure/Canvas'
import GameObject from '@app/infrastructure/objects/GameObject'
import BoxFactory from '@app/domain/factories/BoxFactory'

import * as Map01 from '@app/resources/maps/Map-01.json'

export const gameObjects: Array<GameObject[]> = []

export default class Map {
  constructor(private grid: Grid, private player: Player) {
    this.loadMap(Map01)
  }

  public draw(): void {
    let offsetLeft = this.player.deltas.dxLeft - Canvas.colRemainder
    let offsetTop  = this.player.deltas.dyTop  - Canvas.rowRemainder

    const rowStart = this.player.row - Canvas.halfRows
    const colStart = this.player.col - Canvas.halfCols
    let gameObject
    for (let row = rowStart; row < rowStart + Canvas.rows + 1; ++row) {
      for (let col = colStart - 1; col < colStart + Canvas.cols + 1; ++col) {
        if (gameObjects[row] && gameObjects[row][col]) {
          gameObject = gameObjects[row][col]
          gameObject.x = (col - colStart) * CONFIG.TILE_SIZE - offsetLeft
          gameObject.y = (row - rowStart) * CONFIG.TILE_SIZE - offsetTop
          gameObject.draw()
        }
      }
    }
  }

  private loadMap(map: number[][]): void {
    for (let row = 0; row < map.length; ++row) {
      gameObjects[row] = []
      for (let col = 0; col < map[row].length; ++col) {
        switch (map[row][col]) {
          case 1:
            gameObjects[row][col] = BoxFactory.createBox('#4B4B4B', row, col, false)
            break
          case 2:
            gameObjects[row][col] = BoxFactory.createBox('#27531B', row, col)
            break
          case 3:
            gameObjects[row][col] = BoxFactory.createBox('#572F17', row, col)
            break
          default:
            gameObjects[row][col] = null
        }
      }
    }
  }
}
