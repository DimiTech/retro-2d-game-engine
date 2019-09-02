import * as CONFIG from '@app/configuration/config.json'

import CollisionBox, { collisionBoxesIntersect, ICollidable } from '@app/infrastructure/CollisionBox'

import { gameObjects } from '@app/domain/map/Map'
import { Directions } from '@app/infrastructure/Directions'

export default abstract class Creature {
  public prevX: number[] = [] // TODO: Make private?
  public prevY: number[] = [] // TODO: Make private?
  public x: number
  public y: number
  public nextX: number
  public nextY: number
  public row: number
  public col: number

  public maxSpeed: number
  public maxSpeedDiagonal: number

  public animationInterval: number = 0

  public direction: Directions
  public isMoving: boolean = false
  public moving = {
    left  : false,
    right : false,
    up    : false,
    down  : false,
  }
  public blocked = {
    left  : false,
    right : false,
    up    : false,
    down  : false,
  }
  public deltas = {
    dyTop    : 0,
    dyBottom : 0,
    dxLeft   : 0,
    dxRight  : 0,
  }
  public collisionBox: CollisionBox

  protected resetMoving(): void {
    this.moving.left  = false
    this.moving.right = false
    this.moving.up    = false
    this.moving.down  = false
  }

  protected resetBlocked(): void {
    this.blocked.up    = false
    this.blocked.down  = false
    this.blocked.left  = false
    this.blocked.right = false
  }

  protected calculateNextCoordinates(): void {
    this.nextX = this.x
    this.nextY = this.y

    if (this.moving.left) {
      if (this.moving.up || this.moving.down) {
        this.nextX -= this.maxSpeedDiagonal
      } else {
        this.nextX -= this.maxSpeed
      }
    }
    if (this.moving.right) {
      if (this.moving.up || this.moving.down) {
        this.nextX += this.maxSpeedDiagonal
      } else {
        this.nextX += this.maxSpeed
      }
    }
    if (this.moving.up) {
      if (this.moving.left || this.moving.right) {
        this.nextY -= this.maxSpeedDiagonal
      } else {
        this.nextY -= this.maxSpeed
      }
    }
    if (this.moving.down) {
      if (this.moving.left || this.moving.right) {
        this.nextY += this.maxSpeedDiagonal
      } else {
        this.nextY += this.maxSpeed
      }
    }
  }

  protected checkIfBlockedByCreature(c: Creature, nextCreatureState: ICollidable) {
    if (collisionBoxesIntersect(nextCreatureState, c)) {
      let intersectionX: number
      let intersectionY: number
      if (nextCreatureState.x < c.x) {
        intersectionX = (nextCreatureState.x + nextCreatureState.collisionBox.halfWidth) - (c.x - c.collisionBox.halfWidth)
      } else if (nextCreatureState.x > c.x) {
        intersectionX = (c.x + c.collisionBox.halfWidth) - (nextCreatureState.x - nextCreatureState.collisionBox.halfWidth)
      }
      if (nextCreatureState.y < c.y) {
        intersectionY = (nextCreatureState.y + nextCreatureState.collisionBox.halfHeight) - (c.y - c.collisionBox.halfHeight)
      } else if (nextCreatureState.y > c.y) {
        intersectionY = (c.y + c.collisionBox.halfHeight) - (nextCreatureState.y - nextCreatureState.collisionBox.halfHeight)
      }
      if (!intersectionX || intersectionX >= intersectionY) {
        if (nextCreatureState.y < c.y) {
          this.blocked.down = true
        } else {
          this.blocked.up = true
        }
      } else if (!intersectionY || intersectionX < intersectionY) {
        if (nextCreatureState.x < c.x) {
          this.blocked.right = true
        } else {
          this.blocked.left = true
        }
      }
    }
  }

