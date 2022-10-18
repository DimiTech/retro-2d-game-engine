import * as CONFIG from '@app/configuration/config.json'

import Point, { angleBetweenPoints } from '@app/infrastructure/geometry/Point'
import Wall from '@app/domain/objects/wall/Wall'
import Map from '@app/domain/map/Map'

import Canvas, { context } from '@app/infrastructure/Canvas'
import RaycastablePoint from './geometry/RaycastablePoint'
import Enemy from '@app/domain/enemies/Enemy'
import { PathNode } from './Pathfinding'
import Player from '@app/domain/player/Player'
import { Pi2Decimals } from './math/MathUtils'

export default class Raycaster {
  /**
   * @param p     - Point from which to start Raycasting
   * @param theta - Ray angle
   * @param pEnd? - Optional ending point up to which the cast will be performed
   *
   * @returns {
   *   wallHit, // the wall that has been hit. If no walls are hit - wallHit is `null`
   *   hitPoint // can be either a point where the ray intersects a wall, or a just a point outside the screen if no wall is hit
   * }
   */
  public static cast(
    p: RaycastablePoint,
    theta: number,
    pEnd?: RaycastablePoint
  ): { hitPoint: Point, wallHit: Wall } {
    if (theta >= 0) { // South
      const xInt = p.deltas.dyBottom / Math.tan(theta)

      if (xInt >= 0) { // South East
        return Raycaster.getInterceptPointSE(p, theta, pEnd)
      }
      else if (xInt < 0) { // South West
        return Raycaster.getInterceptPointSW(p, theta, pEnd)
      }
    } else { // North
      const xInt = p.deltas.dyTop / Math.tan(-theta)

      // We must check if xInt is positive because sometimes it can be: 0 or -0
      const xIntIsPositive = (1 / xInt) > 0

      if (xInt >= 0 && xIntIsPositive) { // North East
        return Raycaster.getInterceptPointNE(p, theta, pEnd)
      }
      else { // North West
        return Raycaster.getInterceptPointNW(p, theta, pEnd)
      }
    }
  }

  public static drawRay(hitPoint: Point, color = '#4444FF'): void {
    context.strokeStyle = color
    context.lineWidth = 0.25
    context.beginPath()
      context.moveTo(Canvas.halfWidth, Canvas.halfHeight)
      context.lineTo(
        Canvas.halfWidth + hitPoint.x,
        Canvas.halfHeight + hitPoint.y
      )
    context.stroke()
    context.lineWidth = 1
  }

  public static determineIfThereAreObstaclesBetweenTwoPoints(p1: RaycastablePoint, p2: RaycastablePoint): boolean {
    const angleBetweenTwoGivenPoints = angleBetweenPoints(p2, p1)
    const results = Raycaster.cast(p1, angleBetweenTwoGivenPoints, p2)

    // I have to check if results exist because sometimes .cast() can return 'undefined'..
    // Why .cast() sometimes returns 'undefined' could be worth investigating in the future..
    if (results) {
      return results.wallHit !== null
    }
    else {
      return true
    }
  }

