import * as CONFIG from '@app/configuration/config.json'


import Player from '@app/domain/player/Player'
import CreatureState from '@app/domain/CreatureState'
import ConcreteEnemy from '@app/domain/enemies/ConcreteEnemy'
import Enemy from '@app/domain/enemies/Enemy'
import Canvas from '@app/infrastructure/Canvas'
import GameObject from '@app/domain/objects/GameObject'
import GameObjectFactory from '@app/domain/objects/GameObjectFactory'

import IMap from './IMap'
import * as Map01 from '@app/resources/maps/Map-01.json'

export const gameObjects: GameObject[][] = []
export const enemies: Enemy[] = []

export function getEnemiesOnScreen(playerX: number, playerY: number): Enemy[] {
  return enemies.filter(e => e.isOnScreen(playerX, playerY))
}

export default class Map {
  constructor(private player: Player) {
    this.loadMap(Map01)
  }

  public destroy() {
    while (enemies.length) {
      enemies.pop()
    }
  }

  public update(): void {
    enemies.forEach((e, i) => {
      e.update(this.player, enemies)
      if (e.state === CreatureState.Decaying) {
        enemies.splice(i, 1) // Remove the enemy
      }
    })
  }

  public draw(): void {
    this.drawGameObjects()
    getEnemiesOnScreen(this.player.x, this.player.y)
      .forEach(e => e.draw(this.player))
  }

  private drawGameObjects(): void {
    const offsetLeft = this.player.deltas.dxLeft - Canvas.colRemainder
    const offsetTop  = this.player.deltas.dyTop  - Canvas.rowRemainder

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

  private loadMap(map: IMap): void {
    for (let row = 0; row < map.gameObjects.length; ++row) {
      gameObjects[row] = []
      for (let col = 0; col < map.gameObjects[row].length; ++col) {
        gameObjects[row][col] = GameObjectFactory.createGameObject(row, col, map.gameObjects[row][col])
      }
    }

    map.enemies.forEach((e, i) => {
      enemies.push(new ConcreteEnemy(e.x, e.y, e.healthPercentage, i))
    })
  }
}
