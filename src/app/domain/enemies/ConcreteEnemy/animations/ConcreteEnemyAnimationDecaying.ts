import Sprites from '@app/graphics/Sprites'
import CreatureSprite from '@app/graphics/sprites/CreatureSprite'

import AnimationState from '@app/domain/AnimationState'

export default class ConcreteEnemyAnimationDecaying extends AnimationState {
  protected sprite: CreatureSprite = Sprites.Decay

  protected animationLength   = 10000
  protected animationProgress = 0

  protected animationSpritePosition    = 0
  protected numberOfSpritesInAnimation = 3
}