  // This function is very computationaly expensive, see if it can be optimized
  public static determineIfThereAreObstaclesBetweenTwoPathNodes(n1: PathNode | Enemy, n2: PathNode | Player) {
    const angleBetweenNodes: number = +angleBetweenPoints(n2, n1).toFixed(2)

    if (angleBetweenNodes === 0) { // 0deg
      const [vNE1, vNE2] = getVerticesNE(n1, n2)
      if (Raycaster.determineIfThereAreObstaclesBetweenTwoPoints(vNE1 as RaycastablePoint, vNE2 as RaycastablePoint)) {
        return true
      }
      const [vSE1, vSE2] = getVerticesSE(n1, n2)
      if (Raycaster.determineIfThereAreObstaclesBetweenTwoPoints(vSE1 as RaycastablePoint, vSE2 as RaycastablePoint)) {
        return true
      }
      return false
    }

    else if (angleBetweenNodes > 0 && angleBetweenNodes < Pi2Decimals / 2) { // between 0deg and 90deg
      const [vNE1, vNE2] = getVerticesNE(n1, n2)
      if (Raycaster.determineIfThereAreObstaclesBetweenTwoPoints(vNE1 as RaycastablePoint, vNE2 as RaycastablePoint)) {
        return true
      }
      const [vSW1, vSW2] = getVerticesSW(n1, n2)
      if (Raycaster.determineIfThereAreObstaclesBetweenTwoPoints(vSW1 as RaycastablePoint, vSW2 as RaycastablePoint)) {
        return true
      }
      return false
    }

    else if (angleBetweenNodes === (Pi2Decimals / 2)) { // 90deg
      const [vSE1, vSE2] = getVerticesSE(n1, n2)
      if (Raycaster.determineIfThereAreObstaclesBetweenTwoPoints(vSE1 as RaycastablePoint, vSE2 as RaycastablePoint)) {
        return true
      }
      const [vSW1, vSW2] = getVerticesSW(n1, n2)
      if (Raycaster.determineIfThereAreObstaclesBetweenTwoPoints(vSW1 as RaycastablePoint, vSW2 as RaycastablePoint)) {
        return true
      }
      return false
    }

    else if (angleBetweenNodes > Pi2Decimals / 2 && angleBetweenNodes < Pi2Decimals) { // between 90deg and 180deg
      const [vNW1, vNW2] = getVerticesNW(n1, n2)
      if (Raycaster.determineIfThereAreObstaclesBetweenTwoPoints(vNW1 as RaycastablePoint, vNW2 as RaycastablePoint)) {
        return true
      }
      const [vSE1, vSE2] = getVerticesSE(n1, n2)
      if (Raycaster.determineIfThereAreObstaclesBetweenTwoPoints(vSE1 as RaycastablePoint, vSE2 as RaycastablePoint)) {
        return true
      }
      return false
    }

    else if (Math.abs(angleBetweenNodes) === Pi2Decimals) { // 180deg
      const [vNW1, vNW2] = getVerticesNW(n1, n2)
      if (Raycaster.determineIfThereAreObstaclesBetweenTwoPoints(vNW1 as RaycastablePoint, vNW2 as RaycastablePoint)) {
        return true
      }
      const [vSW1, vSW2] = getVerticesSW(n1, n2)
      if (Raycaster.determineIfThereAreObstaclesBetweenTwoPoints(vSW1 as RaycastablePoint, vSW2 as RaycastablePoint)) {
        return true
      }
      return false
    }

    else if (angleBetweenNodes > -Pi2Decimals && angleBetweenNodes < -Pi2Decimals / 2) { // between 180deg and 270deg
      const [vNE1, vNE2] = getVerticesNE(n1, n2)
      if (Raycaster.determineIfThereAreObstaclesBetweenTwoPoints(vNE1 as RaycastablePoint, vNE2 as RaycastablePoint)) {
        return true
      }
      const [vSW1, vSW2] = getVerticesSW(n1, n2)
      if (Raycaster.determineIfThereAreObstaclesBetweenTwoPoints(vSW1 as RaycastablePoint, vSW2 as RaycastablePoint)) {
        return true
      }
      return false
    }

    else if (angleBetweenNodes === -Pi2Decimals / 2) { // 270deg
      const [vNE1, vNE2] = getVerticesNE(n1, n2)
      if (Raycaster.determineIfThereAreObstaclesBetweenTwoPoints(vNE1 as RaycastablePoint, vNE2 as RaycastablePoint)) {
        return true
      }
      const [vNW1, vNW2] = getVerticesNW(n1, n2)
      if (Raycaster.determineIfThereAreObstaclesBetweenTwoPoints(vNW1 as RaycastablePoint, vNW2 as RaycastablePoint)) {
        return true
      }
      return false
    }

    else if (angleBetweenNodes > -Pi2Decimals / 2 && angleBetweenNodes < 0) { // between 270deg and 360deg
      const [vNW1, vNW2] = getVerticesNW(n1, n2)
      if (Raycaster.determineIfThereAreObstaclesBetweenTwoPoints(vNW1 as RaycastablePoint, vNW2 as RaycastablePoint)) {
        return true
      }
      const [vSE1, vSE2] = getVerticesSE(n1, n2)
      if (Raycaster.determineIfThereAreObstaclesBetweenTwoPoints(vSE1 as RaycastablePoint, vSE2 as RaycastablePoint)) {
        return true
      }
      return false
    }
  }

  private static outsideOfScreenOffset = CONFIG.TILE_SIZE * 2
  private static rangeHorizontal: number = Canvas.halfWidth  + Raycaster.outsideOfScreenOffset
  private static rangeVertical: number   = Canvas.halfHeight + Raycaster.outsideOfScreenOffset * 2

  // TODO: This is a naive implementation! Add 6x optimization
  private static getInterceptPointSE(p: RaycastablePoint, theta: number, pEnd?: RaycastablePoint): { hitPoint: Point, wallHit: Wall } {
    // ########################################################################
    // Vertical Intercepts
    // ########################################################################
    let hitPointVertical: Point = null
    let wallHitVertical: Wall = null

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
      if ((tileStepX + p.deltas.dxRight > Raycaster.rangeHorizontal) || (yIntercept > Raycaster.rangeVertical)) {
        break
      }

      // Don't cast beyond pEnd
      if (pEnd) {
        if (tileStepX + p.deltas.dxRight > (pEnd.x - p.x) || yIntercept > (pEnd.y - p.y)) {
          break
        }
      }

      if (CONFIG.DEBUG.RAYCASTER) {
        let coordinates: Point
        if (pEnd) {
          coordinates = {
            x: Canvas.center.x - (pEnd.x - p.x) + p.deltas.dxRight + tileStepX,
            y: Canvas.center.y - (pEnd.y - p.y) + yIntercept,
          }
        } else {
          coordinates = {
            x: Canvas.center.x + p.deltas.dxRight + tileStepX,
            y: Canvas.center.y + yIntercept,
          }
        }
        context.strokeStyle = '#4444FF'
        context.beginPath()
        context.arc(coordinates.x, coordinates.y, 2, 0, (2 * Math.PI))
        context.stroke()
      }

      wallHitVertical = Raycaster.checkWallCollisionVerticalSE(i, p, yIntercept)

      if (wallHitVertical) {
        hitPointVertical = { x: tileStepX + p.deltas.dxRight, y: yIntercept }
        break
      }
      ++i
    }

    // ########################################################################
    // Horizontal Intercepts
    // ########################################################################
    let hitPointHorizontal: Point = null
    let wallHitHorizontal: Wall = null

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
      if ((tileStepY + p.deltas.dyBottom > Raycaster.rangeVertical) || (xIntercept > Raycaster.rangeHorizontal)) {
        break
      }

      // Don't cast beyond pEnd
      if (pEnd) {
        if (tileStepY + p.deltas.dyBottom > (pEnd.y - p.y) || Math.round(xIntercept) > (pEnd.x - p.x)) {
          break
        }
      }

