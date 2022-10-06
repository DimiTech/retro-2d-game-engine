import * as CONFIG from '@app/configuration/config.json'

import CollisionBox, { collisionBoxesIntersect, ICollidable } from '@app/infrastructure/CollisionBox'

import CreatureState from '@app/domain/CreatureState'
import { walls } from '@app/domain/map/Map'
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
  public maxHealth = 100
  public health: number

  public maxSpeed: number
  public maxSpeedDiagonal: number

  public state: CreatureState = CreatureState.Idling
  public previousState: CreatureState = CreatureState.Idling // TODO: Use `previousState` for something? (Currently it's unused)

  public animationPosition: number = 0

  public direction: Directions
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

  protected adjustCollisionWithWalls(): void {
    let wall
    if (walls[this.row]) {
      if (this.moving.left) {
        wall = walls[this.row][this.col - 1] // West
        if (wall && this.x - this.collisionBox.halfWidth <= wall.mapX + wall.width) {
          this.x = wall.mapX + wall.width + this.collisionBox.halfWidth + 1
        }

        const SWVertexRow = Math.floor((this.y + this.collisionBox.halfHeight - 1) / CONFIG.TILE_SIZE)
        if (SWVertexRow && SWVertexRow !== this.row) { // SW vertex overflows the player grid
          wall = walls[SWVertexRow][this.col - 1] // South West
          if (wall && this.x - this.collisionBox.halfWidth <= wall.mapX + wall.width) {
            if (!(this.moving.down && this.deltas.dyTop <= this.deltas.dxRight)) {
              this.x = wall.mapX + wall.width + this.collisionBox.halfWidth + 1
            }
          }
        }

        const NWVertexRow = Math.floor((this.y - this.collisionBox.halfHeight) / CONFIG.TILE_SIZE)
        if (NWVertexRow && NWVertexRow !== this.row) { // NW vertex overflows the player grid
          wall = walls[NWVertexRow][this.col - 1] // North West
          if (wall && this.x - this.collisionBox.halfWidth <= wall.mapX + wall.width) {
            if (!(this.moving.up && this.deltas.dyBottom <= this.deltas.dxRight)) {
              this.x = wall.mapX + wall.width + this.collisionBox.halfWidth + 1
            }
          }
        }
      }
      if (this.moving.right) {
        wall = walls[this.row][this.col + 1] // East
        if (wall && this.x + this.collisionBox.halfWidth >= wall.mapX) {
          this.x = wall.mapX - this.collisionBox.halfWidth - 1
        }

        const SEVertexRow = Math.floor((this.y + this.collisionBox.halfHeight - 1) / CONFIG.TILE_SIZE)
        if (SEVertexRow && SEVertexRow !== this.row) { // SE vertex overflows the player grid
          wall = walls[SEVertexRow][this.col + 1] // South East
          if (wall && this.x + this.collisionBox.halfWidth >= wall.mapX) {
            if (!(this.moving.down && this.deltas.dyTop <= this.deltas.dxLeft)) {
              this.x = wall.mapX - this.collisionBox.halfWidth - 1
            }
          }
        }

        const NEVertexRow = Math.floor((this.y - this.collisionBox.halfHeight) / CONFIG.TILE_SIZE)
        if (SEVertexRow && NEVertexRow !== this.row) { // NE vertex overflows the player grid
          wall = walls[NEVertexRow][this.col + 1] // North East
          if (wall && this.x + this.collisionBox.halfWidth >= wall.mapX) {
            if (!(this.moving.up && this.deltas.dyBottom <= this.deltas.dxLeft)) {
              this.x = wall.mapX - this.collisionBox.halfWidth - 1
            }
          }
        }
      }
    }
    if (walls[this.row - 1]) {
      if (this.moving.up) {
        wall = walls[this.row - 1][this.col] // North
        if (wall && this.y - this.collisionBox.halfHeight <= wall.mapY + wall.height) {
          this.y = wall.mapY + wall.height + this.collisionBox.halfHeight + 1
        }

        const NEVertexCol = Math.floor((this.x + this.collisionBox.halfWidth - 1) / CONFIG.TILE_SIZE)
        if (NEVertexCol && NEVertexCol !== this.col) { // NE vertex overflows the player grid
          wall = walls[this.row - 1][NEVertexCol] // North East
          if (wall && this.y - this.collisionBox.halfHeight <= wall.mapY + wall.height) {
            if (!(this.moving.right && this.deltas.dyBottom > this.deltas.dxLeft)) {
              this.y = wall.mapY + wall.height + this.collisionBox.halfHeight + 1
            }
          }
        }

        const NWVertexCol = Math.floor((this.x - this.collisionBox.halfWidth) / CONFIG.TILE_SIZE)
        if (NWVertexCol && NWVertexCol !== this.col) { // NW vertex overflows the player grid
          wall = walls[this.row - 1][NWVertexCol] // North West
          if (wall && this.y - this.collisionBox.halfHeight <= wall.mapY + wall.height) {
            if (!(this.moving.left && this.deltas.dyBottom > this.deltas.dxRight)) {
              this.y = wall.mapY + wall.height + this.collisionBox.halfHeight + 1
            }
          }
        }
      }
    }
    if (walls[this.row + 1]) {
      if (this.moving.down) {
        wall = walls[this.row + 1][this.col] // South
        if (wall && this.y + this.collisionBox.halfHeight >= wall.mapY) {
          this.y = wall.mapY - this.collisionBox.halfHeight - 1
        }
      }

      const SEVertexCol = Math.floor((this.x + this.collisionBox.halfWidth - 1) / CONFIG.TILE_SIZE)
      if (SEVertexCol && SEVertexCol !== this.col) { // SE vertex overflows the player grid
        wall = walls[this.row + 1][SEVertexCol] // South East
        if (wall && this.y + this.collisionBox.halfHeight >= wall.mapY) {
          if (!(this.moving.right && this.deltas.dyTop > this.deltas.dxLeft)) {
            this.y = wall.mapY - this.collisionBox.halfHeight - 1
          }
        }
      }

      const SWVertexCol = Math.floor((this.x - this.collisionBox.halfWidth) / CONFIG.TILE_SIZE)
      if (SWVertexCol && SWVertexCol !== this.col) { // SW vertex overflows the player grid
        wall = walls[this.row + 1][SWVertexCol] // South West
        if (wall && this.y + this.collisionBox.halfHeight >= wall.mapY) {
          if (!(this.moving.left && this.deltas.dyTop > this.deltas.dxRight)) {
            this.y = wall.mapY - this.collisionBox.halfHeight - 1
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

  protected initializeHealth(healthPercentage: number = 1.0): void {
    if (healthPercentage < 0.0 || healthPercentage > 1.0) {
      healthPercentage = 1.0
    }
    this.health = this.maxHealth * healthPercentage
  }

  // TODO: The color strings can be moved to a single hash map in order to optimize & localize the color searches
  protected getHealthColor(): string {
    if (this.health <= this.maxHealth * 0.1) {
      return '#FF5700'
    } else if (this.health <= this.maxHealth * 0.2) {
      return '#FF7B00'
    } else if (this.health <= this.maxHealth * 0.3) {
      return '#FF9E00'
    } else if (this.health <= this.maxHealth * 0.4) {
      return '#FFC100'
    } else if (this.health <= this.maxHealth * 0.5) {
      return '#FFE400'
    } else if (this.health <= this.maxHealth * 0.6) {
      return '#FFF600'
    } else if (this.health <= this.maxHealth * 0.7) {
      return '#E5FF00'
    } else if (this.health <= this.maxHealth * 0.8) {
      return '#D4FF00'
    } else if (this.health <= this.maxHealth * 0.9) {
      return '#B0FF00'
    } else if (this.health < this.maxHealth) {
      return '#8DFF00'
    } else if (this.health === this.maxHealth) {
      return '#6AFF00'
    }
  }

  protected resetAnimation() {
    this.animationPosition = 0
  }

  public setState(newState: CreatureState) {
    this.previousState = this.state
    this.state = newState
    this.resetAnimation()
  }
}
