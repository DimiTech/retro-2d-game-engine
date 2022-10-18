import * as CONFIG from '@app/configuration/config.json'

import Canvas from '@app/infrastructure/Canvas'
import GameTime from '@app/infrastructure/GameTime'

import Projectile from '@app/domain/player/projectiles/Projectile'

export default abstract class RangedWeapon {
  // TODO: Adjust for attack feeling
  protected firingSpeed : number // seconds
  protected cooldown    : number // ms
  protected maxCooldown : number // ms

  protected shooting = false

  protected abstract playShootSFX(): void

  protected projectileConstructor: new (
    x: number,
    y: number,
    directionX: number,
    directionY: number,
  ) => Projectile

  public projectiles: Projectile[] = []

  public update(playerX: number, playerY: number) {
    this.shoot(playerX, playerY)

    if (!this.projectiles.length) {
      return
    }

    this.projectiles.forEach((p, i) => {
      p.update(playerX, playerY)
      if (p.alive === false) {
        this.removeProjectile(i)
      }
    })
  }

  public draw(playerX: number, playerY: number): void {
    if (this.projectiles.length) {
      this.projectiles.forEach((p) => p.draw(playerX, playerY))
    }
  }

  public shoot(playerX: number, playerY: number): void {
    if (this.cooldown >= 0) {
      this.cooldown -= GameTime.frameElapsedTime
      if (this.cooldown < 0) {
        this.cooldown = 0
      }
    }

    if (this.shooting === false) {
      return
    }

    if (this.cooldown <= 0) {

      this.fireProjectile(playerX, playerY)
      this.resetAttackCooldown()

      this.playShootSFX()
    }
  }

  public fireProjectile(playerX: number, playerY: number): void {
    const dx = Canvas.mousePosition.x - Canvas.center.x
    const dy = Canvas.mousePosition.y - Canvas.center.y
    let xVel = dx / (Math.abs(dx) + Math.abs(dy))
    let yVel = dy / (Math.abs(dx) + Math.abs(dy))

    // TODO: GAME FEATURE: Insert accuracy skill to reduce bullet motion randomness
    // TODO: Fix the problem with different bullet speeds caused by randomness
    if (CONFIG.FEATURES.SCATTER_PROJECTILES) {
      const randomFactorX = Math.random() * 0.1 - 0.05
      const randomFactorY = Math.random() * 0.1 - 0.05
      xVel += randomFactorX
      yVel += randomFactorY
    }

    this.projectiles.push(new this.projectileConstructor(playerX, playerY, xVel, yVel))
  }

  public setShooting(isShooting: boolean): void {
    this.shooting = isShooting
  }

  protected removeProjectile(projectileIndex: number) {
    this.projectiles.splice(projectileIndex, 1) // Remove the projectile
  }

  protected resetAttackCooldown() {
    this.cooldown = this.maxCooldown
  }
}