type KeyboardEventListener = ((e: KeyboardEvent) => void)

export default class Keyboard {
  public static addListenerKeydown(listener: KeyboardEventListener) {
    document.addEventListener('keydown', listener)
  }
  public static addListenerKeyup(listener: KeyboardEventListener) {
    document.addEventListener('keyup', listener)
  }

  public static removeKeydownAndKeyupListeners(listener: KeyboardEventListener): void {
    document.removeEventListener('keyup', listener)
    document.removeEventListener('keydown', listener)
  }
}
