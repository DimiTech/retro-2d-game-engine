import Player from '@app/domain/player/Player'
import Mouse from './Mouse'

export default class Gamepads {
  public static update(player: Player): void {
    const gamepads = navigator.getGamepads()
    if (gamepads[0]) {
      this.handleMovement(gamepads[0], player)
      this.handleAiming(gamepads[0])
      this.handleButtons(gamepads[0], player)
    }
  }

  private static aimModifier = 10

  private static handleMovement(gamepad: any, player: Player): void {
    const movementAxisX: number = +gamepad.axes[0].toFixed(2)
    if (movementAxisX > 0) {
      player.moving.right = true
      player.movingDirections.right = true
    }
    else if (movementAxisX < 0) {
      player.moving.left = true
      player.movingDirections.left = true
    }
    else {
      player.moving.left = false
      player.movingDirections.left = false

      player.moving.right = false
      player.movingDirections.right = false
    }

    const movementAxisY: number = +gamepad.axes[1].toFixed(2)
    if (movementAxisY > 0) {
      player.moving.down = true
      player.movingDirections.down = true
    }
    else if (movementAxisY < 0) {
      player.moving.up = true
      player.movingDirections.up = true
    }
    else {
      player.moving.up = false
      player.movingDirections.up = false

      player.moving.down = false
      player.movingDirections.down = false
    }
  }

  private static handleAiming(gamepad: any): void {
    const aimAxisX = gamepad.axes[2]
    const aimAxisY = gamepad.axes[3]
    if (+aimAxisX.toFixed(2) !== 0) {
      Mouse.x += aimAxisX * this.aimModifier
    }
    if (+aimAxisY.toFixed(2) !== 0) {
      Mouse.y += aimAxisY * this.aimModifier
    }
  }

  private static handleButtons(gamepad: any, player: Player): void {
    const R1 = gamepad.buttons[5]
    if (R1.pressed) {
      player.setShooting(true)
    }
    else {
      player.setShooting(false)
    }
  }
}
