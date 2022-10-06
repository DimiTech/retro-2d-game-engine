export default abstract class GameObject {
  public x: number
  public y: number

  public isOpen: boolean

  protected static openColor   : string
  protected static closedColor : string

  constructor(
    public row: number,
    public col: number,
  ) {
  }

  public abstract draw(): void
  public abstract open(): void
}
