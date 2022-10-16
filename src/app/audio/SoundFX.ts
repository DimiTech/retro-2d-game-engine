import Mixer from './Mixer'
import context from './AudioContext'
import { load } from './AudioBufferLoader'

export default class SoundFX {
  private static PLAYER_DEATH: AudioBuffer[] = []

  private static SMG: AudioBuffer[] = []
  private static SMG_INDEX = 0

  private static CRATE_HIT: AudioBuffer[] = []

  private static PLAYER_HIT: AudioBuffer[] = []
  private static PLAYER_HIT_INDEX = 0
  private static PLAYER_HIT_READY: boolean = true

  private static ENEMY_ATTACK: AudioBuffer[] = []

  private static ENEMY_HIT: AudioBuffer[] = []
  private static ENEMY_HIT_READY: boolean = true

  private static ENEMY_DEATH: AudioBuffer[] = []

  public static async load(setLoadedPercentage: (percentage: number) => void): Promise<void> {
    const soundFxFilePromises = [
      load('./audio/player_death_1.wav'),

      load('./audio/smg_1.wav'),
      load('./audio/smg_2.wav'),
      load('./audio/smg_3.wav'),
      load('./audio/smg_4.wav'),
      load('./audio/smg_5.wav'),

      load('./audio/crate_hit_1.wav'),

      load('./audio/player_hit_1.mp3'),
      load('./audio/player_hit_2.mp3'),
      load('./audio/player_hit_3.mp3'),
      load('./audio/player_hit_4.mp3'),
      load('./audio/player_hit_5.mp3'),

      load('./audio/enemy_attack_1.wav'),
      load('./audio/enemy_attack_2.wav'),

      load('./audio/enemy_hit_1.wav'),
      load('./audio/enemy_hit_2.wav'),
      load('./audio/enemy_hit_3.wav'),

      load('./audio/enemy_death_1.wav'),
      load('./audio/enemy_death_2.wav'),
      load('./audio/enemy_death_3.wav'),
    ]

    // TODO: Show percentage
    const soundFxFiles = await Promise.all(soundFxFilePromises)

    this.PLAYER_DEATH[0] = soundFxFiles[0]

    this.SMG[0] = soundFxFiles[1]
    this.SMG[1] = soundFxFiles[2]
    this.SMG[2] = soundFxFiles[3]
    this.SMG[3] = soundFxFiles[4]
    this.SMG[4] = soundFxFiles[5]

    this.CRATE_HIT[0] = soundFxFiles[6]

    this.PLAYER_HIT[0] = soundFxFiles[7]
    this.PLAYER_HIT[1] = soundFxFiles[8]
    this.PLAYER_HIT[2] = soundFxFiles[9]
    this.PLAYER_HIT[3] = soundFxFiles[10]
    this.PLAYER_HIT[4] = soundFxFiles[11]

    setLoadedPercentage(0.5)

    this.ENEMY_ATTACK[0] = soundFxFiles[12]
    this.ENEMY_ATTACK[1] = soundFxFiles[13]

    this.ENEMY_HIT[0] = soundFxFiles[14]
    this.ENEMY_HIT[1] = soundFxFiles[15]
    this.ENEMY_HIT[2] = soundFxFiles[16]

    this.ENEMY_DEATH[0] = soundFxFiles[17]
    this.ENEMY_DEATH[1] = soundFxFiles[18]
    this.ENEMY_DEATH[2] = soundFxFiles[19]

    setLoadedPercentage(1.0)
  }

  public static playPlayerDeath(): void {
    const playSound = context.createBufferSource()
    playSound.buffer = this.PLAYER_DEATH[0]

    const gainNode = context.createGain()
    gainNode.gain.value = Mixer.soundFxVolume
    playSound.connect(gainNode)

    gainNode.connect(context.destination)

    playSound.start()
  }

  public static playSMG(): void {
    const playSound = context.createBufferSource()
    playSound.buffer = this.SMG[this.SMG_INDEX]

    const gainNode = context.createGain()
    gainNode.gain.value = Mixer.soundFxVolume * 0.2
    playSound.connect(gainNode)

    gainNode.connect(context.destination)

    playSound.start()
    this.SMG_INDEX = ++this.SMG_INDEX % this.SMG.length // Shuffle the SMG FX
  }

  public static playPlayerHit(): void {
    if (this.PLAYER_HIT_READY === false) {
      return
    }
    const playSound = context.createBufferSource()
    playSound.buffer = this.PLAYER_HIT[this.PLAYER_HIT_INDEX]

    const gainNode = context.createGain()
    gainNode.gain.value = Mixer.soundFxVolume
    playSound.connect(gainNode)

    gainNode.connect(context.destination)

    playSound.start()
    this.PLAYER_HIT_INDEX = ++this.PLAYER_HIT_INDEX % this.PLAYER_HIT.length // Shuffle

    this.PLAYER_HIT_READY = false
    setTimeout(() => { this.PLAYER_HIT_READY = true }, 500)
  }

  public static playEnemyAttack(): void {
    const playSound = context.createBufferSource()

    const randomIndex = Math.floor(Math.random() * this.ENEMY_ATTACK.length)
    playSound.buffer = this.ENEMY_ATTACK[randomIndex]

    const gainNode = context.createGain()
    gainNode.gain.value = Mixer.soundFxVolume
    playSound.connect(gainNode)

    gainNode.connect(context.destination)

    playSound.start()
  }

  public static playEnemyHit(): void {
    if (this.ENEMY_HIT_READY === false) {
      return
    }
    const playSound = context.createBufferSource()
    const randomIndex = Math.floor(Math.random() * this.ENEMY_HIT.length)
    playSound.buffer = this.ENEMY_HIT[randomIndex]

    const gainNode = context.createGain()
    gainNode.gain.value = Mixer.soundFxVolume
    playSound.connect(gainNode)

    gainNode.connect(context.destination)

    playSound.start()

    this.ENEMY_HIT_READY = false
    setTimeout(() => { this.ENEMY_HIT_READY = true }, 200)
  }

  public static playEnemyDeath(): void {
    const playSound = context.createBufferSource()

    const randomIndex = Math.floor(Math.random() * this.ENEMY_DEATH.length)
    playSound.buffer = this.ENEMY_DEATH[randomIndex]

    const gainNode = context.createGain()
    gainNode.gain.value = Mixer.soundFxVolume
    playSound.connect(gainNode)

    gainNode.connect(context.destination)

    playSound.start()
  }

  public static playWallHit(): void {
    const playSound = context.createBufferSource()
    playSound.buffer = this.CRATE_HIT[0]

    const gainNode = context.createGain()
    gainNode.gain.value = Mixer.soundFxVolume
    playSound.connect(gainNode)

    gainNode.connect(context.destination)

    playSound.start()
  }
}
