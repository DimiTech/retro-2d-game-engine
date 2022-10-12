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

import IMap from './IMap'
import getMapData from '@app/domain/map/Maps'
import Level from '@app/domain/Level'

export default class Map {
  public static walls: Wall[][] = []
  public static enemies: Enemy[] = []
  public static exitPortal: Portal

  public player: Player

  public static getEnemiesOnScreen(playerX: number, playerY: number): Enemy[] {
    return Map.enemies.filter(e => e.isOnScreen(playerX, playerY))
  }

  public static enemiesRemaining(): number {
    return Map.enemies.length
  }

  constructor() {
    const mapData = getMapData(Level.currentLevel)
    this.loadMap(mapData)
    this.player = new Player(mapData.player.x, mapData.player.y)
  }

  public destroy() {
    while (Map.enemies.length) {
      Map.enemies.pop()
    }
  }

  public update(): void {
    Map.enemies.forEach((e, i) => {
      e.update(this.player)
      if (e.state === CreatureState.Decaying) {
        Map.enemies.splice(i, 1) // Remove the enemy
        this.openPortalWhenAllEnemiesAreKilled()
      }
    })
  }

  private openPortalWhenAllEnemiesAreKilled() {
    if (Map.exitPortal.isOpen === false && Map.enemies.length === 0) {
      Map.exitPortal.open()
    }
  }

  public draw(): void {
    this.drawGameObjects()
    Map.getEnemiesOnScreen(this.player.x, this.player.y)
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
        if (Map.walls[row] && Map.walls[row][col]) {
          wall = Map.walls[row][col]
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

  // Inefficient - provides clearer separation (loading happens once - so it's not a big deal)
  private loadGameObjects(map: IMap) {
    this.loadWalls(map)
    this.loadExitPortal(map)
  }

  private loadWalls(map: IMap) {
    for (let row = 0; row < map.gameObjects.length; ++row) {
      Map.walls[row] = []
      for (let col = 0; col < map.gameObjects[row].length; ++col) {
        const mapKey = map.gameObjects[row][col] 
        Map.walls[row][col] = null
        if (isWall(mapKey)) {
          Map.walls[row][col] = WallFactory.createWall(row, col, mapKey)
        }
      }
    }
  }

  private loadExitPortal(map: IMap) {
    for (let row = 0; row < map.gameObjects.length; ++row) {
      for (let col = 0; col < map.gameObjects[row].length; ++col) {
        const mapKey = map.gameObjects[row][col] 
        if (mapKey === MapKeys.ExitPortal) {
          Map.exitPortal = new Portal(row, col)
        }
      }
    }
  }

  private loadEnemies(map: IMap) {
    map.enemies.forEach((e, i) => {
      Map.enemies.push(new ConcreteEnemy(e.x, e.y, 0.125, e.healthPercentage, i))
    })
  }
}
