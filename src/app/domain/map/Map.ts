import * as CONFIG from '@app/configuration/config.json'


import Player from '@app/domain/player/Player'
import CreatureState from '@app/domain/CreatureState'
import ConcreteEnemy from '@app/domain/enemies/ConcreteEnemy'
import Enemy from '@app/domain/enemies/Enemy'
import Canvas from '@app/infrastructure/Canvas'

import MapKeys, { isWall } from '@app/domain/map/MapKeys'
import Wall from '@app/domain/objects/wall/Wall'
import WallFactory from '@app/domain/objects/wall/WallFactory'
import Portal from '@app/domain/objects/portal/Portal'
import PortalFactory from '@app/domain/objects/portal/PortalFactory'

import IMap from './IMap'
import * as Map01 from '@app/resources/maps/Map-01.json'

export const walls: Wall[][] = []

export const enemies: Enemy[] = []

export function getEnemiesOnScreen(playerX: number, playerY: number): Enemy[] {
  return enemies.filter(e => e.isOnScreen(playerX, playerY))
}

export function enemiesRemaining(): number {
  return enemies.length
}

export default class Map {
  public static exitPortal: Portal

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
        this.openPortalWhenAllEnemiesAreKilled()
      }
    })
  }

  private openPortalWhenAllEnemiesAreKilled() {
    if (Map.exitPortal.isOpen === false && enemies.length === 0) {
      Map.exitPortal.open()
    }
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

    // Limits the rendering range to only what is visible on the screen
    let wall
    for (let row = rowStart; row < rowStart + Canvas.rows + 1; ++row) {
      for (let col = colStart - 1; col < colStart + Canvas.cols + 1; ++col) {
        if (walls[row] && walls[row][col]) {
          wall = walls[row][col]
          wall.x = (col - colStart) * CONFIG.TILE_SIZE - offsetLeft
          wall.y = (row - rowStart) * CONFIG.TILE_SIZE - offsetTop
          wall.draw()
        }
        if (Map.exitPortal.row === row && Map.exitPortal.col === col) {
          Map.exitPortal.x = (col - colStart) * CONFIG.TILE_SIZE - offsetLeft
          Map.exitPortal.y = (row - rowStart) * CONFIG.TILE_SIZE - offsetTop
          Map.exitPortal.draw()
        }
      }
    }
  }

  private loadMap(map: IMap): void {
    this.loadGameObjects(map)
    this.loadEnemies(map)
  }

  private loadGameObjects(map: IMap) {
    for (let row = 0; row < map.gameObjects.length; ++row) {
      walls[row] = []
      for (let col = 0; col < map.gameObjects[row].length; ++col) {
        const mapKey = map.gameObjects[row][col] 

        // Walls
        walls[row][col] = null
        if (isWall(mapKey)) {
          walls[row][col] = WallFactory.createWall(row, col, mapKey)
        }

        // Portal
        else if (mapKey === MapKeys.ExitPortal) {
          Map.exitPortal = PortalFactory.createExitPortal(row, col)
        }
      }
    }
  }

  private loadEnemies(map: IMap) {
    map.enemies.forEach((e, i) => {
      enemies.push(new ConcreteEnemy(e.x, e.y, e.healthPercentage, i))
    })
  }
}
