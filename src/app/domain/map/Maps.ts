import IMap from './IMap'

import * as Map01 from '@app/resources/maps/Map-01.json'
import * as Map02 from '@app/resources/maps/Map-02.json'

const Maps: { [key: string]: IMap } = {
  Map01,
  Map02,
}

export const totalNumberOfMaps = Object.keys(Maps).length

export default function getMapData(levelNumber: number): IMap {
  const zeroPaddedLevelNumber = String(levelNumber).padStart(2, '0')
  return Maps[`Map${zeroPaddedLevelNumber}`]
}