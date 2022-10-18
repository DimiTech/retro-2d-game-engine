import * as CONFIG from '@app/configuration/config.json'

import Point, { pointToPointDistance } from '@app/infrastructure/geometry/Point'
import CollisionBox from '@app/infrastructure/CollisionBox'
import Canvas, { context } from '@app/infrastructure/Canvas'

import Map from '@app/domain/map/Map'
import Player from '@app/domain/player/Player'
import Enemy from '@app/domain/enemies/Enemy'
import RaycastablePoint from './geometry/RaycastablePoint'

export function generatePathNodes(startRow: number, startCol: number, cBox: CollisionBox): PathNode[] {
  const path: PathNode[] = []

  const rowOffset = 3
  const colOffset = 2
  let rowStart = startRow - Canvas.halfRows - rowOffset
  let colStart = startCol - Canvas.halfCols - colOffset
  const rowEnd = startRow + Canvas.halfRows + rowOffset
  const colEnd = startCol + Canvas.halfCols + colOffset

  if (rowStart < 0) { rowStart = 0 }
  if (colStart < 0) { colStart = 0 }

  for (let row = rowStart; row < rowEnd; ++row) {
    for (let col = colStart - 1; col < colEnd; ++col) {
      if (!Map.walls[row] || !Map.walls[row][col]) {
        if (col > 0 && row > 0) {
          path.push(new PathNode({
            x: col * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2,
            y: row * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2,
          }, cBox))
        }
      }
    }
  }

  return path
}

export function debug_drawPathNodes(path: PathNode[], player: Player, color: string): void {
  if (path) {
    path.forEach(node => drawNode(node, player, color))
  }
}

export function drawNode(node: PathNode, player: Player, color: string): void {
  context.strokeStyle = color
  context.lineWidth = 0.1
  context.beginPath()
    // Since this is just for debugging purposes, there is no need to
    // optimize/cache the vertex calculations.
    context.moveTo( 0.5 + Canvas.center.x + (node.x - player.x) - node.collisionBox.halfWidth,  0.5 + Canvas.center.y + (node.y - player.y) - node.collisionBox.halfHeight)
    context.lineTo(-0.5 + Canvas.center.x + (node.x - player.x) + node.collisionBox.halfWidth,  0.5 + Canvas.center.y + (node.y - player.y) - node.collisionBox.halfHeight)
    context.lineTo(-0.5 + Canvas.center.x + (node.x - player.x) + node.collisionBox.halfWidth, -0.5 + Canvas.center.y + (node.y - player.y) + node.collisionBox.halfHeight)
    context.lineTo( 0.5 + Canvas.center.x + (node.x - player.x) - node.collisionBox.halfWidth, -0.5 + Canvas.center.y + (node.y - player.y) + node.collisionBox.halfHeight)
    context.lineTo( 0.5 + Canvas.center.x + (node.x - player.x) - node.collisionBox.halfWidth,  0.5 + Canvas.center.y + (node.y - player.y) - node.collisionBox.halfHeight)
  context.stroke()

  context.beginPath()
    context.arc(
      Canvas.center.x + (node.x - player.x),
      Canvas.center.y + (node.y - player.y),
      1,
      0,
      (2 * Math.PI)
    )
  context.stroke()
}

