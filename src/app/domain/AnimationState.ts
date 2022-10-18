import Point from '@app/infrastructure/geometry/Point'
import GameTime from '@app/infrastructure/GameTime'

import CreatureSprite from '@app/graphics/sprites/CreatureSprite'

import Creature from '@app/domain/Creature'

export default abstract class AnimationState {
  protected sprite: CreatureSprite

  protected animationLength   : number // ms
  protected animationProgress : number // ms

  protected numberOfSpritesInAnimation : number // integer
  protected animationSpritePosition    : number // integer

  protected oneShotAnimation = false

  public animationFinished: boolean
  
  public advanceAnimation(): void {
    if (this.animationFinished && this.oneShotAnimation) {
      return // don't animate
    }

    this.animationProgress = this.animationProgress + GameTime.elapsedTimeFactor
    const animationProgressPercentage = this.animationProgress / this.animationLength
    this.animationSpritePosition = Math.floor(animationProgressPercentage * this.numberOfSpritesInAnimation) % this.numberOfSpritesInAnimation

    this.animationFinished = animationProgressPercentage >= 1.0
  }

  public resetAnimation(): void {
    this.animationFinished = false
    this.animationProgress = 0
    this.animationSpritePosition = 0
  }

  public draw(c: Creature, playerCoordinates: Point): void {
    this.sprite.draw(c, playerCoordinates, this.animationSpritePosition)
  }
}
