import * as CONFIG from '@app/configuration/config.json'

import SoundFX from '@app/audio/SoundFX'

import Game from '@app/infrastructure/game/Game'
import GameTime from '@app/infrastructure/GameTime'
import GAME_STATES from '@app/infrastructure/game/game_states/GameStates'
import Canvas, { context } from '@app/infrastructure/Canvas'
import Point, { pointToPointDistance } from '@app/infrastructure/geometry/Point'
import CollisionBox from '@app/infrastructure/CollisionBox'
import Raycaster from '@app/infrastructure/Raycaster'
import { generatePathNodes, findShortestPath, debug_drawPathNodes, drawNode } from '@app/infrastructure/Pathfinding'

import CreatureState from '@app/domain/CreatureState'
import Player from '@app/domain/player/Player'
import Enemy from '@app/domain/enemies/Enemy'

import CreatureSprite from '@app/graphics/sprites/CreatureSprite'
import Sprites from '@app/graphics/Sprites'

export default class ConcreteEnemy extends Enemy {
  protected sprite: CreatureSprite = Sprites.Zerg
  protected target: Point

  // TODO: Extract to CreatureState objects
  // TODO: Adjust the feeling of enemy attack & animation
  protected attackSpeed = 0.45 // seconds
  protected animationLengthAttack   = 420 // ms
  protected animationProgressAttack = 0   // ms
  protected animationLengthMove     = 330 // ms
  protected animationProgressMove   = 0   // ms

  constructor(
    x: number,
    y: number,
    speed: number,
    healthPercentage: number,
    pathfindingTimerStart: number
  ) {
    super(x, y, new CollisionBox(14, 14), speed, healthPercentage)

    this.pathfindingTimer = (9 * pathfindingTimerStart) % this.pathfindingInterval
  }

  // TODO: See what more can be moved to `Enemy.update()`
  public update(player: Player): void {
    if (this.state === CreatureState.Dying) {
      return
    }
    if (this.state === CreatureState.Decaying) {
      return
    }

    if (!this.target) {
      this.target = player
    }
    this.resetBlocked()
    this.calculateNextCoordinates()
    this.updatePreviousCoordinates()

    this.stuck = this.checkIfStuck() // TODO: Extract to state

    if (
      this.state !== CreatureState.Idling &&
      this.state !== CreatureState.Attacking &&
      this.checkIfMoving() === false
    ) {
      this.setState(CreatureState.Idling)
    }

    this.adjustCollisionWithWalls()
    this.checkForCollisionWithPlayer(player)
    this.checkForCollisionWithOtherEnemies(player)
    this.distanceFromTarget = pointToPointDistance(
      { x: player.x, y: player.y },
      { x: this.x,   y: this.y   },
    )

    const targetIsInRange = this.targetInRange(player)
    if (this.state !== CreatureState.Attacking && targetIsInRange) {
      this.resetAttackCooldown()
      this.setState(CreatureState.Attacking)
    }

    if (this.state === CreatureState.Attacking) {
      if (targetIsInRange) {
        this.attack(player)
      } else {
        this.setState(CreatureState.Moving)
      }
    }

    this.thereAreObstaclesBetweenPlayerAndThisEnemy =
      Raycaster.determineIfThereAreObstaclesBetweenTwoPathNodes(this, player)

    if ( // TODO: Clean this if statement up, if possible?
      this.state === CreatureState.Idling ||
      this.state === CreatureState.Moving
    ) {
      this.findPathToPlayer(player, this.thereAreObstaclesBetweenPlayerAndThisEnemy)

      if (
        this.state !== CreatureState.Moving &&
        (
          this.thereAreObstaclesBetweenPlayerAndThisEnemy === false ||
          this.shortestPath.length > 0
        )
      ) {
        this.setState(CreatureState.Moving)
      }
    }

    if (this.state === CreatureState.Moving) {
      this.move()
    }

    this.updateDirection() // TODO: This is based on movement, which is incorrect - fix it
    this.updateTileDeltas()

    super.update(player)

    if (Game.stateManager.getState() === GAME_STATES.PLAYING) {
      this.advanceAnimation()
    }
  }

