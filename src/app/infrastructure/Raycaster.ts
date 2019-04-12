import * as CONFIG from '@app/configuration/config.json'

import Point from '@app/infrastructure/geometry/Point'
import Player from '@app/domain/Player'
import GameObject from '@app/infrastructure/objects/GameObject'
import { gameObjects } from '@app/domain/Map'

// DEBUG: context - only for debugging
import Canvas, { context } from '@app/infrastructure/Canvas'

export default class Raycaster {
  /**
   * @returns {
   *   hitObject, // the game object that has been hit. If no object are hit - hitObject is `null`
   *   // TODO: Make the hit point the edge of the screen in worst case so the player can't see what's beyond (+ some offset maybe if you want the player to see beyond)
   *   hitPoint   // can be either a point where the ray intersects a game object, or a just a point outside the screen if no object is hit
   * }
   */
  public static cast(p: Player, theta: number): { hitPoint: Point, hitObject: GameObject } {
    if (theta >= 0) { // South
      const yInt = p.deltas.dyBottom
      const xInt = p.deltas.dyBottom / Math.tan(theta)

      if (xInt >= 0) { // South East
        return Raycaster.getInterceptPointSE(p, theta)
      }
      else if (xInt < 0) { // South West
        return Raycaster.getInterceptPointSW(p, theta)
      }
      return {hitPoint: null, hitObject: null}

      // TODO: Delete this
      // else { // South
      //   context.arc(
      //     this.center.x + xInt,
      //     this.center.y + yInt,
      //     2, 0, (2 * Math.PI)
      //   )
      // }

    } else { // North
      return {hitPoint: null, hitObject: null}
      // const yInt = dyTop
      // const xInt = dyTop / Math.tan(-theta)

      // if (xInt > 0 && xInt > dxRight) {
      //   // South East
      //   const yIntEast = dxRight * Math.tan(-theta)
      //   context.arc(
      //     this.center.x + dxRight,
      //     this.center.y - yIntEast,
      //     2, 0, (2 * Math.PI)
      //   )
      // }
      // else if (xInt < 0 && -xInt > dxLeft) {
      //   // South West
      //   const yIntWest = dxLeft * Math.tan(Math.PI - theta)
      //   context.arc(
      //     this.center.x - dxLeft,
      //     this.center.y + yIntWest,
      //     2, 0, (2 * Math.PI)
      //   )
      // }
      // else {
      //   // South
      //   context.arc(
      //     this.center.x + xInt,
      //     this.center.y - yInt,
      //     2, 0, (2 * Math.PI)
      //   )
      // }
    }
  }

