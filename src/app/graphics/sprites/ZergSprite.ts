import Canvas, { context } from '@app/infrastructure/Canvas'
import Point from '@app/infrastructure/geometry/Point'
import CreatureState from '@app/domain/CreatureState'
import Enemy from '@app/domain/enemies/Enemy'

import CreatureSprite from './CreatureSprite'

export default class ZergSprite extends CreatureSprite {
  public url: string = './graphics/spritesheets/zergling.png'

  public numberOfSpritesInAnimation = {
    moving: 7,
    attacking: 5,
    dying: 7
  }

  private spriteLocations: { [key: string]: { col: number, flip: boolean } } = {
    N : { col: 0, flip: false },
    NE: { col: 2, flip: false },
    E : { col: 4, flip: false },
    SE: { col: 6, flip: false },
    S : { col: 8, flip: false },
    SW: { col: 6, flip: true  },
    W : { col: 4, flip: true  },
    NW: { col: 2, flip: true  },
  }


  private spriteDimensions = {
    walking: {
      width: 32,
      height: 32,
    },
    attacking: {
      width: 32,
      height: 32,
    },
    dying: {
      width: 65,
      height: 53,
      gapX: 3,
    }
  }

  private sprites = {
    dying: [
      {
        sx: 2 + 0 * (this.spriteDimensions.dying.width + this.spriteDimensions.dying.gapX),
        sy: 548,
        sWidth: this.spriteDimensions.dying.width,
        sHeight: this.spriteDimensions.dying.height,
      },
      {
        sx: 2 + 1 * (this.spriteDimensions.dying.width + this.spriteDimensions.dying.gapX),
        sy: 548,
        sWidth: this.spriteDimensions.dying.width,
        sHeight: this.spriteDimensions.dying.height,
      },
      {
        sx: 2 + 2 * (this.spriteDimensions.dying.width + this.spriteDimensions.dying.gapX),
        sy: 548,
        sWidth: this.spriteDimensions.dying.width,
        sHeight: this.spriteDimensions.dying.height,
      },
      {
        sx: 2 + 3 * (this.spriteDimensions.dying.width + this.spriteDimensions.dying.gapX),
        sy: 548,
        sWidth: this.spriteDimensions.dying.width,
        sHeight: this.spriteDimensions.dying.height,
      },
      {
        sx: 2 + 4 * (this.spriteDimensions.dying.width + this.spriteDimensions.dying.gapX),
        sy: 548,
        sWidth: this.spriteDimensions.dying.width,
        sHeight: this.spriteDimensions.dying.height,
      },
      {
        sx: 2 + 5 * (this.spriteDimensions.dying.width + this.spriteDimensions.dying.gapX),
        sy: 548,
        sWidth: this.spriteDimensions.dying.width,
        sHeight: this.spriteDimensions.dying.height,
      },
      {
        sx: 2 + 6 * (this.spriteDimensions.dying.width + this.spriteDimensions.dying.gapX),
        sy: 548,
        sWidth: this.spriteDimensions.dying.width,
        sHeight: this.spriteDimensions.dying.height,
      },
    ]
  }

  private spriteWidth: number
  private spriteHeight: number
  private spriteStep: Point

  private defaultSpriteOffset = {
    x: 7,
    y: 5
  }

  constructor() {
    super()
  }

  public draw(enemy: Enemy, playerCoordinates: Point, dyingSpriteNumber = 0) {
    if (enemy.state === CreatureState.Dying) {
      this.spriteWidth  = 65
      this.spriteHeight = 53
    }
    else {
      this.spriteWidth  = 32
      this.spriteHeight = 32
    }


    const spriteLocation = this.spriteLocations[enemy.direction]
    if (enemy.state === CreatureState.Dying) {
      this.drawSpriteDying(enemy, playerCoordinates, dyingSpriteNumber)
    }
    else {
      this.spriteStep = { x: this.spriteWidth + 11, y: this.spriteHeight + 10 }
      const spriteOffsets: Point = this.getSpriteOffsets(enemy.state)
      this.drawSprite(enemy, playerCoordinates, spriteOffsets, spriteLocation)
    }
  }

  private getSpriteOffsets(enemyState: CreatureState) {
    switch (enemyState) {
      case CreatureState.Moving:
      case CreatureState.Idling:
        return this.defaultSpriteOffset
      case CreatureState.Attacking:
        const ATTACK_SPRITES_ROW = 7
        return {
          x: this.defaultSpriteOffset.x,
          y: this.defaultSpriteOffset.y + (ATTACK_SPRITES_ROW * this.spriteStep.y)
        }
    }
  }

  private drawSpriteDying(
    enemy: Enemy,
    playerCoordinates: Point,
    dyingSpriteNumber: number
  ) {

    const { x, y, collisionBox: cBox } = enemy
    const { x: px, y: py } = playerCoordinates

    const desinationWidth  = Math.floor(this.spriteDimensions.dying.width  * (enemy.collisionBox.width  / 20))
    const desinationHeight = Math.floor(this.spriteDimensions.dying.height * (enemy.collisionBox.height / 20))

    context.drawImage(
      this.spriteSheet,
      this.sprites.dying[dyingSpriteNumber].sx,
      this.sprites.dying[dyingSpriteNumber].sy,
      this.spriteDimensions.dying.width,  // Draw width
      this.spriteDimensions.dying.height, // Draw height
      Canvas.center.x + (x - px - desinationWidth  / 2), // Canvas Desination X
      Canvas.center.y + (y - py - desinationHeight / 2), // Canvas Desination Y
      desinationWidth, // Draw width
      desinationHeight, // Draw height
    )
  }

  private drawSprite(
    enemy: Enemy,
    playerCoordinates: Point,
    spriteOffsets: Point,
    spriteLocation: { col: number, flip: boolean },
  ) {

    const { x, y, collisionBox: cBox } = enemy
    const { x: px, y: py } = playerCoordinates

    if (spriteLocation.flip) {
      context.save()
      context.translate(
        Canvas.center.x + (x - px - cBox.halfWidth),
        Canvas.center.y + (y - py - cBox.halfHeight),
      )
      context.scale(-1, 1)
    }

    context.drawImage(
      this.spriteSheet,
      spriteOffsets.x + this.spriteStep.x * spriteLocation.col,
      spriteOffsets.y + this.spriteStep.y * Math.floor(enemy.animationSpritePosition),
      this.spriteWidth,
      this.spriteHeight,
      spriteLocation.flip ? 0 - this.spriteWidth / 2 : Canvas.center.x + (x - px - cBox.halfWidth),  // Canvas Desination X
      spriteLocation.flip ? 0                        : Canvas.center.y + (y - py - cBox.halfHeight), // Canvas Desination Y
      enemy.collisionBox.width  + 2, // Draw width
      enemy.collisionBox.height + 2, // Draw height
    )

    if (spriteLocation.flip) {
      context.restore()
    }
  }
}