      if (CONFIG.DEBUG.RAYCASTER) {
        let coordinates: Point
        if (pEnd) {
          coordinates = {
            x: Canvas.center.x - (pEnd.x - p.x) + xIntercept,
            y: Canvas.center.y - (pEnd.y - p.y) + p.deltas.dyBottom + tileStepY,
          }
        } else {
          coordinates = {
            x: Canvas.center.x + xIntercept,
            y: Canvas.center.y + p.deltas.dyBottom + tileStepY,
          }
        }
        context.strokeStyle = '#44FF44'
        context.beginPath()
        context.arc(coordinates.x, coordinates.y, 2, 0, (2 * Math.PI))
        context.stroke()
      }

      // Catch up with the horizontal intercept
      if (yIntercept < tileStepY) {
        break
      }

      wallHitHorizontal = Raycaster.checkWallCollisionHorizontalSE(j, p, xIntercept)

      if (wallHitHorizontal) {
        hitPointHorizontal = { x: xIntercept, y: tileStepY + p.deltas.dyBottom }
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
        wallHit : wallHitVertical
      }
    }
    else if (hitPointHorizontal && hitPointVertical === null) {
      return {
        hitPoint  : hitPointHorizontal,
        wallHit : wallHitHorizontal
      }
    }
    else if (hitPointHorizontal && hitPointVertical) {
      const verticalHitDistanceFromPlayer   = Math.sqrt(Math.pow(  hitPointVertical.x, 2) + Math.pow(  hitPointVertical.y, 2))
      const horizontalHitDistanceFromPlayer = Math.sqrt(Math.pow(hitPointHorizontal.x, 2) + Math.pow(hitPointHorizontal.y, 2))
      if (verticalHitDistanceFromPlayer > horizontalHitDistanceFromPlayer) {
        return {
          hitPoint  : hitPointHorizontal,
          wallHit : wallHitHorizontal
        }
      } else {
        return {
          hitPoint  : hitPointVertical,
          wallHit : wallHitVertical
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
          wallHit : wallHitHorizontal
        }
      } else {
        return {
          hitPoint  : hitPointVertical,
          wallHit : wallHitVertical
        }
      }
    }
  }

  // TODO: This is a naive implementation! Add 6x optimization
  private static getInterceptPointNE(p: RaycastablePoint, theta: number, pEnd?: RaycastablePoint): { hitPoint: Point, wallHit: Wall } {
    // ########################################################################
    // Vertical Intercepts
    // ########################################################################
    let hitPointVertical: Point = null
    let wallHitVertical: Wall = null

    let i = 0
    let yIntercept
    let tileStepX

    while (true) {
      tileStepX = i * CONFIG.TILE_SIZE
      if (theta === 0) {
        yIntercept = 0
      } else {
        yIntercept = (p.deltas.dxRight + tileStepX) * Math.tan(-theta)
      }

      // Outside of screen check
      if ((tileStepX + p.deltas.dxRight > Raycaster.rangeHorizontal) || (yIntercept > Raycaster.rangeVertical)) {
        break
      }

      // Don't cast beyond pEnd
      if (pEnd) {
        if (tileStepX + p.deltas.dxRight > (pEnd.x - p.x) || yIntercept > (p.y - pEnd.y)) {
          break
        }
      }

      if (CONFIG.DEBUG.RAYCASTER) {
        let coordinates: Point
        if (pEnd) {
          coordinates = {
            x: Canvas.center.x - (pEnd.x - p.x) + p.deltas.dxRight + tileStepX,
            y: Canvas.center.y - (pEnd.y - p.y) - yIntercept,
          }
        } else {
          coordinates = {
            x: Canvas.center.x + p.deltas.dxRight + tileStepX,
            y: Canvas.center.y - yIntercept,
          }
        }
        context.strokeStyle = '#4444FF'
        context.beginPath()
        context.arc(coordinates.x, coordinates.y, 2, 0, (2 * Math.PI))
        context.stroke()
      }

      wallHitVertical = Raycaster.checkWallCollisionVerticalNE(i, p, yIntercept)

      if (wallHitVertical) {
        hitPointVertical = { x: tileStepX + p.deltas.dxRight, y: -yIntercept }
        break
      }
      ++i
    }

    // ########################################################################
    // Horizontal Intercepts
    // ########################################################################
    let hitPointHorizontal: Point = null
    let wallHitHorizontal: Wall = null

    let j = 0
    let xIntercept
    let tileStepY

    while (true) {
      tileStepY = j * CONFIG.TILE_SIZE
      if (theta === 0) {
        break
      } else {
        xIntercept = (p.deltas.dyTop + tileStepY) / Math.tan(-theta)
      }

      // Outside of screen check
      if ((tileStepY + p.deltas.dyTop > Raycaster.rangeVertical) || (xIntercept > Raycaster.rangeHorizontal)) {
        break
      }

      // Don't cast beyond pEnd
      if (pEnd) {
        if (tileStepY + p.deltas.dyTop > (p.y - pEnd.y) || Math.round(xIntercept) > (pEnd.x - p.x)) {
          break
        }
      }

      if (CONFIG.DEBUG.RAYCASTER) {
        let coordinates: Point
        if (pEnd) {
          coordinates = {
            x: Canvas.center.x - (pEnd.x - p.x) + xIntercept,
            y: Canvas.center.y - (pEnd.y - p.y) - p.deltas.dyTop - tileStepY,
          }
        } else {
          coordinates = {
            x: Canvas.center.x + xIntercept,
            y: Canvas.center.y - tileStepY - p.deltas.dyTop,
          }
        }
        context.strokeStyle = '#44FF44'
        context.beginPath()
        context.arc(coordinates.x, coordinates.y, 2, 0, (2 * Math.PI))
        context.stroke()
      }

      // Catch up with the horizontal intercept
      if (yIntercept < tileStepY) {
        break
      }

      wallHitHorizontal = Raycaster.checkWallCollisionHorizontalNE(j, p, xIntercept)

      if (wallHitHorizontal) {
        hitPointHorizontal = { x: xIntercept, y: -tileStepY - p.deltas.dyTop }
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
        wallHit : wallHitVertical
      }
    }
    else if (hitPointHorizontal && hitPointVertical === null) {
      return {
        hitPoint  : hitPointHorizontal,
        wallHit : wallHitHorizontal
      }
    }
    else if (hitPointHorizontal && hitPointVertical) {
      const verticalHitDistanceFromPlayer   = Math.sqrt(Math.pow(  hitPointVertical.x, 2) + Math.pow(  hitPointVertical.y, 2))
      const horizontalHitDistanceFromPlayer = Math.sqrt(Math.pow(hitPointHorizontal.x, 2) + Math.pow(hitPointHorizontal.y, 2))
      if (verticalHitDistanceFromPlayer > horizontalHitDistanceFromPlayer) {
        return {
          hitPoint  : hitPointHorizontal,
          wallHit : wallHitHorizontal
        }
      } else {
        return {
          hitPoint  : hitPointVertical,
          wallHit : wallHitVertical
        }
      }
    }
    else if (hitPointHorizontal === null && hitPointVertical === null) {
      // If nothing is hit, just return the last closest point!
      const hitPointHorizontal = { x: xIntercept, y: -tileStepY - p.deltas.dyTop }
      const hitPointVertical   = { x: tileStepX + p.deltas.dxRight, y: -yIntercept }
      const verticalHitDistanceFromPlayer   = Math.sqrt(Math.pow(  hitPointVertical.x, 2) + Math.pow(  hitPointVertical.y, 2))
      const horizontalHitDistanceFromPlayer = Math.sqrt(Math.pow(hitPointHorizontal.x, 2) + Math.pow(hitPointHorizontal.y, 2))
      if (verticalHitDistanceFromPlayer > horizontalHitDistanceFromPlayer) {
        return {
          hitPoint  : hitPointHorizontal,
          wallHit : wallHitHorizontal
        }
      } else {
        return {
          hitPoint  : hitPointVertical,
          wallHit : wallHitVertical
        }
      }
    }
  }

  // TODO: This is a naive implementation! Add 6x optimization
  private static getInterceptPointNW(p: Point, theta: number, pEnd?: Point): { hitPoint: Point, wallHit: Wall } {
    // ########################################################################
    // Vertical Intercepts
    // ########################################################################
    let hitPointVertical: Point = null
    let wallHitVertical: Wall = null

    let i = 0
    let yIntercept
    let tileStepX

    while (true) {
      tileStepX = i * CONFIG.TILE_SIZE
      if (theta === 0) {
        yIntercept = 0
      } else {
        yIntercept = (p.deltas.dxLeft + tileStepX) * Math.tan(Math.PI - (-theta))
      }

      // Outside of screen check
      if ((tileStepX + p.deltas.dxLeft > Raycaster.rangeHorizontal) || (yIntercept > Raycaster.rangeVertical)) {
        break
      }

      // Don't cast beyond pEnd
      if (pEnd) {
        if (tileStepX + p.deltas.dxLeft > (p.x - pEnd.x) || yIntercept > (p.y - pEnd.y)) {
          break
        }
      }

      if (CONFIG.DEBUG.RAYCASTER) {
        let coordinates: Point
        if (pEnd) {
          coordinates = {
            x: Canvas.center.x - (pEnd.x - p.x) - p.deltas.dxLeft - tileStepX,
            y: Canvas.center.y - (pEnd.y - p.y) - yIntercept,
          }
        } else {
          coordinates = {
            x: Canvas.center.x - p.deltas.dxLeft - tileStepX,
            y: Canvas.center.y - yIntercept,
          }
        }
        context.strokeStyle = '#4444FF'
        context.beginPath()
        context.arc(coordinates.x, coordinates.y, 2, 0, (2 * Math.PI))
        context.stroke()
      }

      wallHitVertical = Raycaster.checkWallCollisionVerticalNW(i, p, yIntercept)

      if (wallHitVertical) {
        hitPointVertical = { x: - tileStepX - p.deltas.dxLeft, y: -yIntercept }
        break
      }
      ++i
    }

    // ########################################################################
    // Horizontal Intercepts
    // ########################################################################
    let hitPointHorizontal: Point = null
    let wallHitHorizontal: Wall = null

    let j = 0
    let xIntercept
    let tileStepY

    while (true) {
      tileStepY = j * CONFIG.TILE_SIZE
      if (theta === 0) {
        break
      } else {
        xIntercept = (p.deltas.dyTop + tileStepY) / Math.tan(Math.PI - (-theta))
      }

      // Outside of screen check
      if ((tileStepY + p.deltas.dyTop > Raycaster.rangeVertical) || (xIntercept > Raycaster.rangeHorizontal)) {
        break
      }

      // Don't cast beyond pEnd
      if (pEnd) {
        if (tileStepY + p.deltas.dyTop > (p.y - pEnd.y) || Math.round(xIntercept) > (p.x - pEnd.x)) {
          break
        }
      }

      if (CONFIG.DEBUG.RAYCASTER) {
        let coordinates: Point
        if (pEnd) {
          coordinates = {
            x: Canvas.center.x - (pEnd.x - p.x) - xIntercept,
            y: Canvas.center.y - (pEnd.y - p.y) - p.deltas.dyTop - tileStepY,
          }
        } else {
          coordinates = {
            x: Canvas.center.x - xIntercept,
            y: Canvas.center.y - p.deltas.dyTop - tileStepY,
          }
        }
        context.strokeStyle = '#44FF44'
        context.beginPath()
        context.arc(coordinates.x, coordinates.y, 2, 0, (2 * Math.PI))
        context.stroke()
      }

      // Catch up with the horizontal intercept
      if (yIntercept < tileStepY) {
        break
      }

      wallHitHorizontal = Raycaster.checkWallCollisionHorizontalNW(j, p, xIntercept)

      if (wallHitHorizontal) {
        hitPointHorizontal = { x: -xIntercept, y: -tileStepY - p.deltas.dyTop }
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
        wallHit : wallHitVertical
      }
    }
    else if (hitPointHorizontal && hitPointVertical === null) {
      return {
        hitPoint  : hitPointHorizontal,
        wallHit : wallHitHorizontal
      }
    }
    else if (hitPointHorizontal && hitPointVertical) {
      const verticalHitDistanceFromPlayer   = Math.sqrt(Math.pow(  hitPointVertical.x, 2) + Math.pow(  hitPointVertical.y, 2))
      const horizontalHitDistanceFromPlayer = Math.sqrt(Math.pow(hitPointHorizontal.x, 2) + Math.pow(hitPointHorizontal.y, 2))
      if (verticalHitDistanceFromPlayer > horizontalHitDistanceFromPlayer) {
        return {
          hitPoint  : hitPointHorizontal,
          wallHit : wallHitHorizontal
        }
      } else {
        return {
          hitPoint  : hitPointVertical,
          wallHit : wallHitVertical
        }
      }
    }
    else if (hitPointHorizontal === null && hitPointVertical === null) {
      // If nothing is hit, just return the last closest point!
      const hitPointHorizontal = { x: -xIntercept, y: -tileStepY - p.deltas.dyTop }
      const hitPointVertical   = { x: - tileStepX - p.deltas.dxLeft, y: -yIntercept }
      const verticalHitDistanceFromPlayer   = Math.sqrt(Math.pow(  hitPointVertical.x, 2) + Math.pow(  hitPointVertical.y, 2))
      const horizontalHitDistanceFromPlayer = Math.sqrt(Math.pow(hitPointHorizontal.x, 2) + Math.pow(hitPointHorizontal.y, 2))
      if (verticalHitDistanceFromPlayer > horizontalHitDistanceFromPlayer) {
        return {
          hitPoint  : hitPointHorizontal,
          wallHit : wallHitHorizontal
        }
      } else {
        return {
          hitPoint  : hitPointVertical,
          wallHit : wallHitVertical
        }
      }
    }
  }

  // TODO: This is a naive implementation! Add 6x optimization
  private static getInterceptPointSW(p: Point, theta: number, pEnd?: Point): { hitPoint: Point, wallHit: Wall } {
    // ########################################################################
    // Vertical Intercepts
    // ########################################################################
    let hitPointVertical: Point = null
    let wallHitVertical: Wall = null

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
      if ((tileStepX + p.deltas.dxLeft > Raycaster.rangeHorizontal) || (yIntercept > Raycaster.rangeVertical)) {
        break
      }

      // Don't cast beyond pEnd
      if (pEnd) {
        if (tileStepX + p.deltas.dxLeft > (p.x - pEnd.x) || yIntercept > (pEnd.y - p.y)) {
          break
        }
      }

      if (CONFIG.DEBUG.RAYCASTER) {
        let coordinates: Point
        if (pEnd) {
          coordinates = {
            x: Canvas.center.x - (pEnd.x - p.x) - p.deltas.dxLeft - tileStepX,
            y: Canvas.center.y - (pEnd.y - p.y) + yIntercept,
          }
        } else {
          coordinates = {
            x: Canvas.center.x - p.deltas.dxLeft - tileStepX,
            y: Canvas.center.y + yIntercept,
          }
        }
        context.strokeStyle = '#4444FF'
        context.beginPath()
        context.arc(coordinates.x, coordinates.y, 2, 0, (2 * Math.PI))
        context.stroke()
      }

      wallHitVertical = Raycaster.checkWallCollisionVerticalSW(i, p, yIntercept)

      if (wallHitVertical) {
        hitPointVertical = { x: -tileStepX - p.deltas.dxLeft, y: yIntercept }
        break
      }
      ++i
    }

    // ########################################################################
    // Horizontal Intercepts
    // ########################################################################
    let hitPointHorizontal: Point = null
    let wallHitHorizontal: Wall = null

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
      if ((tileStepY + p.deltas.dyBottom > Raycaster.rangeVertical) || (-xIntercept > Raycaster.rangeHorizontal)) {
        break
      }

      // Don't cast beyond pEnd
      if (pEnd) {
        if ((tileStepY + p.deltas.dyBottom > (pEnd.y - p.y)) || (-xIntercept > (p.x - pEnd.x))) {
          break
        }
      }

      if (CONFIG.DEBUG.RAYCASTER) {
        let coordinates: Point
        if (pEnd) {
          coordinates = {
            x: Canvas.center.x - (pEnd.x - p.x) + xIntercept,
            y: Canvas.center.y - (pEnd.y - p.y) + p.deltas.dyBottom + tileStepY,
          }
        } else {
          coordinates = {
            x: Canvas.center.x + xIntercept,
            y: Canvas.center.y + p.deltas.dyBottom + tileStepY,
          }
        }
        context.strokeStyle = '#44FF44'
        context.beginPath()
        context.arc(coordinates.x, coordinates.y, 2, 0, (2 * Math.PI))
        context.stroke()
      }

      // Catch up with the horizontal intercept
      if (yIntercept < tileStepY) {
        break
      }

      wallHitHorizontal = Raycaster.checkWallCollisionHorizontalSW(j, p, xIntercept)

      if (wallHitHorizontal) {
        hitPointHorizontal = { x: xIntercept, y: tileStepY + p.deltas.dyBottom }
        break
      }
      ++j
    }

    // ########################################################################
    // Return the closer hit point & hit wall
    // ########################################################################

    if (hitPointVertical && hitPointHorizontal === null) {
      return {
        hitPoint : hitPointVertical,
        wallHit  : wallHitVertical
      }
    }
    else if (hitPointHorizontal && hitPointVertical === null) {
      return {
        hitPoint : hitPointHorizontal,
        wallHit  : wallHitHorizontal
      }
    }
    else if (hitPointHorizontal && hitPointVertical) {
      const verticalHitDistanceFromPlayer   = Math.sqrt(Math.pow(  hitPointVertical.x, 2) + Math.pow(  hitPointVertical.y, 2))
      const horizontalHitDistanceFromPlayer = Math.sqrt(Math.pow(hitPointHorizontal.x, 2) + Math.pow(hitPointHorizontal.y, 2))
      if (verticalHitDistanceFromPlayer > horizontalHitDistanceFromPlayer) {
        return {
          hitPoint : hitPointHorizontal,
          wallHit  : wallHitHorizontal
        }
      } else {
        return {
          hitPoint : hitPointVertical,
          wallHit  : wallHitVertical
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
          wallHit : wallHitHorizontal
        }
      } else {
        return {
          hitPoint  : hitPointVertical,
          wallHit : wallHitVertical
        }
      }
    }
  }

  private static checkWallCollisionVerticalSE(i: number, p: Point, yIntercept: number): Wall {
    const xTile = 1 + p.col + i
    const yTile = p.row + Math.floor((p.deltas.dyTop + yIntercept) / CONFIG.TILE_SIZE)
    const yTile_aboveByOnePixel = p.row + Math.floor((p.deltas.dyTop + yIntercept - 1) / CONFIG.TILE_SIZE)

    let wallHit = null
    if (Map.walls[yTile]) {
      if (Map.walls[yTile][xTile]) {
        wallHit = Map.walls[yTile][xTile]
      }
      else if (Map.walls[yTile_aboveByOnePixel][xTile]) {
        wallHit = Map.walls[yTile_aboveByOnePixel][xTile]
      }
    }

    if (CONFIG.DEBUG.RAYCASTER) {
      context.fillText(`col: ${xTile}, row: ${yTile}, hit: ${wallHit ? [wallHit.row, wallHit.col] : null}`, 10, 112 + i * 12)
    }

    return wallHit
  }
  private static checkWallCollisionHorizontalSE(i: number, p: Point, xIntercept: number): Wall {
    const xTile = p.col + Math.floor((p.deltas.dxLeft + xIntercept) / CONFIG.TILE_SIZE)
    const yTile = p.row + i + 1

    let wallHit = null
    if (Map.walls[yTile] && Map.walls[yTile][xTile]) {
      wallHit = Map.walls[yTile][xTile]
    }

    if (CONFIG.DEBUG.RAYCASTER) {
      context.fillText(`col: ${xTile}, row: ${yTile}, hit: ${wallHit ? [wallHit.row, wallHit.col] : null}`, 10, 212 + i * 12)
    }

    return wallHit
  }

  private static checkWallCollisionVerticalNE(i: number, p: Point, yIntercept: number): Wall {
    const xTile = 1 + p.col + i
    const yTile = p.row + Math.floor((p.deltas.dyTop - yIntercept) / CONFIG.TILE_SIZE)

    let wallHit = null
    if (Map.walls[yTile] && Map.walls[yTile][xTile]) {
      wallHit = Map.walls[yTile][xTile]
    }

    if (CONFIG.DEBUG.RAYCASTER) {
      context.fillText(`col: ${xTile}, row: ${yTile}, hit: ${wallHit ? [wallHit.row, wallHit.col] : null}`, 10, 112 + i * 12)
    }

    return wallHit
  }
  private static checkWallCollisionHorizontalNE(i: number, p: Point, xIntercept: number): Wall {
    const xTile = p.col + Math.floor((p.deltas.dxLeft + xIntercept) / CONFIG.TILE_SIZE)
    const xTile_leftByOnePixel = p.col + Math.floor((p.deltas.dxLeft + xIntercept - 1) / CONFIG.TILE_SIZE)
    const yTile = p.row - i - 1

    let wallHit = null
    if (Map.walls[yTile]) {
      if (Map.walls[yTile][xTile]) {
        wallHit = Map.walls[yTile][xTile]
      }
      else if (Map.walls[yTile][xTile_leftByOnePixel]) {
        wallHit = Map.walls[yTile][xTile_leftByOnePixel]
      }
    }

    if (CONFIG.DEBUG.RAYCASTER) {
      context.fillText(`col: ${xTile}, row: ${yTile}, hit: ${wallHit ? [wallHit.row, wallHit.col] : null}`, 10, 212 + i * 12)
    }

    return wallHit
  }

  private static checkWallCollisionVerticalNW(i: number, p: Point, yIntercept: number): Wall {
    const xTile = - 1 + p.col - i
    const yTile = p.row + Math.floor((p.deltas.dyTop - yIntercept) / CONFIG.TILE_SIZE)

    let wallHit = null
    if (Map.walls[yTile] && Map.walls[yTile][xTile]) {
      wallHit = Map.walls[yTile][xTile]
    }

    if (CONFIG.DEBUG.RAYCASTER) {
      context.fillText(`col: ${xTile}, row: ${yTile}, hit: ${wallHit ? [wallHit.row, wallHit.col] : null}`, 10, 112 + i * 12)
    }

    return wallHit
  }
  private static checkWallCollisionHorizontalNW(i: number, p: Point, xIntercept: number): Wall {
    const xTile = p.col - Math.floor((p.deltas.dxRight + xIntercept) / CONFIG.TILE_SIZE)
    const yTile = p.row - i - 1

    let wallHit = null
    if (Map.walls[yTile] && Map.walls[yTile][xTile]) {
      wallHit = Map.walls[yTile][xTile]
    }

    if (CONFIG.DEBUG.RAYCASTER) {
      context.fillText(`col: ${xTile}, row: ${yTile}, hit: ${wallHit ? [wallHit.row, wallHit.col] : null}`, 10, 212 + i * 12)
    }

    return wallHit
  }

  private static checkWallCollisionVerticalSW(i: number, p: Point, yIntercept: number): Wall {
    const xTile = p.col - i - 1
    const yTile = p.row + Math.floor((p.deltas.dyTop + yIntercept) / CONFIG.TILE_SIZE)
    const yTile_aboveByOnePixel = p.row + Math.floor((p.deltas.dyTop + yIntercept - 1) / CONFIG.TILE_SIZE)

    let wallHit = null
    if (Map.walls[yTile]) {
      if (Map.walls[yTile][xTile]) {
        wallHit = Map.walls[yTile][xTile]
      }
      else if (Map.walls[yTile_aboveByOnePixel][xTile]) {
        wallHit = Map.walls[yTile_aboveByOnePixel][xTile]
      }
    }

    if (CONFIG.DEBUG.RAYCASTER) {
      context.fillText(`col: ${xTile}, row: ${yTile}, hit: ${wallHit ? [wallHit.row, wallHit.col] : null}`, 10, 112 + i * 12)
    }

    return wallHit
  }
  private static checkWallCollisionHorizontalSW(i: number, p: Point, xIntercept: number): Wall {
    const xTile = p.col - Math.floor((p.deltas.dxRight - xIntercept) / CONFIG.TILE_SIZE)
    const yTile = p.row + i + 1

    let wallHit = null
    if (Map.walls[yTile] && Map.walls[yTile][xTile]) {
      wallHit = Map.walls[yTile][xTile]
    }

    if (CONFIG.DEBUG.RAYCASTER) {
      context.fillText(`col: ${xTile}, row: ${yTile}, hit: ${wallHit ? [wallHit.row, wallHit.col] : null}`, 10, 212 + i * 12)
    }

    return wallHit
  }
}

