import Sprites from '@app/graphics/Sprites'
import CreatureSprite from '@app/graphics/sprites/CreatureSprite'

import AnimationState from '@app/domain/AnimationState'

export default class ConcreteEnemyAnimationMoving extends AnimationState {
  protected sprite: CreatureSprite = Sprites.Zerg

  protected animationLength   = 330
  protected animationProgress = 0

  protected animationSpritePosition    = 0
  protected numberOfSpritesInAnimation = 7
}