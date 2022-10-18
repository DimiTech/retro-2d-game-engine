import { radiansToDegrees } from '@app/infrastructure/math/MathUtils'

export enum Directions {
  N  = 'N',
  NE = 'NE',
  E  = 'E',
  SE = 'SE',
  S  = 'S',
  SW = 'SW',
  W  = 'W',
  NW = 'NW',
}

export enum MovingDirections {
  up    = 'up',
  right = 'right',
  down  = 'down',
  left  = 'left',
}

const directionsAngleRangesLUT: { [key in Directions]: { min: number, max: number }} = {
  [Directions.E ]: { min: 337, max: 22,  }, // min & max are degrees
  [Directions.SE]: { min: 22,  max: 67,  },
  [Directions.S ]: { min: 67,  max: 112, },
  [Directions.SW]: { min: 112, max: 157, },
  [Directions.W ]: { min: 157, max: 202, },
  [Directions.NW]: { min: 202, max: 247, },
  [Directions.N ]: { min: 247, max: 292, },
  [Directions.NE]: { min: 292, max: 337, },
}

/*
 * Angles:
 *            N
 *            |
 *           270
 *   W - 180     0 - E
 *           90
 *            |
 *            S
*/
export function getDirectionBasedOnAngle(theta: number): Directions {
  if (theta < 0) {
    theta = 2 * Math.PI - Math.abs(theta)
  }
  theta = radiansToDegrees(theta)

  if (
    theta >= 0 && theta < directionsAngleRangesLUT[Directions.E].max ||
    theta >= directionsAngleRangesLUT[Directions.E].min && theta < 360 // deg
  ) {
    return Directions.E
  }

  const [ direction ] = Object.entries(directionsAngleRangesLUT).find(([, angleRange]) => {
    return (theta >= angleRange.min && theta < angleRange.max)
  })
  return Directions[direction as Directions]
}
