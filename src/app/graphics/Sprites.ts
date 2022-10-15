import CreatureSprite from './sprites/CreatureSprite'
import ZergSprite from './sprites/ZergSprite'

export default class Sprites {
  public static Zerg: CreatureSprite = new ZergSprite()

  public static async load(setLoadedPercentage: (percentage: number) => void): Promise<void> {
    await Sprites.Zerg.load(() => setLoadedPercentage(1.0))
  }
}