  // TODO: This is a naive implementation! Add 6x optimization
  private static getInterceptPointSE(p: Player, theta: number): { hitPoint: Point, hitObject: GameObject } {
    // ########################################################################
    // Vertical Intercepts
    // ########################################################################
    let hitPointVertical: Point = null
    let objectHitVertical: GameObject = null

    let i = 0
    let yIntercept
    let tileStepX

    while (true) {
      tileStepX = i * CONFIG.TILE_SIZE
      if (theta === 0) {
        yIntercept = 0
      } else {
        yIntercept = (p.deltas.dxRight + tileStepX) * Math.tan(theta)
      }

      // Outside of screen check
      if ((tileStepX + p.deltas.dxRight > Canvas.center.x) || (yIntercept > Canvas.center.y)) {
        break
      }

      if (CONFIG.RAYCASTER.DEBUG) {
        context.beginPath()
        context.arc(
          Canvas.center.x + p.deltas.dxRight + tileStepX,
          Canvas.center.y + yIntercept,
          2, 0, (2 * Math.PI)
        )
        context.stroke()
      }

      objectHitVertical = Raycaster.checkGameObjectCollisionVertical(i, p, yIntercept)

      if (objectHitVertical) {
        hitPointVertical = { x: tileStepX + p.deltas.dxRight, y: yIntercept }
        // DEBUG: Enable for debugging
        // context.fillText(`hitPointVert: ${hitPointVertical.x}, ${hitPointVertical.y}`, 250, 10)
        break
      }
      ++i
    }

    // ########################################################################
    // Horizontal Intercepts
    // ########################################################################
    let hitPointHorizontal: Point = null
    let objectHitHorizontal: GameObject = null

    let j = 0
    let xIntercept
    let tileStepY

    while (true) {
      tileStepY = j * CONFIG.TILE_SIZE
      if (theta === 0) {
        break
      } else {
        xIntercept = (p.deltas.dyBottom + tileStepY) / Math.tan(theta)
      }

      // Outside of screen check
      if ((tileStepY + p.deltas.dyBottom > Canvas.center.y) || (xIntercept > Canvas.center.x)) {
        break
      }

      if (CONFIG.RAYCASTER.DEBUG) {
        context.strokeStyle = '#44FF44'
        context.beginPath()
        context.arc(
          Canvas.center.x + xIntercept,
          Canvas.center.y + p.deltas.dyBottom + tileStepY,
          2, 0, (2 * Math.PI)
        )
        context.stroke()
      }

      // Catch up with the horizontal intercept
      if (yIntercept < tileStepY) {
        break
      }

      objectHitHorizontal = Raycaster.checkGameObjectCollisionHorizontal(j, p, xIntercept)

      if (objectHitHorizontal) {
        hitPointHorizontal = { x: xIntercept, y: tileStepY + p.deltas.dyBottom }
        // DEBUG: Enable for debugging
        // context.fillText(`hitPointHorz: ${hitPointHorizontal.x}, ${hitPointHorizontal.y}`, 250, 20)
        break
      }
      ++j
    }

    // ########################################################################
    // Return the closer hit point
    // ########################################################################

    if (hitPointVertical && hitPointHorizontal === null) {
      return {
        hitPoint  : hitPointVertical,
        hitObject : objectHitVertical
      }
    }
    else if (hitPointHorizontal && hitPointVertical === null) {
      return {
        hitPoint  : hitPointHorizontal,
        hitObject : objectHitHorizontal
      }
    }
    else if (hitPointHorizontal && hitPointVertical) {
      const verticalHitDistanceFromPlayer   = Math.sqrt(Math.pow(  hitPointVertical.x, 2) + Math.pow(  hitPointVertical.y, 2))
      const horizontalHitDistanceFromPlayer = Math.sqrt(Math.pow(hitPointHorizontal.x, 2) + Math.pow(hitPointHorizontal.y, 2))
      if (verticalHitDistanceFromPlayer > horizontalHitDistanceFromPlayer) {
        return {
          hitPoint  : hitPointHorizontal,
          hitObject : objectHitHorizontal
        }
      } else {
        return {
          hitPoint  : hitPointVertical,
          hitObject : objectHitVertical
        }
      }
    }
    else if (hitPointHorizontal === null && hitPointVertical === null) {
      // If nothing is hit, just return the last closest point!
      const hitPointHorizontal = { x: xIntercept, y: tileStepY + p.deltas.dyBottom }
      const hitPointVertical   = { x: tileStepX + p.deltas.dxRight, y: yIntercept }
      const verticalHitDistanceFromPlayer   = Math.sqrt(Math.pow(  hitPointVertical.x, 2) + Math.pow(  hitPointVertical.y, 2))
      const horizontalHitDistanceFromPlayer = Math.sqrt(Math.pow(hitPointHorizontal.x, 2) + Math.pow(hitPointHorizontal.y, 2))
      if (verticalHitDistanceFromPlayer > horizontalHitDistanceFromPlayer) {
        return {
          hitPoint  : hitPointHorizontal,
          hitObject : objectHitHorizontal
        }
      } else {
        return {
          hitPoint  : hitPointVertical,
          hitObject : objectHitVertical
        }
      }
    }
  }


