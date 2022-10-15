import CreatureSprite from './sprites/CreatureSprite'
import ZergSpriteSectionMovingAttacking from './sprites/ZergSpriteSectionMovingAttacking'

export default class Sprites {
  public static Zerg: CreatureSprite = new ZergSpriteSectionMovingAttacking()

  public static async load(setLoadedPercentage: (percentage: number) => void): Promise<void> {
    await Sprites.Zerg.load(() => setLoadedPercentage(1.0))
  }
}
