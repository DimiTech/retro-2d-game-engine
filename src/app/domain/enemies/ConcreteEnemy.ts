import * as CONFIG from '@app/configuration/config.json'

import SoundFX from '@app/audio/SoundFX'

import Game from '@app/infrastructure/game/Game'
import GAME_STATES from '@app/infrastructure/game/game_states/GameStates'
import Canvas, { context } from '@app/infrastructure/Canvas'
import Point, { pointToPointDistance } from '@app/infrastructure/geometry/Point'
import CollisionBox from '@app/infrastructure/CollisionBox'
import Raycaster from '@app/infrastructure/Raycaster'
import { generatePathNodes, findShortestPath, drawPathNodes, drawNode } from '@app/infrastructure/Pathfinding'

import Player from '@app/domain/player/Player'
import Enemy from '@app/domain/enemies/Enemy'
import CreatureSprite from '@app/graphics/sprites/CreatureSprite'
import Sprites from '@app/graphics/Sprites'

export default class ConcreteEnemy extends Enemy {
  protected sprite: CreatureSprite = Sprites.Zerg
  protected target: Point
  constructor(
    x: number,
    y: number,
    healthPercentage: number,
    protected pathfindingInterval: number
  ) {
    super(x, y, new CollisionBox(14, 14), 1, healthPercentage)
    this.updateMapPosition()
  }

  public update(player: Player, enemies: Enemy[]): void {
    if (!this.target) {
      this.target = player
    }
    this.resetBlocked()
    this.calculateNextCoordinates()
    this.updatePreviousCoordinates()

    this.stuck    = this.checkIfStuck()
    this.isMoving = this.checkIfMoving()

    this.adjustCollisionWithGameObjects()
    this.checkForCollisionWithPlayer(player)
    this.checkForCollisionWithOtherEnemies(player)
    this.distanceFromPlayer = pointToPointDistance(
      { x: player.x, y: player.y },
      { x: this.x,   y: this.y   }
    )
    this.thereAreObstaclesBetweenPlayerAndThisEnemy =
      Raycaster.determineIfThereAreObstaclesBetweenTwoPathNodes(this, player)
    this.findPathToPlayer(player)

    this.move()
    this.updateDirection()
    this.updateTileDeltas()

    if (Game.stateManager.getState() !== GAME_STATES.PAUSED) {
      this.advanceAnimation()
    }
  }

  public draw(player: Player): void {
    if (CONFIG.DEBUG.ENEMY_COLLISION_BOX) {
      this.drawCollisionBox(player)
    }
    if (CONFIG.DEBUG.RAY_TO_PLAYER) {
      this.drawRayToPlayer(player)
    }
    if (CONFIG.DEBUG.PATHFINDING_NODES) {
      drawPathNodes(this.pathfindingNodes, player, this.getHealthColor())
    }

    if (CONFIG.DEBUG.SHORTEST_PATH_TO_PLAYER) {
      this.drawShortestPathToPlayer(player)
    }
    this.sprite.draw(this, { x: player.x, y: player.y })
  }

  public takeDamage(damageAmount: number): void {
    SoundFX.playEnemyHit()
    this.health -= damageAmount
    if (this.health <= 0) {
      this.die()
    } else {
      SoundFX.playEnemyHit()
    }
  }

  public die() {
    SoundFX.playEnemyDeath()
    this.alive = false
  }

  protected advanceAnimation(): void {
    this.animationInterval = (this.animationInterval + 0.5) % this.sprite.animationPeriods.walking
  }

  private findPathToPlayer(player: Player): void {
    if (this.thereAreObstaclesBetweenPlayerAndThisEnemy) { // TODO: || this.isStuck()
      if (this.pathfindingInterval === 0) {
        this.pathfindingNodes = generatePathNodes(
          Math.round(Math.abs(player.row + this.row) / 2),
          Math.round(Math.abs(player.col + this.col) / 2),
          this.collisionBox,
        )
        this.shortestPath = findShortestPath(this, player, this.pathfindingNodes)
      }

      this.pathfindingInterval = (this.pathfindingInterval + 1) % this.pathfindingPeriod

      if (this.shortestPath.length > 0) {
        this.followTheShortestPath()
      }
    }
    else { // Target is in line of sight
      if (this.pathfindingNodes) {
        this.pathfindingNodes = null
      }
      if (this.shortestPath) {
        this.shortestPath = []
      }
      this.moveTowardsPlayer(player)
    }
  }

  private followTheShortestPath(): void {
    // If the enemy is close to the path node, pop that node and move to the next one
    let nextNodeX = this.shortestPath[this.shortestPath.length - 1].x
    let nextNodeY = this.shortestPath[this.shortestPath.length - 1].y
    if (
      this.shortestPath.length > 1 &&
      Math.abs(nextNodeX - this.x) < 3 &&
      Math.abs(nextNodeY - this.y) < 3
    ) {
      this.shortestPath.pop()
      nextNodeX = this.shortestPath[this.shortestPath.length - 1].x
      nextNodeY = this.shortestPath[this.shortestPath.length - 1].y
    }
    this.moveTowards(nextNodeX, nextNodeY)
  }

