import Canvas, { context } from '@app/infrastructure/Canvas'
import Point from '@app/infrastructure/geometry/Point'
import CreatureState from '@app/domain/CreatureState'

import CreatureSprite from './CreatureSprite'
import Creature from '@app/domain/Creature'

export default class ZergSprite extends CreatureSprite {
  public url: string = './graphics/spritesheets/zergling.png'

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
    default: {
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

  public draw(creature: Creature, playerCoordinates: Point, animationSpritePosition: number) {
    if (creature.state === CreatureState.Dying) {
      this.spriteWidth  = this.spriteDimensions.dying.width
      this.spriteHeight = this.spriteDimensions.dying.height
    }
    else {
      this.spriteWidth  = this.spriteDimensions.default.width
      this.spriteHeight = this.spriteDimensions.default.height
    }

    if (creature.state === CreatureState.Dying) {
      this.drawSpriteDying(creature, playerCoordinates, animationSpritePosition)
    }
    else {
      this.spriteStep = { x: this.spriteWidth + 11, y: this.spriteHeight + 10 }
      const spriteOffsets: Point = this.getSpriteOffsets(creature.state)
      const spriteLocation = this.spriteLocations[creature.direction]
      this.drawSprite(creature, playerCoordinates, spriteOffsets, spriteLocation, animationSpritePosition)
    }
  }

  private getSpriteOffsets(creatureState: CreatureState) {
    switch (creatureState) {
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
    creature: Creature,
    playerCoordinates: Point,
    animationSpritePosition: number
  ) {

    const { x, y, collisionBox: cBox } = creature
    const { x: px, y: py } = playerCoordinates

    const desinationWidth  = Math.floor(this.spriteDimensions.dying.width  * (creature.collisionBox.width  / 20))
    const desinationHeight = Math.floor(this.spriteDimensions.dying.height * (creature.collisionBox.height / 20))

    context.drawImage(
      this.spriteSheet,
      this.sprites.dying[animationSpritePosition].sx,
      this.sprites.dying[animationSpritePosition].sy,
      this.spriteDimensions.dying.width,  // Draw width
      this.spriteDimensions.dying.height, // Draw height
      Canvas.center.x + (x - px - desinationWidth  / 2), // Canvas Desination X
      Canvas.center.y + (y - py - desinationHeight / 2), // Canvas Desination Y
      desinationWidth, // Draw width
      desinationHeight, // Draw height
    )
  }

  private drawSprite(
    creature: Creature,
    playerCoordinates: Point,
    spriteOffsets: Point,
    spriteLocation: { col: number, flip: boolean },
    animationSpritePosition: number,
  ) {

    const { x, y, collisionBox: cBox } = creature
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
      spriteOffsets.y + this.spriteStep.y * Math.floor(animationSpritePosition),
      this.spriteWidth,
      this.spriteHeight,
      spriteLocation.flip ? 0 - this.spriteWidth / 2 : Canvas.center.x + (x - px - cBox.halfWidth),  // Canvas Desination X
      spriteLocation.flip ? 0                        : Canvas.center.y + (y - py - cBox.halfHeight), // Canvas Desination Y
      creature.collisionBox.width  + 2, // Draw width
      creature.collisionBox.height + 2, // Draw height
    )

    if (spriteLocation.flip) {
      context.restore()
    }
  }
}
