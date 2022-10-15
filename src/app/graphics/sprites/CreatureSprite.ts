import Point from '@app/infrastructure/geometry/Point'
import Enemy from '@app/domain/enemies/Enemy'

export default abstract class CreatureSprite {
  public spriteSheet: HTMLImageElement

  public abstract numberOfSpritesInAnimation: { [animation: string]: number }

  protected abstract url: string
  public abstract draw(e: Enemy, playerCoordinates: Point, animationSpritePosition?: number): void

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
