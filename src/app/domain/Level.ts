import { totalNumberOfMaps } from '@app/domain/map/Maps'

export default class Level {
    public static lastLevel = totalNumberOfMaps

    public static readonly startingLevel = 1

    public static currentLevel = Level.startingLevel

    public static nextLevel() {
        Level.currentLevel++
    }

    public static isLastLevel() {
        return (Level.currentLevel === Level.lastLevel)
    }
}