const blankVertex: Point = {
  x: 0,
  y: 0,
  deltas: {
    dyTop    : 0,
    dyBottom : 0,
    dxLeft   : 0,
    dxRight  : 0,
  },
}
const vertexNW1: Point = { ...blankVertex, deltas: { ...blankVertex.deltas } }
const vertexNW2: Point = { ...blankVertex, deltas: { ...blankVertex.deltas } }
const vertexNE1: Point = { ...blankVertex, deltas: { ...blankVertex.deltas } }
const vertexNE2: Point = { ...blankVertex, deltas: { ...blankVertex.deltas } }
const vertexSW1: Point = { ...blankVertex, deltas: { ...blankVertex.deltas } }
const vertexSW2: Point = { ...blankVertex, deltas: { ...blankVertex.deltas } }
const vertexSE1: Point = { ...blankVertex, deltas: { ...blankVertex.deltas } }
const vertexSE2: Point = { ...blankVertex, deltas: { ...blankVertex.deltas } }

function getVerticesNW(n1: PathNode | Enemy, n2: PathNode | Player): [ Point, Point ] {
  vertexNW1.x = n1.x - n1.collisionBox.halfWidth
  vertexNW1.y = n1.y - n1.collisionBox.halfHeight
  vertexNW1.row = Math.floor(vertexNW1.y / CONFIG.TILE_SIZE)
  vertexNW1.col = Math.floor(vertexNW1.x / CONFIG.TILE_SIZE)
  vertexNW1.deltas.dyTop = vertexNW1.y % CONFIG.TILE_SIZE
  vertexNW1.deltas.dyBottom = CONFIG.TILE_SIZE - vertexNW1.deltas.dyTop
  vertexNW1.deltas.dxLeft = vertexNW1.x % CONFIG.TILE_SIZE
  vertexNW1.deltas.dxRight = CONFIG.TILE_SIZE - vertexNW1.deltas.dxLeft

  vertexNW2.x = n2.x - n2.collisionBox.halfWidth
  vertexNW2.y = n2.y - n2.collisionBox.halfHeight
  vertexNW2.row = Math.floor(vertexNW2.y / CONFIG.TILE_SIZE)
  vertexNW2.col = Math.floor(vertexNW2.x / CONFIG.TILE_SIZE)
  vertexNW2.deltas.dyTop = vertexNW2.y % CONFIG.TILE_SIZE
  vertexNW2.deltas.dyBottom = CONFIG.TILE_SIZE - vertexNW2.deltas.dyTop
  vertexNW2.deltas.dxLeft = vertexNW2.x % CONFIG.TILE_SIZE
  vertexNW2.deltas.dxRight = CONFIG.TILE_SIZE - vertexNW2.deltas.dxLeft

  return [ vertexNW1, vertexNW2 ]
}

