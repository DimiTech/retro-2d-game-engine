enum MapKeys {
  Empty      = 0,
  WallGray   = 1,
  WallGreen  = 2,
  WallBlue   = 3,
  ExitPortal = 9,
}

export function isWall(mapKey: MapKeys) {
  return (
    mapKey ===  MapKeys.WallGray  ||
    mapKey ===  MapKeys.WallGreen ||
    mapKey ===  MapKeys.WallBlue
  )
}

export default MapKeys