  // TODO: This is a naive implementation! Add 6x optimization
  private static getInterceptPointSW(p: Player, theta: number): { hitPoint: Point, hitObject: GameObject } {
    // ########################################################################
    // Vertical Intercepts
    // ########################################################################
    let hitPointVertical: Point = null
    let objectHitVertical: GameObject = null

    let i = 0
    let yIntercept
    let tileStepX

    while (true) {
      tileStepX = i * CONFIG.TILE_SIZE
      if (theta === 0) {
        yIntercept = 0
      } else {
        yIntercept = (p.deltas.dxLeft + tileStepX) * Math.tan(Math.PI - theta)
      }

      // Outside of screen check
      if ((tileStepX + p.deltas.dxLeft > Canvas.center.x) || (yIntercept > Canvas.center.y)) {
        break
      }

      if (CONFIG.RAYCASTER.DEBUG) {
        context.beginPath()
        context.arc(
          Canvas.center.x - p.deltas.dxLeft - tileStepX,
          Canvas.center.y + yIntercept,
          2, 0, (2 * Math.PI)
        )
        context.stroke()
      }

      objectHitVertical = Raycaster.checkGameObjectCollisionVerticalSW(i, p, yIntercept)

      if (objectHitVertical) {
        hitPointVertical = { x: -tileStepX - p.deltas.dxLeft, y: yIntercept }
        // DEBUG: Enable for debugging
        // context.fillText(`hitPointVert: ${hitPointVertical.x}, ${hitPointVertical.y}`, 250, 10)
        break
      }
      ++i
    }

    // ########################################################################
    // Horizontal Intercepts
    // ########################################################################
    let hitPointHorizontal: Point = null
    let objectHitHorizontal: GameObject = null

    let j = 0
    let xIntercept
    let tileStepY

    while (true) {
      tileStepY = j * CONFIG.TILE_SIZE
      if (theta === 0) {
        break
      } else {
        xIntercept = (p.deltas.dyBottom + tileStepY) / Math.tan(theta)
      }

      // Outside of screen check
      if ((tileStepY + p.deltas.dyBottom > Canvas.center.y) || (xIntercept > Canvas.center.x)) {
        break
      }

      if (CONFIG.RAYCASTER.DEBUG) {
        context.strokeStyle = '#44FF44'
        context.beginPath()
        context.arc(
          Canvas.center.x + xIntercept,
          Canvas.center.y + p.deltas.dyBottom + tileStepY,
          2, 0, (2 * Math.PI)
        )
        context.stroke()
      }

      // Catch up with the horizontal intercept
      if (yIntercept < tileStepY) {
        break
      }

      objectHitHorizontal = Raycaster.checkGameObjectCollisionHorizontalSW(j, p, xIntercept)

      if (objectHitHorizontal) {
        hitPointHorizontal = { x: xIntercept, y: tileStepY + p.deltas.dyBottom }
        // DEBUG: Enable for debugging
        context.fillText(`hitPointHorz: ${hitPointHorizontal.x}, ${hitPointHorizontal.y}`, 250, 20)
        break
      }
      ++j
    }

    // ########################################################################
    // Return the closer hit point & hit object
    // ########################################################################

    if (hitPointVertical && hitPointHorizontal === null) {
      return {
        hitPoint  : hitPointVertical,
        hitObject : objectHitVertical
      }
    }
    else if (hitPointHorizontal && hitPointVertical === null) {
      return {
        hitPoint  : hitPointHorizontal,
        hitObject : objectHitHorizontal
      }
    }
    else if (hitPointHorizontal && hitPointVertical) {
      const verticalHitDistanceFromPlayer   = Math.sqrt(Math.pow(  hitPointVertical.x, 2) + Math.pow(  hitPointVertical.y, 2))
      const horizontalHitDistanceFromPlayer = Math.sqrt(Math.pow(hitPointHorizontal.x, 2) + Math.pow(hitPointHorizontal.y, 2))
      if (verticalHitDistanceFromPlayer > horizontalHitDistanceFromPlayer) {
        return {
          hitPoint  : hitPointHorizontal,
          hitObject : objectHitHorizontal
        }
      } else {
        return {
          hitPoint  : hitPointVertical,
          hitObject : objectHitVertical
        }
      }
    }
    else if (hitPointHorizontal === null && hitPointVertical === null) {
      // If nothing is hit, just return the last closest point!
      const hitPointHorizontal = { x: xIntercept, y: tileStepY + p.deltas.dyBottom }
      const hitPointVertical   = { x: -tileStepX - p.deltas.dxLeft, y: yIntercept }
      const verticalHitDistanceFromPlayer   = Math.sqrt(Math.pow(  hitPointVertical.x, 2) + Math.pow(  hitPointVertical.y, 2))
      const horizontalHitDistanceFromPlayer = Math.sqrt(Math.pow(hitPointHorizontal.x, 2) + Math.pow(hitPointHorizontal.y, 2))
      if (verticalHitDistanceFromPlayer > horizontalHitDistanceFromPlayer) {
        return {
          hitPoint  : hitPointHorizontal,
          hitObject : objectHitHorizontal
        }
      } else {
        return {
          hitPoint  : hitPointVertical,
          hitObject : objectHitVertical
        }
      }
    }
  }