function getVerticesNE(n1: PathNode | Enemy, n2: PathNode | Player): [ Point, Point ] {
  vertexNE1.x = n1.x + n1.collisionBox.halfWidth
  vertexNE1.y = n1.y - n1.collisionBox.halfHeight
  vertexNE1.row = Math.floor(vertexNE1.y / CONFIG.TILE_SIZE)
  vertexNE1.col = Math.floor(vertexNE1.x / CONFIG.TILE_SIZE)
  vertexNE1.deltas.dyTop = vertexNE1.y % CONFIG.TILE_SIZE
  vertexNE1.deltas.dyBottom = CONFIG.TILE_SIZE - vertexNE1.deltas.dyTop
  vertexNE1.deltas.dxLeft = vertexNE1.x % CONFIG.TILE_SIZE
  vertexNE1.deltas.dxRight = CONFIG.TILE_SIZE - vertexNE1.deltas.dxLeft

  vertexNE2.x = n2.x + n2.collisionBox.halfWidth
  vertexNE2.y = n2.y - n2.collisionBox.halfHeight
  vertexNE2.row = Math.floor(vertexNE2.y / CONFIG.TILE_SIZE)
  vertexNE2.col = Math.floor(vertexNE2.x / CONFIG.TILE_SIZE)
  vertexNE2.deltas.dyTop = vertexNE2.y % CONFIG.TILE_SIZE
  vertexNE2.deltas.dyBottom = CONFIG.TILE_SIZE - vertexNE2.deltas.dyTop
  vertexNE2.deltas.dxLeft = vertexNE2.x % CONFIG.TILE_SIZE
  vertexNE2.deltas.dxRight = CONFIG.TILE_SIZE - vertexNE2.deltas.dxLeft

  return [ vertexNE1, vertexNE2 ]
}

