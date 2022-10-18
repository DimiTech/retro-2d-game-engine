import * as CONFIG from '@app/configuration/config.json'

import ProjectileLine from '@app/domain/player/projectiles/ProjectileLine'

import SoundFX from '@app/audio/SoundFX'

import RangedWeapon from './RangedWeapon'

export default class RifleLine extends RangedWeapon {
  // TODO: Adjust for attack feeling
  protected firingSpeed = 0.05 // seconds
  protected cooldown    = 0    // ms
  protected maxCooldown = (1000 * this.firingSpeed) / CONFIG.GAME_SPEED

  protected projectileConstructor = ProjectileLine

  protected playShootSFX() {
    SoundFX.playSMG()
  }
}