  protected adjustCollisionWithGameObjects(): void {
    let o
    if (gameObjects[this.row]) {
      if (this.moving.left) {
        o = gameObjects[this.row][this.col - 1] // West
        if (o && this.x - this.collisionBox.halfWidth <= o.mapX + o.width) {
          this.x = o.mapX + o.width + this.collisionBox.halfWidth + 1
        }

        const SWVertexRow = Math.floor((this.y + this.collisionBox.halfHeight - 1) / CONFIG.TILE_SIZE)
        if (SWVertexRow && SWVertexRow !== this.row) { // SW vertex overflows the player grid
          o = gameObjects[SWVertexRow][this.col - 1] // South West
          if (o && this.x - this.collisionBox.halfWidth <= o.mapX + o.width) {
            if (!(this.moving.down && this.deltas.dyTop <= this.deltas.dxRight)) {
              this.x = o.mapX + o.width + this.collisionBox.halfWidth + 1
            }
          }
        }

        const NWVertexRow = Math.floor((this.y - this.collisionBox.halfHeight) / CONFIG.TILE_SIZE)
        if (NWVertexRow && NWVertexRow !== this.row) { // NW vertex overflows the player grid
          o = gameObjects[NWVertexRow][this.col - 1] // North West
          if (o && this.x - this.collisionBox.halfWidth <= o.mapX + o.width) {
            if (!(this.moving.up && this.deltas.dyBottom <= this.deltas.dxRight)) {
              this.x = o.mapX + o.width + this.collisionBox.halfWidth + 1
            }
          }
        }
      }
      if (this.moving.right) {
        o = gameObjects[this.row][this.col + 1] // East
        if (o && this.x + this.collisionBox.halfWidth >= o.mapX) {
          this.x = o.mapX - this.collisionBox.halfWidth - 1
        }

        const SEVertexRow = Math.floor((this.y + this.collisionBox.halfHeight - 1) / CONFIG.TILE_SIZE)
        if (SEVertexRow && SEVertexRow !== this.row) { // SE vertex overflows the player grid
          o = gameObjects[SEVertexRow][this.col + 1] // South East
          if (o && this.x + this.collisionBox.halfWidth >= o.mapX) {
            if (!(this.moving.down && this.deltas.dyTop <= this.deltas.dxLeft)) {
              this.x = o.mapX - this.collisionBox.halfWidth - 1
            }
          }
        }

        const NEVertexRow = Math.floor((this.y - this.collisionBox.halfHeight) / CONFIG.TILE_SIZE)
        if (SEVertexRow && NEVertexRow !== this.row) { // NE vertex overflows the player grid
          o = gameObjects[NEVertexRow][this.col + 1] // North East
          if (o && this.x + this.collisionBox.halfWidth >= o.mapX) {
            if (!(this.moving.up && this.deltas.dyBottom <= this.deltas.dxLeft)) {
              this.x = o.mapX - this.collisionBox.halfWidth - 1
            }
          }
        }
      }
    }
    if (gameObjects[this.row - 1]) {
      if (this.moving.up) {
        o = gameObjects[this.row - 1][this.col] // North
        if (o && this.y - this.collisionBox.halfHeight <= o.mapY + o.height) {
          this.y = o.mapY + o.height + this.collisionBox.halfHeight + 1
        }

        const NEVertexCol = Math.floor((this.x + this.collisionBox.halfWidth - 1) / CONFIG.TILE_SIZE)
        if (NEVertexCol && NEVertexCol !== this.col) { // NE vertex overflows the player grid
          o = gameObjects[this.row - 1][NEVertexCol] // North East
          if (o && this.y - this.collisionBox.halfHeight <= o.mapY + o.height) {
            if (!(this.moving.right && this.deltas.dyBottom > this.deltas.dxLeft)) {
              this.y = o.mapY + o.height + this.collisionBox.halfHeight + 1
            }
          }
        }

        const NWVertexCol = Math.floor((this.x - this.collisionBox.halfWidth) / CONFIG.TILE_SIZE)
        if (NWVertexCol && NWVertexCol !== this.col) { // NW vertex overflows the player grid
          o = gameObjects[this.row - 1][NWVertexCol] // North West
          if (o && this.y - this.collisionBox.halfHeight <= o.mapY + o.height) {
            if (!(this.moving.left && this.deltas.dyBottom > this.deltas.dxRight)) {
              this.y = o.mapY + o.height + this.collisionBox.halfHeight + 1
            }
          }
        }
      }
    }
    if (gameObjects[this.row + 1]) {
      if (this.moving.down) {
        o = gameObjects[this.row + 1][this.col] // South
        if (o && this.y + this.collisionBox.halfHeight >= o.mapY) {
          this.y = o.mapY - this.collisionBox.halfHeight - 1
        }
      }

      const SEVertexCol = Math.floor((this.x + this.collisionBox.halfWidth - 1) / CONFIG.TILE_SIZE)
      if (SEVertexCol && SEVertexCol !== this.col) { // SE vertex overflows the player grid
        o = gameObjects[this.row + 1][SEVertexCol] // South East
        if (o && this.y + this.collisionBox.halfHeight >= o.mapY) {
          if (!(this.moving.right && this.deltas.dyTop > this.deltas.dxLeft)) {
            this.y = o.mapY - this.collisionBox.halfHeight - 1
          }
        }
      }

      const SWVertexCol = Math.floor((this.x - this.collisionBox.halfWidth) / CONFIG.TILE_SIZE)
      if (SWVertexCol && SWVertexCol !== this.col) { // SW vertex overflows the player grid
        o = gameObjects[this.row + 1][SWVertexCol] // South West
        if (o && this.y + this.collisionBox.halfHeight >= o.mapY) {
          if (!(this.moving.left && this.deltas.dyTop > this.deltas.dxRight)) {
            this.y = o.mapY - this.collisionBox.halfHeight - 1
          }
        }
      }
    }
  }

  protected updatePreviousCoordinates(): void {
    this.prevX.push(this.x)
    if (this.prevX.length > 5) { this.prevX.shift() }

    this.prevY.push(this.y)
    if (this.prevY.length > 5) { this.prevY.shift() }
  }

  protected updateDirection(): void {
    const direction: string[] = []

    const dx = this.prevX[this.prevX.length - 1] - this.prevX[this.prevX.length - 2]
    const dy = this.prevY[this.prevY.length - 1] - this.prevY[this.prevY.length - 2]

    if (dy > 0) {
      direction.push(Directions.S)
    }
    else if (dy < 0) {
      direction.push(Directions.N)
    }

    if (dx > 0) {
      direction.push(Directions.E)
    }
    else if (dx < 0) {
      direction.push(Directions.W)
    }

    const directionString = direction.join('') || this.direction || 'S'

    this.direction = Directions[directionString as keyof typeof Directions]
  }

  protected checkIfMoving(): boolean {
    const xUnchanged = this.prevX[this.prevX.length - 1] === this.prevX[this.prevX.length - 2]
    const yUnchanged = this.prevY[this.prevY.length - 1] === this.prevY[this.prevY.length - 2]
    if (xUnchanged && yUnchanged) {
      return false
    } else {
      return true
    }
  }
}
