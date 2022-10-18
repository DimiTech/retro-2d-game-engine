import Canvas, { context } from '@app/infrastructure/Canvas'
import Point from '@app/infrastructure/geometry/Point'
import CreatureState from '@app/domain/CreatureState'

import CreatureSprite from './CreatureSprite'
import Creature from '@app/domain/Creature'

export default class ZergSprite extends CreatureSprite {
  public url = './graphics/spritesheets/zergling.png'

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

  private spriteProperties = {
    default: {
      width: 32,
      height: 32,
    },
    dying: {
      width: 65,
      height: 53,
      gapX: 3,
      sy: 548,
    }
  }

  private manuallyCalculatedSprites = {
    dying: [
      {
        sx: 0 * (this.spriteProperties.dying.width + this.spriteProperties.dying.gapX) + 2,
        sy: this.spriteProperties.dying.sy,
      },
      {
        sx: 1 * (this.spriteProperties.dying.width + this.spriteProperties.dying.gapX) + 2,
        sy: this.spriteProperties.dying.sy,
      },
      {
        sx: 2 * (this.spriteProperties.dying.width + this.spriteProperties.dying.gapX) + 2,
        sy: this.spriteProperties.dying.sy,
      },
      {
        sx: 3 * (this.spriteProperties.dying.width + this.spriteProperties.dying.gapX) + 2,
        sy: this.spriteProperties.dying.sy,
      },
      {
        sx: 4 * (this.spriteProperties.dying.width + this.spriteProperties.dying.gapX) + 2,
        sy: this.spriteProperties.dying.sy,
      },
      {
        sx: 5 * (this.spriteProperties.dying.width + this.spriteProperties.dying.gapX) + 2,
        sy: this.spriteProperties.dying.sy,
      },
      {
        sx: 6 * (this.spriteProperties.dying.width + this.spriteProperties.dying.gapX) + 2,
        sy: this.spriteProperties.dying.sy,
      },
    ]
  }

  constructor() {
    super()
  }

  public draw(creature: Creature, playerCoordinates: Point, animationSpritePosition: number) {
    if (creature.state === CreatureState.Dying) {
      this.drawSpriteDying(creature, playerCoordinates, animationSpritePosition)
    }
    else {
      const spriteWidth  = this.spriteProperties.default.width
      const spriteHeight = this.spriteProperties.default.height
      const spriteStep: Point = { x: spriteWidth + 11, y: spriteHeight + 10 }
      const spriteOffsets: Point = this.getSpriteOffsets(creature.state, spriteStep)
      const spriteLocation = this.spriteLocations[creature.direction]
      this.drawSprite(creature, playerCoordinates, spriteOffsets, spriteStep, spriteLocation, spriteWidth, spriteHeight, animationSpritePosition)
    }
  }

  private getSpriteOffsets(creatureState: CreatureState, spriteStep: Point) {
    const defaultSpriteOffset = {
      x: 7,
      y: 5
    }
    switch (creatureState) {
      case CreatureState.Idling:
      case CreatureState.Moving:
      case CreatureState.MovingCooldown:
      case CreatureState.AttackingCooldown:
        return defaultSpriteOffset
      case CreatureState.Attacking:
        const ATTACK_SPRITES_ROW = 7
        return {
          x: defaultSpriteOffset.x,
          y: defaultSpriteOffset.y + (ATTACK_SPRITES_ROW * spriteStep.y)
        }
    }
  }

  private drawSpriteDying(
    creature: Creature,
    playerCoordinates: Point,
    animationSpritePosition: number
  ) {

    const { x, y } = creature
    const { x: px, y: py } = playerCoordinates

    const desinationWidth  = Math.floor(this.spriteProperties.dying.width  * (creature.collisionBox.width  / 20))
    const desinationHeight = Math.floor(this.spriteProperties.dying.height * (creature.collisionBox.height / 20))

    context.drawImage(
      this.spriteSheet,
      this.manuallyCalculatedSprites.dying[animationSpritePosition].sx,
      this.manuallyCalculatedSprites.dying[animationSpritePosition].sy,
      this.spriteProperties.dying.width,  // Draw width
      this.spriteProperties.dying.height, // Draw height
      Canvas.center.x + (x - px - desinationWidth  / 2), // Canvas Desination X
      Canvas.center.y + (y - py - desinationHeight / 2), // Canvas Desination Y
      desinationWidth,
      desinationHeight,
    )
  }

  private drawSprite(
    creature: Creature,
    playerCoordinates: Point,
    spriteOffsets: Point,
    spriteStep: Point,
    spriteLocation: { col: number, flip: boolean },
    spriteWidth: number,
    spriteHeight: number,
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

    const desinationWidth  = creature.collisionBox.width  + 2
    const desinationHeight = creature.collisionBox.height + 2

    context.drawImage(
      this.spriteSheet,
      spriteOffsets.x + spriteStep.x * spriteLocation.col,
      spriteOffsets.y + spriteStep.y * Math.floor(animationSpritePosition),
      spriteWidth,
      spriteHeight,
      spriteLocation.flip ? 0 - spriteWidth / 2 : Canvas.center.x + (x - px - cBox.halfWidth),  // Canvas Desination X
      spriteLocation.flip ? 0                   : Canvas.center.y + (y - py - cBox.halfHeight), // Canvas Desination Y
      desinationWidth,
      desinationHeight,
    )

    if (spriteLocation.flip) {
      context.restore()
    }
  }
}
