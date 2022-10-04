import Canvas, { context } from '@app/infrastructure/Canvas'
import Point from '@app/infrastructure/geometry/Point'
import CreatureState from '@app/domain/CreatureState'
import Enemy from '@app/domain/enemies/Enemy'

import CreatureSprite from './CreatureSprite'

export default class SpriteZerg extends CreatureSprite {
  public url: string = './graphics/spritesheets/zergling.png'

  public animationPeriods = {
    walking: 8,
  }

  public draw(enemy: Enemy, playerCoordinates: Point) {

    const SPRITE_LOCATIONS: { [key: string]: { col: number, flip: boolean } } = {
      N : { col: 0, flip: false },
      NE: { col: 2, flip: false },
      E : { col: 4, flip: false },
      SE: { col: 6, flip: false },
      S : { col: 8, flip: false },
      SW: { col: 6, flip: true  },
      W : { col: 4, flip: true  },
      NW: { col: 2, flip: true  },
    }

    const spriteLocation = SPRITE_LOCATIONS[enemy.direction]

    const SPRITE_SIZE = 32
    const SPRITE_OFFSETS = {
      INITIAL: { x: 7, y: 5 },
      STEP: { x: SPRITE_SIZE + 11, y: SPRITE_SIZE + 10 }
    }
    const { x, y, collisionBox: cBox } = enemy
    const { x: px, y: py } = playerCoordinates

    if (enemy.state !== CreatureState.Moving) {
      enemy.animationPosition = 0
    }

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
      SPRITE_OFFSETS.INITIAL.x + SPRITE_OFFSETS.STEP.x * spriteLocation.col,
      SPRITE_OFFSETS.INITIAL.y + SPRITE_OFFSETS.STEP.y * Math.floor(enemy.animationPosition / 2),
      SPRITE_SIZE,
      SPRITE_SIZE,
      spriteLocation.flip ? 0 - SPRITE_SIZE / 2 : Canvas.center.x + (x - px - cBox.halfWidth),
      spriteLocation.flip ? 0                   : Canvas.center.y + (y - py - cBox.halfHeight),
      enemy.collisionBox.width + 2,
      enemy.collisionBox.height + 2,
    )
    if (spriteLocation.flip) {
      context.restore()
    }
  }
}