  // TODO: See what more can be moved to `Enemy.draw()`
  public draw(player: Player): void {
    if (CONFIG.DEBUG.ENEMY_COLLISION_BOX) {
      this.debug_drawCollisionBox(player)
    }
    if (CONFIG.DEBUG.ENEMY_STATE) {
      this.debug_drawState(player)
    }
    if (CONFIG.DEBUG.RAY_TO_PLAYER) {
      this.debug_drawRayToPlayer(player)
    }
    if (CONFIG.DEBUG.PATHFINDING_NODES) {
      debug_drawPathNodes(this.pathfindingNodes, player, this.getHealthColor())
    }

    if (CONFIG.DEBUG.SHORTEST_PATH_TO_PLAYER) {
      this.debug_drawShortestPathToPlayer(player)
    }
    this.sprite.draw(this, { x: player.x, y: player.y })

    super.draw(player)
  }

  protected advanceAnimation(): void {
    // TODO: Extract to CreatureState objects
    if (this.state === CreatureState.Attacking) {
      this.animationProgressAttack = (this.animationProgressAttack + GameTime.elapsedTimeFactor) % this.animationLengthAttack
      this.animationSpritePosition = Math.round((this.animationProgressAttack / this.animationLengthAttack) * this.sprite.numberOfSpritesInAnimation.attacking) % this.sprite.numberOfSpritesInAnimation.attacking
    } else if (this.state === CreatureState.Moving) {
      this.animationProgressMove = (this.animationProgressMove + GameTime.elapsedTimeFactor) % this.animationLengthMove
      this.animationSpritePosition = Math.round((this.animationProgressMove / this.animationLengthMove) * this.sprite.numberOfSpritesInAnimation.walking) % this.sprite.numberOfSpritesInAnimation.walking
    }
  }

  // TODO: Move to Enemy
  private findPathToPlayer(player: Player, thereAreObstaclesBetweenPlayerAndThisEnemy: boolean) {
    if (thereAreObstaclesBetweenPlayerAndThisEnemy) { // TODO: || this.isStuck()
      if (this.pathfindingTimer === 0) {
        this.pathfindingNodes = generatePathNodes( // TODO: Move to Pathfinding or Player
          Math.round(Math.abs(player.row + this.row) / 2),
          Math.round(Math.abs(player.col + this.col) / 2),
          this.collisionBox,
        )
        this.shortestPath = findShortestPath(this, player, this.pathfindingNodes)
      }

      this.pathfindingTimer += GameTime.elapsedTimeFactor
      if (this.pathfindingTimer > this.pathfindingInterval) {
        this.pathfindingTimer = 0
      }

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
    if (this.distanceFromTarget > this.collisionBox.width) {
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

  // TODO: Move to Creature since it's shared between enemies and player
  private debug_drawCollisionBox(player: Player) {
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

  private debug_drawState(player: Player) {
    context.beginPath()
      context.fillStyle = '#FFC100'
      context.font = '8px Monospace'
      context.fillText(
        this.state.toString(),
        Canvas.center.x + (this.x - player.x) - this.collisionBox.halfWidth,
        Canvas.center.y + (this.y - player.y) - this.collisionBox.halfHeight
      )
    context.stroke()
  }

  private debug_drawRayToPlayer(player: Player) {
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

  private debug_drawShortestPathToPlayer(p: Player) {
    this.shortestPath
      .forEach((n, i) => {
        drawNode(n, p, n.visited ? '#FF0000' : '#FF00FF')
      })
    if (this.shortestPath.length > 0) {
      this.shortestPath.forEach((node, i) => {
        this.debug_drawRayFromPointToPoint(node, this.shortestPath[i - 1] || p, p)
      })
    }
  }

  private debug_drawRayFromPointToPoint(p1: Point, p2: Point, player: Player) {
    context.strokeStyle = '#FF00FF'
    context.lineWidth = 0.2
    context.beginPath()
      context.moveTo(Canvas.center.x + (p2.x - player.x), Canvas.center.y + (p2.y - player.y))
      context.lineTo(Canvas.center.x + (p1.x - player.x), Canvas.center.y + (p1.y - player.y))
    context.stroke()
  }
}
