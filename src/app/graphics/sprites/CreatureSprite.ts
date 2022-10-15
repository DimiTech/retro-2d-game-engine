import Point from '@app/infrastructure/geometry/Point'
import Creature from '@app/domain/Creature'

export default abstract class CreatureSprite {
  public spriteSheet: HTMLImageElement

  protected abstract url: string
  public abstract draw(c: Creature, playerCoordinates: Point, animationSpritePosition?: number): void

  public load(callback: () => void): Promise<void> {
    return new Promise((resolve, _reject) => {
      this.spriteSheet = new Image()
      this.spriteSheet.src = this.url
      this.spriteSheet.onload = () => {
        callback()
        resolve()
      }
    })
  }
}