export function findShortestPath(enemy: Enemy, player: Player, pathfindingNodes: PathNode[]): PathNode[] {
  const nodeGoal  = new PathNode(player, player.collisionBox)
  const nodeStart = new PathNode(enemy,  enemy.collisionBox)

  pathfindingNodes.push(nodeGoal)

  nodeStart.f = 0
  nodeStart.g = nodeStart.heuristic(nodeGoal)

  const nodesNotTested: PathNode[] = [ nodeStart ]

  let nodeCurrent: PathNode

  while (nodesNotTested.length > 0 || nodeCurrent === nodeGoal) {
    nodesNotTested.sort((a: PathNode, b: PathNode) => a.g - b.g)

    while (nodesNotTested.length > 0 && nodesNotTested[0].visited === true) {
      nodesNotTested.shift()
    }

    if (nodesNotTested.length <= 0) {
      break
    }

    nodeCurrent = nodesNotTested.shift()
    nodeCurrent.visited = true

    // Get neighbour nodes.
    nodeCurrent.neighbourNodes = [ ...pathfindingNodes ]
      .filter(node => {
        return (
          (node.col === nodeCurrent.col     && node.row === nodeCurrent.row    ) || // Center
          (node.col === nodeCurrent.col     && node.row === nodeCurrent.row - 1) || // N
          (node.col === nodeCurrent.col + 1 && node.row === nodeCurrent.row    ) || // E
          (node.col === nodeCurrent.col     && node.row === nodeCurrent.row + 1) || // S
          (node.col === nodeCurrent.col - 1 && node.row === nodeCurrent.row    ) || // W
          (
            node.col === nodeCurrent.col - 1 && node.row === nodeCurrent.row - 1
            && (
              !Map.walls[node.row    ] || Map.walls[node.row    ][node.col + 1] === null ||
              !Map.walls[node.row + 1] || Map.walls[node.row + 1][node.col    ] === null
            )
          ) || // NW
          (
            node.col === nodeCurrent.col + 1 && node.row === nodeCurrent.row - 1
            && (
              !Map.walls[node.row    ] || Map.walls[node.row    ][node.col - 1] === null ||
              !Map.walls[node.row + 1] || Map.walls[node.row + 1][node.col    ] === null
            )
          ) || // NE
          (
            node.col === nodeCurrent.col + 1 && node.row === nodeCurrent.row + 1
            && (
              !Map.walls[node.row    ] || Map.walls[node.row    ][node.col - 1] === null ||
              !Map.walls[node.row - 1] || Map.walls[node.row - 1][node.col    ] === null
            )
          ) || // SE
          (
            node.col === nodeCurrent.col - 1 && node.row === nodeCurrent.row + 1
            && (
              !Map.walls[node.row    ] || Map.walls[node.row    ][node.col + 1] === null ||
              !Map.walls[node.row - 1] || Map.walls[node.row - 1][node.col    ] === null
            )
          ) // SW
        )
      })

    nodeCurrent.neighbourNodes
      .map(node => {
        if (node.visited === false) {
          nodesNotTested.push(node)
        }

        // Calculate local goal
        const possiblyLowerLocalGoal = nodeCurrent.f + pointToPointDistance(nodeCurrent, node)

        if (possiblyLowerLocalGoal < node.f) {
          node.parent = nodeCurrent
          node.f = possiblyLowerLocalGoal
          node.g = node.f + node.heuristic(nodeGoal)
        }

        return node
      })
  }

  const path = []
  if (nodeGoal.parent) {
    let n: PathNode = nodeGoal
    while (n.parent) {
      path.push(n)
      n = n.parent
    }
  }
  return path
}

export class PathNode implements RaycastablePoint {
  public x: number
  public y: number
  public row: number
  public col: number
  public deltas = {
    dyTop    : 0,
    dyBottom : 0,
    dxLeft   : 0,
    dxRight  : 0,
  }
  public collisionBox: CollisionBox

  public visited = false
  public g = Infinity // Global goal
  public f = Infinity // Local goal
  public parent: PathNode = null
  public neighbourNodes: PathNode[]

  constructor(coordinates: Point, cBox: CollisionBox) {
    this.x = coordinates.x
    this.y = coordinates.y
    this.collisionBox = new CollisionBox(cBox.width, cBox.height)
    this.updateTileDeltas()
    this.updateMapPosition()
  }

  public heuristic(nodeGoal: PathNode): number {
    return pointToPointDistance(this, nodeGoal)
  }

  // TODO: Compose this functionality since it's shared between enemies and player
  private updateTileDeltas(): void {
    this.deltas.dyTop = this.y % CONFIG.TILE_SIZE
    this.deltas.dyBottom = CONFIG.TILE_SIZE - this.deltas.dyTop
    this.deltas.dxLeft = this.x % CONFIG.TILE_SIZE
    this.deltas.dxRight = CONFIG.TILE_SIZE - this.deltas.dxLeft
  }

  // TODO: Not DRY... generalize this functionality
  private updateMapPosition(): void {
    this.row = Math.floor(this.y / CONFIG.TILE_SIZE)
    this.col = Math.floor(this.x / CONFIG.TILE_SIZE)
  }
}
