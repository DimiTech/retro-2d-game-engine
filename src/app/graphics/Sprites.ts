import CreatureSprite from './sprites/CreatureSprite'
import ZergSprite from './sprites/ZergSprite'
import DecaySprite from './sprites/DecaySprite'

export default class Sprites {
  public static Zerg : CreatureSprite = new ZergSprite()
  public static Decay: CreatureSprite = new DecaySprite()

  public static async load(setLoadedPercentage: (percentage: number) => void): Promise<void> {
    await Sprites.Decay.load(() => setLoadedPercentage(0.5))
    await Sprites.Zerg.load(() => setLoadedPercentage(1.0))
  }
}