  private static checkGameObjectCollisionVertical(i: number, p: Player, yIntercept: number): GameObject {
    const xTile = 1 + p.col + i
    const yTile = p.row + Math.floor((p.deltas.dyTop + yIntercept) / CONFIG.TILE_SIZE)

    let gameObjectHit = null
    if (gameObjects[yTile] && gameObjects[yTile][xTile]) {
      gameObjectHit = gameObjects[yTile][xTile]
    }

    if (CONFIG.RAYCASTER.DEBUG) {
      context.fillText(`col: ${xTile}, row: ${yTile}, hit: ${gameObjectHit ? [gameObjectHit.row, gameObjectHit.col] : null}`, 10, 112 + i * 12)
    }

    return gameObjectHit
  }
  private static checkGameObjectCollisionHorizontal(i: number, p: Player, xIntercept: number): GameObject {
    const xTile = p.col + Math.floor((p.deltas.dxLeft + xIntercept) / CONFIG.TILE_SIZE)
    const yTile = p.row + i + 1

    let gameObjectHit = null
    if (gameObjects[yTile] && gameObjects[yTile][xTile]) {
      gameObjectHit = gameObjects[yTile][xTile]
    }

    if (CONFIG.RAYCASTER.DEBUG) {
      context.fillText(`col: ${xTile}, row: ${yTile}, hit: ${gameObjectHit ? [gameObjectHit.row, gameObjectHit.col] : null}`, 10, 212 + i * 12)
    }

    return gameObjectHit
  }

  private static checkGameObjectCollisionVerticalSW(i: number, p: Player, yIntercept: number): GameObject {
    const xTile = p.col - i - 1
    const yTile = p.row + Math.floor((p.deltas.dyTop + yIntercept) / CONFIG.TILE_SIZE)

    let gameObjectHit = null
    if (gameObjects[yTile] && gameObjects[yTile][xTile]) {
      gameObjectHit = gameObjects[yTile][xTile]
    }

    if (CONFIG.RAYCASTER.DEBUG) {
      context.fillText(`col: ${xTile}, row: ${yTile}, hit: ${gameObjectHit ? [gameObjectHit.row, gameObjectHit.col] : null}`, 10, 112 + i * 12)
    }

    return gameObjectHit
  }
  private static checkGameObjectCollisionHorizontalSW(i: number, p: Player, xIntercept: number): GameObject {
    const xTile = p.col - Math.floor((p.deltas.dxRight - xIntercept) / CONFIG.TILE_SIZE)
    const yTile = p.row + i + 1

    let gameObjectHit = null
    if (gameObjects[yTile] && gameObjects[yTile][xTile]) {
      gameObjectHit = gameObjects[yTile][xTile]
    }

    if (CONFIG.RAYCASTER.DEBUG) {
      context.fillText(`col: ${xTile}, row: ${yTile}, hit: ${gameObjectHit ? [gameObjectHit.row, gameObjectHit.col] : null}`, 10, 212 + i * 12)
    }

    return gameObjectHit
  }
}