import * as CONFIG from '@app/configuration/config.json'

import ProjectileCircle from '@app/domain/player/projectiles/ProjectileCircle'

import SoundFX from '@app/audio/SoundFX'

import RangedWeapon from './RangedWeapon'

export default class RifleLine extends RangedWeapon {
  // TODO: Adjust for attack feeling
  protected firingSpeed = 0.1 // seconds
  protected cooldown    = 0   // ms
  protected maxCooldown = (1000 * this.firingSpeed) / CONFIG.GAME_SPEED

  protected projectileConstructor = ProjectileCircle

  protected playShootSFX() {
    SoundFX.playSMG()
  }
}