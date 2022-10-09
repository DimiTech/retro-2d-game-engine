import { totalNumberOfMaps } from '@app/domain/map/Maps'

export default class Level {
    public static lastLevel = totalNumberOfMaps

    public static currentLevel = 1 // Start with Level 1

    public static nextLevel() {
        Level.currentLevel++
    }

    public static isLastLevel() {
        return (Level.currentLevel === Level.lastLevel)
    }

}
