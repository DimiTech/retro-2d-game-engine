import Sprites from '@app/graphics/Sprites'
import CreatureSprite from '@app/graphics/sprites/CreatureSprite'

import AnimationState from '@app/domain/AnimationState'

export default class ConcreteEnemyAnimationMovingCooldown extends AnimationState {
  protected sprite: CreatureSprite = Sprites.Zerg

  protected animationLength   = 0
  protected animationProgress = 0

  protected animationSpritePosition    = 0
  protected numberOfSpritesInAnimation = 0
}