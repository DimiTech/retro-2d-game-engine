import * as CONFIG from '@app/configuration/config.json'

import GameTime from '@app/infrastructure/GameTime'
import CollisionBox, { collisionBoxesIntersect, ICollidable } from '@app/infrastructure/CollisionBox'
import { Directions, MovingDirections } from '@app/infrastructure/Directions'

import Map from '@app/domain/map/Map'
import CreatureState from '@app/domain/CreatureState'
import { Widget } from '@app/domain/widgets/DamageNumbers'

export default abstract class Creature {
  private prevHistoryLength = 8
  public prevX: number[] = [] // TODO: Make private?
  public prevY: number[] = [] // TODO: Make private?

  public nextX: number
  public nextY: number

  public row: number
  public col: number

  public maxHealth = 100
  public health: number

  public maxSpeed: number         // Derived from this.speed
  public maxSpeedDiagonal: number // Derived from this.speed

  public state: CreatureState = CreatureState.Idling
  public previousState: CreatureState = CreatureState.Idling // TODO: Use `previousState` for something? (Currently it's unused)

  public animationSpritePosition: number = 0

  public direction: Directions

  // Used for sprite orientation
  // TODO: Find a better name
  public movingDirections: { [key in MovingDirections]: boolean } = {
    left  : false,
    right : false,
    up    : false,
    down  : false,
  }
  public moving: { [key in MovingDirections]: boolean } = {
    left  : false,
    right : false,
    up    : false,
    down  : false,
  }
  public blocked: { [key in MovingDirections]: boolean } = {
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

  protected widgets: { [key: string]: Widget } = {}
  
  constructor(
    public x: number,
    public y: number,
    public collisionBox: CollisionBox,
    private speed: number,
    healthPercentage: number,
  ) {
    this.maxSpeed = this.speed
    this.maxSpeedDiagonal = Math.sin(45) * this.speed

    this.initializeHealth(healthPercentage)
    this.updateMapPosition()
  }

  protected resetMoving(): void {
    this.moving.left  = false
    this.moving.right = false
    this.moving.up    = false
    this.moving.down  = false
    this.movingDirections.left  = false
    this.movingDirections.right = false
    this.movingDirections.up    = false
    this.movingDirections.down  = false
  }

  protected resetBlocked(): void {
    this.blocked.up    = false
    this.blocked.down  = false
    this.blocked.left  = false
    this.blocked.right = false
  }

  // TODO: This is not 100% correct, it's just an estimation based on previous frame's length
  protected calculateNextCoordinates(): void {
    this.nextX = this.x
    this.nextY = this.y

    if (this.moving.left) {
      const isDiagonalMovement = (this.moving.up || this.moving.down)
      this.nextX -= this.calculateMovementAmountPixels(MovingDirections.left, isDiagonalMovement, false)
    }
    if (this.moving.right) {
      const isDiagonalMovement = (this.moving.up || this.moving.down)
      this.nextX += this.calculateMovementAmountPixels(MovingDirections.right, isDiagonalMovement, false)
    }
    if (this.moving.up) {
      const isDiagonalMovement = (this.moving.left || this.moving.right)
      this.nextY -= this.calculateMovementAmountPixels(MovingDirections.up, isDiagonalMovement, false)
    }
    if (this.moving.down) {
      const isDiagonalMovement = (this.moving.left || this.moving.right)
      this.nextY += this.calculateMovementAmountPixels(MovingDirections.down, isDiagonalMovement, false)
    }
  }

  protected move(): void {

    if (this.moving.left && !this.blocked.left && this.horizontalMovementControlsAreNotJammed()) {
      const isDiagonalMovement = (this.moving.up || this.moving.down)
      this.x -= this.calculateMovementAmountPixels(MovingDirections.left, isDiagonalMovement)
    }
    if (this.moving.right && !this.blocked.right && this.horizontalMovementControlsAreNotJammed()) {
      const isDiagonalMovement = (this.moving.up || this.moving.down)
      this.x += this.calculateMovementAmountPixels(MovingDirections.right, isDiagonalMovement)
    }

    if (this.moving.up && !this.blocked.up && this.verticalMovementControlsAreNotJammed()) {
      const isDiagonalMovement = (this.moving.left || this.moving.right)
      this.y -= this.calculateMovementAmountPixels(MovingDirections.up, isDiagonalMovement)
    }
    if (this.moving.down && !this.blocked.down && this.verticalMovementControlsAreNotJammed()) {
      const isDiagonalMovement = (this.moving.left || this.moving.right)
      this.y += this.calculateMovementAmountPixels(MovingDirections.down, isDiagonalMovement)
    }

    this.updateMapPosition()
  }

  // TODO: Maybe find a better solution for this
  private horizontalMovementControlsAreNotJammed() { // Detect control jamming by pressing `left` & `right` at the same time
    return (this.moving.left && this.moving.right) === false
  }
  private verticalMovementControlsAreNotJammed() { // Detect control jamming by pressing `up` & `down` at the same time
    return (this.moving.up && this.moving.down) === false
  }

  private movementAccumulator: { [key in MovingDirections]: number } = {
    left  : 0.0,
    right : 0.0,
    up    : 0.0,
    down  : 0.0,
  }

  /**
   * For this Game Engine we want pixelated movement, meaning that the movement amounts are Integer values
   *
   * Slow game speed:
   *   When the game is slowed down enough that one frame worth of movement is below 1,
   *   the `movementAmountDecimalPart` is sent to the `movementAccumulator`, and the `movementAccumulator`
   *   is added to the next movement calculation.
   *   This means that it can take, for example, 3 frames to move 1 pixel.
   *
   * Fast game speed:
   *   When the game is sped up so that one frame worht of movement is above 1,
   *   we want to preserve the spillover `movementAmountDecimalPart` and add it to
   *   the next movement calculation.
   *
   * This functions makes that happen - and the result is smooth Player/Creature movement :)
   *
   * @param direction  - One of four possible `MovingDirections`
   * @param isDiagonalMovement - Specifies whether the movement is diagonal or not
   * @param accumulate - We don't want to accumulate when calling from `calculateNextCoordinates()`
   * @returns - Integer number of pixels to move
   */
  private calculateMovementAmountPixels(direction: MovingDirections, isDiagonalMovement: boolean, accumulate = true): number {
    const movementAmount = isDiagonalMovement
      ? (GameTime.elapsedTimeFactor * this.maxSpeedDiagonal) + this.movementAccumulator[direction]
      : (GameTime.elapsedTimeFactor * this.maxSpeed        ) + this.movementAccumulator[direction]
    const movementAmountPixels = Math.floor(movementAmount)

    if (accumulate) {
      const movementAmountDecimalPart = (movementAmount % 1)
      this.movementAccumulator[direction] = movementAmountDecimalPart
    }

    return movementAmountPixels
  }

  protected updateMapPosition(): void {
    this.row = Math.floor(this.y / CONFIG.TILE_SIZE)
    this.col = Math.floor(this.x / CONFIG.TILE_SIZE)
  }

  protected updateTileDeltas(): void {
    this.deltas.dyTop = this.y % CONFIG.TILE_SIZE
    this.deltas.dyBottom = CONFIG.TILE_SIZE - this.deltas.dyTop
    this.deltas.dxLeft = this.x % CONFIG.TILE_SIZE
    this.deltas.dxRight = CONFIG.TILE_SIZE - this.deltas.dxLeft
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

    ///////////////////////////////////////////////////////////////////////////
    // West
    ///////////////////////////////////////////////////////////////////////////
    if (this.moving.left) {
      wall = Map.walls[this.row][this.col - 1] // West
      if (wall && this.x - this.collisionBox.halfWidth - 1 <= wall.mapX + wall.width) {
        this.x = wall.mapX + wall.width + this.collisionBox.halfWidth + 1
        this.movingDirections.left = false
      }

      const SWVertexRow = Math.floor((this.y + this.collisionBox.halfHeight - 1) / CONFIG.TILE_SIZE)
      if (SWVertexRow && SWVertexRow !== this.row) { // SW vertex overflows the Creature's Tile
        wall = Map.walls[SWVertexRow][this.col - 1] // South West
        if (wall && this.x - this.collisionBox.halfWidth - 1 <= wall.mapX + wall.width) {
          if (!(this.moving.down && this.deltas.dyTop <= this.deltas.dxRight)) {
            this.x = wall.mapX + wall.width + this.collisionBox.halfWidth + 1
            this.movingDirections.left = false
          }
        }
      }

      const NWVertexRow = Math.floor((this.y - this.collisionBox.halfHeight) / CONFIG.TILE_SIZE)
      if (NWVertexRow && NWVertexRow !== this.row) { // NW vertex overflows the Creature's Tile
        wall = Map.walls[NWVertexRow][this.col - 1] // North West
        if (wall && this.x - this.collisionBox.halfWidth - 1 <= wall.mapX + wall.width) {
          if (!(this.moving.up && this.deltas.dyBottom <= this.deltas.dxRight)) {
            this.x = wall.mapX + wall.width + this.collisionBox.halfWidth + 1
            this.movingDirections.left = false
          }
        }
      }
    }

    ///////////////////////////////////////////////////////////////////////////
    // East
    ///////////////////////////////////////////////////////////////////////////
    if (this.moving.right) {
      wall = Map.walls[this.row][this.col + 1] // East
      if (wall && this.x + this.collisionBox.halfWidth + 1 >= wall.mapX) {
        this.x = wall.mapX - this.collisionBox.halfWidth - 1
        this.movingDirections.right = false
      }

      const SEVertexRow = Math.floor((this.y + this.collisionBox.halfHeight - 1) / CONFIG.TILE_SIZE)
      if (SEVertexRow && SEVertexRow !== this.row) { // SE vertex overflows the Creature's Tile
        wall = Map.walls[SEVertexRow][this.col + 1] // South East
        if (wall && this.x + this.collisionBox.halfWidth + 1 >= wall.mapX) {
          if (!(this.moving.down && this.deltas.dyTop <= this.deltas.dxLeft)) {
            this.x = wall.mapX - this.collisionBox.halfWidth - 1
            this.movingDirections.right = false
          }
        }
      }

      const NEVertexRow = Math.floor((this.y - this.collisionBox.halfHeight) / CONFIG.TILE_SIZE)
      if (SEVertexRow && NEVertexRow !== this.row) { // NE vertex overflows the Creature's Tile
        wall = Map.walls[NEVertexRow][this.col + 1] // North East
        if (wall && this.x + this.collisionBox.halfWidth + 1 >= wall.mapX) {
          if (!(this.moving.up && this.deltas.dyBottom <= this.deltas.dxLeft)) {
            this.x = wall.mapX - this.collisionBox.halfWidth - 1
            this.movingDirections.right = false
          }
        }
      }
    }

    ///////////////////////////////////////////////////////////////////////////
    // North
    ///////////////////////////////////////////////////////////////////////////
    if (this.moving.up) {
      wall = Map.walls[this.row - 1][this.col] // North
      if (wall && this.y - this.collisionBox.halfHeight - 1 <= wall.mapY + wall.height) {
        this.y = wall.mapY + wall.height + this.collisionBox.halfHeight + 1
        this.movingDirections.up = false
      }

      const NEVertexCol = Math.floor((this.x + this.collisionBox.halfWidth - 1) / CONFIG.TILE_SIZE)
      if (NEVertexCol && NEVertexCol !== this.col) { // NE vertex overflows the Creature's Tile
        wall = Map.walls[this.row - 1][NEVertexCol] // North East
        if (wall && this.y - this.collisionBox.halfHeight - 1 <= wall.mapY + wall.height) {
          if (!(this.moving.right && this.deltas.dyBottom > this.deltas.dxLeft)) {
            this.y = wall.mapY + wall.height + this.collisionBox.halfHeight + 1
            this.movingDirections.up = false
          }
        }
      }

      const NWVertexCol = Math.floor((this.x - this.collisionBox.halfWidth) / CONFIG.TILE_SIZE)
      if (NWVertexCol && NWVertexCol !== this.col) { // NW vertex overflows the Creature's Tile
        wall = Map.walls[this.row - 1][NWVertexCol] // North West
        if (wall && this.y - this.collisionBox.halfHeight - 1 <= wall.mapY + wall.height) {
          if (!(this.moving.left && this.deltas.dyBottom > this.deltas.dxRight)) {
            this.y = wall.mapY + wall.height + this.collisionBox.halfHeight + 1
            this.movingDirections.up = false
          }
        }
      }
    }

    ///////////////////////////////////////////////////////////////////////////
    // South 
    ///////////////////////////////////////////////////////////////////////////
    if (this.moving.down) {
      wall = Map.walls[this.row + 1][this.col] // South
      if (wall && this.y + this.collisionBox.halfHeight + 1 >= wall.mapY) {
        this.y = wall.mapY - this.collisionBox.halfHeight - 1
        this.movingDirections.down = false
      }
    }

    const SEVertexCol = Math.floor((this.x + this.collisionBox.halfWidth - 1) / CONFIG.TILE_SIZE)
    if (SEVertexCol && SEVertexCol !== this.col) { // SE vertex overflows the Creature's Tile
      wall = Map.walls[this.row + 1][SEVertexCol] // South East
      if (wall && this.y + this.collisionBox.halfHeight + 1 >= wall.mapY) {
        if (!(this.moving.right && this.deltas.dyTop > this.deltas.dxLeft)) {
          this.y = wall.mapY - this.collisionBox.halfHeight - 1
          this.movingDirections.down = false
        }
      }
    }

    const SWVertexCol = Math.floor((this.x - this.collisionBox.halfWidth) / CONFIG.TILE_SIZE)
    if (SWVertexCol && SWVertexCol !== this.col) { // SW vertex overflows the Creature's Tile
      wall = Map.walls[this.row + 1][SWVertexCol] // South West
      if (wall && this.y + this.collisionBox.halfHeight + 1 >= wall.mapY) {
        if (!(this.moving.left && this.deltas.dyTop > this.deltas.dxRight)) {
          this.y = wall.mapY - this.collisionBox.halfHeight - 1
          this.movingDirections.down = false
        }
      }
    }
  }

  protected updatePreviousCoordinates(): void {
    this.prevX.push(this.x)
    if (this.prevX.length > this.prevHistoryLength) { this.prevX.shift() }

    this.prevY.push(this.y)
    if (this.prevY.length > this.prevHistoryLength) { this.prevY.shift() }
  }

  protected updateDirection(): void {
    const direction: string[] = []

    if (this.movingDirections.down && this.blocked.down === false) {
      direction.push(Directions.S)
    }
    else if (this.movingDirections.up && this.blocked.up === false) {
      direction.push(Directions.N)
    }

    if (this.movingDirections.right && this.blocked.right === false) {
      direction.push(Directions.E)
    }
    else if (this.movingDirections.left && this.blocked.left === false) {
      direction.push(Directions.W)
    }

    const directionString = direction.join('') || this.direction || 'S'

    this.direction = Directions[directionString as keyof typeof Directions]
  }

  protected checkIfMoving(): boolean {
    // Check if all of the recorded prevX & prevY positions are the same
    const xUnchanged = this.prevX.every((prevX, i) => (i === 0) ? true : (prevX === this.prevX[0]))
    const yUnchanged = this.prevY.every((prevY, i) => (i === 0) ? true : (prevY === this.prevY[0]))
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
}