function getVerticesSW(n1: PathNode | Enemy, n2: PathNode | Player): [ Point, Point ] {
  vertexSW1.x = n1.x - n1.collisionBox.halfWidth
  vertexSW1.y = n1.y + n1.collisionBox.halfHeight
  vertexSW1.row = Math.floor(vertexSW1.y / CONFIG.TILE_SIZE)
  vertexSW1.col = Math.floor(vertexSW1.x / CONFIG.TILE_SIZE)
  vertexSW1.deltas.dyTop = vertexSW1.y % CONFIG.TILE_SIZE
  vertexSW1.deltas.dyBottom = CONFIG.TILE_SIZE - vertexSW1.deltas.dyTop
  vertexSW1.deltas.dxLeft = vertexSW1.x % CONFIG.TILE_SIZE
  vertexSW1.deltas.dxRight = CONFIG.TILE_SIZE - vertexSW1.deltas.dxLeft

  vertexSW2.x = n2.x - n2.collisionBox.halfWidth
  vertexSW2.y = n2.y + n2.collisionBox.halfHeight
  vertexSW2.row = Math.floor(vertexSW2.y / CONFIG.TILE_SIZE)
  vertexSW2.col = Math.floor(vertexSW2.x / CONFIG.TILE_SIZE)
  vertexSW2.deltas.dyTop = vertexSW2.y % CONFIG.TILE_SIZE
  vertexSW2.deltas.dyBottom = CONFIG.TILE_SIZE - vertexSW2.deltas.dyTop
  vertexSW2.deltas.dxLeft = vertexSW2.x % CONFIG.TILE_SIZE
  vertexSW2.deltas.dxRight = CONFIG.TILE_SIZE - vertexSW2.deltas.dxLeft

  return [ vertexSW1, vertexSW2 ]
}

