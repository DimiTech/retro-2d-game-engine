import * as CONFIG from '@app/configuration/config.json'

import { context } from '@app/infrastructure/Canvas'
import SoundFX from '@app/audio/SoundFX'
import GameObject from '../GameObject'

export default class Wall extends GameObject {
  draw(): void {
    context.strokeStyle = this.color
    context.lineWidth = 1
    context.beginPath()
      // Draw outline
      context.moveTo( 0.5 + this.x,                     0.5 + this.y)
      context.lineTo(-0.5 + this.x + CONFIG.TILE_SIZE,  0.5 + this.y)
      context.lineTo(-0.5 + this.x + CONFIG.TILE_SIZE, -0.5 + this.y + CONFIG.TILE_SIZE)
      context.lineTo( 0.5 + this.x                   , -0.5 + this.y + CONFIG.TILE_SIZE)
      context.lineTo( 0.5 + this.x,                     0.5 + this.y)

      // Draw the 'x'
      context.moveTo( 0.5 + this.x,                     0.5 + this.y)
      context.lineTo(-0.5 + this.x + CONFIG.TILE_SIZE, -0.5 + this.y + CONFIG.TILE_SIZE)
      context.moveTo(-0.5 + this.x + CONFIG.TILE_SIZE,  0.5 + this.y)
      context.lineTo( 0.5 + this.x,                    -0.5 + this.y + CONFIG.TILE_SIZE)
    context.stroke()
  }

  public takeDamage(damageAmount: number): void {
    SoundFX.playWallHit()
  }
}
