import Canvas, { context } from '@app/infrastructure/Canvas'
import Point from '@app/infrastructure/geometry/Point'
import CreatureState from '@app/domain/CreatureState'
import Enemy from '@app/domain/enemies/Enemy'

import CreatureSprite from './CreatureSprite'

export default class SpriteZerg extends CreatureSprite {
  public url: string = './graphics/spritesheets/zergling.png'

  public animationLength = {
    walking: 8,
    attacking: 10,
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
  private spriteSize = 32
  private spriteStep: Point

  constructor() {
    super()
    this.spriteStep = { x: this.spriteSize + 11, y: this.spriteSize + 10 }
  }

  public draw(enemy: Enemy, playerCoordinates: Point) {
    const spriteOffsets: Point = this.getSpriteOffsets(enemy.state, this.spriteStep)

    const spriteLocation = this.spriteLocations[enemy.direction]

    this.drawSprite(enemy, playerCoordinates, spriteOffsets, spriteLocation)
  }

  private getSpriteOffsets(enemyState: CreatureState, SPRITE_STEP: Point) {
    switch (enemyState) {
      case CreatureState.Moving:
      case CreatureState.Idling:
        return {
          x: 7,
          y: 5
        }
      case CreatureState.Attacking:
        const ATTACK_SPRITES_ROW = 7
        return {
          x: 7,
          y: 5 + (ATTACK_SPRITES_ROW * SPRITE_STEP.y)
        }
    }
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
      spriteOffsets.y + this.spriteStep.y * Math.floor(enemy.animationPosition / 2),
      this.spriteSize,
      this.spriteSize,
      spriteLocation.flip ? 0 - this.spriteSize / 2 : Canvas.center.x + (x - px - cBox.halfWidth),  // Canvas Desination X
      spriteLocation.flip ? 0                   : Canvas.center.y + (y - py - cBox.halfHeight), // Canvas Desination Y
      enemy.collisionBox.width  + 2, // Draw width
      enemy.collisionBox.height + 2, // Draw height
    )

    if (spriteLocation.flip) {
      context.restore()
    }
  }
}
