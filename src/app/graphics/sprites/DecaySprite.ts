import Canvas, { context } from '@app/infrastructure/Canvas'
import Point from '@app/infrastructure/geometry/Point'

import CreatureSprite from './CreatureSprite'
import Creature from '@app/domain/Creature'

export default class DecaySprite extends CreatureSprite {
  public url = './graphics/spritesheets/decay.png'


  private spriteProperties = {
    decay: {
      width: 56,
      height: 56,
      gapX: 3,
      gapY: 3,
    }
  }

  private manuallyCalculatedSprites = {
    decay: [
      {
        sy: 2 * (this.spriteProperties.decay.height + this.spriteProperties.decay.gapY) + 2,
      },
      {
        sy: 1 * (this.spriteProperties.decay.height + this.spriteProperties.decay.gapY) + 2,
      },
      {
        sy: 0 * (this.spriteProperties.decay.height + this.spriteProperties.decay.gapY) + 2,
      },
    ]
  }

  constructor() {
    super()
  }

  public draw(creature: Creature, playerCoordinates: Point, animationSpritePosition: number) {
    this.drawSpritedecay(creature, playerCoordinates, animationSpritePosition)
  }

  private drawSpritedecay(
    creature: Creature,
    playerCoordinates: Point,
    animationSpritePosition: number
  ) {

    const { x, y } = creature
    const { x: px, y: py } = playerCoordinates

    let desinationWidth  = Math.floor(this.spriteProperties.decay.width  * (creature.collisionBox.width  / 15))
    let desinationHeight = Math.floor(this.spriteProperties.decay.height * (creature.collisionBox.height / 20))

    // Destination dimensions must be multiples of 2, so Chrome can render the sprite properly
    desinationWidth  = desinationWidth - desinationWidth % 2
    desinationHeight = desinationHeight - desinationHeight % 2

    const totalColumnsInSprite = 4
    const randomSxColumn = (creature.x + creature.y) % totalColumnsInSprite
    const randomSx = 2 + (randomSxColumn * (this.spriteProperties.decay.width + this.spriteProperties.decay.gapX))

    context.drawImage(
      this.spriteSheet,
      randomSx,
      this.manuallyCalculatedSprites.decay[animationSpritePosition].sy,
      this.spriteProperties.decay.width,  // Sprite width
      this.spriteProperties.decay.height, // Sprite height
      Canvas.center.x + (x - px - desinationWidth  / 2), // Canvas Desination X
      Canvas.center.y + (y - py - desinationHeight / 2), // Canvas Desination Y
      desinationWidth,
      desinationHeight,
    )
  }
}