function getVerticesSE(n1: PathNode | Enemy, n2: PathNode | Player): [ Point, Point ] {
  vertexSE1.x = n1.x + n1.collisionBox.halfWidth
  vertexSE1.y = n1.y + n1.collisionBox.halfHeight
  vertexSE1.row = Math.floor(vertexSE1.y / CONFIG.TILE_SIZE)
  vertexSE1.col = Math.floor(vertexSE1.x / CONFIG.TILE_SIZE)
  vertexSE1.deltas.dyTop = vertexSE1.y % CONFIG.TILE_SIZE
  vertexSE1.deltas.dyBottom = CONFIG.TILE_SIZE - vertexSE1.deltas.dyTop
  vertexSE1.deltas.dxLeft = vertexSE1.x % CONFIG.TILE_SIZE
  vertexSW1.deltas.dxRight = CONFIG.TILE_SIZE - vertexSE1.deltas.dxLeft

  vertexSE2.x = n2.x + n2.collisionBox.halfWidth
  vertexSE2.y = n2.y + n2.collisionBox.halfHeight
  vertexSE2.row = Math.floor(vertexSE2.y / CONFIG.TILE_SIZE)
  vertexSE2.col = Math.floor(vertexSE2.x / CONFIG.TILE_SIZE)
  vertexSE2.deltas.dyTop = vertexSE2.y % CONFIG.TILE_SIZE
  vertexSE2.deltas.dyBottom = CONFIG.TILE_SIZE - vertexSE2.deltas.dyTop
  vertexSE2.deltas.dxLeft = vertexSE2.x % CONFIG.TILE_SIZE
  vertexSW2.deltas.dxRight = CONFIG.TILE_SIZE - vertexSE2.deltas.dxLeft

  return [ vertexSE1, vertexSE2 ]
}