  private moveTowardsPlayer(player: Point): void {
    if (this.distanceFromPlayer > this.collisionBox.width) {
      this.moveTowards(player.x, player.y)
    }
    else {
      this.resetMoving()
    }
  }

  private moveTowards(x: number, y: number): void {
    this.resetMoving()

    if (this.x < x) {
      this.moving.right = true
    }
    else if (this.x > x) {
      this.moving.left = true
    }
    if (this.y < y) {
      this.moving.down = true
    }
    else if (this.y > y) {
      this.moving.up = true
    }
  }

  // TODO: Compose this functionality since it's shared between enemies and player
  private move(): void {
    if (this.moving.left && !this.blocked.left) {
      if (this.moving.up || this.moving.down) {
        this.x -= this.maxSpeedDiagonal
      } else {
        this.x -= this.maxSpeed
      }
    }
    if (this.moving.right && !this.blocked.right) {
      if (this.moving.up || this.moving.down) {
        this.x += this.maxSpeedDiagonal
      } else {
        this.x += this.maxSpeed
      }
    }
    if (this.moving.up && !this.blocked.up) {
      if (this.moving.left || this.moving.right) {
        this.y -= this.maxSpeedDiagonal
      } else {
        this.y -= this.maxSpeed
      }
    }
    if (this.moving.down && !this.blocked.down) {
      if (this.moving.left || this.moving.right) {
        this.y += this.maxSpeedDiagonal
      } else {
        this.y += this.maxSpeed
      }
    }
    this.updateMapPosition()
  }

  // TODO: Compose this functionality since it's shared between enemies and player
  private updateMapPosition(): void {
    this.row = Math.floor(this.y / CONFIG.TILE_SIZE)
    this.col = Math.floor(this.x / CONFIG.TILE_SIZE)
  }

  // TODO: Compose this functionality since it's shared between enemies and player
  private updateTileDeltas(): void {
    this.deltas.dyTop = this.y % CONFIG.TILE_SIZE
    this.deltas.dyBottom = CONFIG.TILE_SIZE - this.deltas.dyTop
    this.deltas.dxLeft = this.x % CONFIG.TILE_SIZE
    this.deltas.dxRight = CONFIG.TILE_SIZE - this.deltas.dxLeft
  }

  // TODO: Compose this functionality since it's shared between enemies and player
  private drawCollisionBox(player: Player) {
    context.strokeStyle = this.getHealthColor()
    context.lineWidth = 0.2
    context.beginPath()
      // Since this is just for debugging purposes, there is no need to
      // optimize/cache the vertex calculations.
      context.moveTo( 0.5 + Canvas.center.x + (this.x - player.x) - this.collisionBox.halfWidth,  0.5 + Canvas.center.y + (this.y - player.y) - this.collisionBox.halfHeight)
      context.lineTo(-0.5 + Canvas.center.x + (this.x - player.x) + this.collisionBox.halfWidth,  0.5 + Canvas.center.y + (this.y - player.y) - this.collisionBox.halfHeight)
      context.lineTo(-0.5 + Canvas.center.x + (this.x - player.x) + this.collisionBox.halfWidth, -0.5 + Canvas.center.y + (this.y - player.y) + this.collisionBox.halfHeight)
      context.lineTo( 0.5 + Canvas.center.x + (this.x - player.x) - this.collisionBox.halfWidth, -0.5 + Canvas.center.y + (this.y - player.y) + this.collisionBox.halfHeight)
      context.lineTo( 0.5 + Canvas.center.x + (this.x - player.x) - this.collisionBox.halfWidth,  0.5 + Canvas.center.y + (this.y - player.y) - this.collisionBox.halfHeight)
    context.stroke()
  }

  // TODO: Just for debugging
  private drawRayToPlayer(player: Player) {
    if (this.thereAreObstaclesBetweenPlayerAndThisEnemy) {
      context.strokeStyle = '#FFFF44'
    } else {
      context.strokeStyle = '#00F0FF'
    }
    context.lineWidth = 0.5
    context.beginPath()
      context.moveTo(Canvas.center.x + (this.x - player.x), Canvas.center.y + (this.y - player.y))
      context.lineTo(Canvas.center.x, Canvas.center.y)
    context.stroke()
  }

  // TODO: Just for debugging
  private drawShortestPathToPlayer(p: Player) {
    this.shortestPath
      .forEach((n, i) => {
        drawNode(n, p, n.visited ? '#FF0000' : '#FF00FF')
      })
    if (this.shortestPath.length > 0) {
      this.shortestPath.forEach((node, i) => {
        this.drawRayFromPointToPoint(node, this.shortestPath[i - 1] || p, p)
      })
    }
  }

  // TODO: Just for debugging
  private drawRayFromPointToPoint(p1: Point, p2: Point, player: Player) {
    context.strokeStyle = '#FF00FF'
    context.lineWidth = 0.2
    context.beginPath()
      context.moveTo(Canvas.center.x + (p2.x - player.x), Canvas.center.y + (p2.y - player.y))
      context.lineTo(Canvas.center.x + (p1.x - player.x), Canvas.center.y + (p1.y - player.y))
    context.stroke()
  }
}
