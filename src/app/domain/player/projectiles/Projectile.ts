export default abstract class Projectile {
  public speed: number
  public damage: number
  public alive: boolean
  public row: number
  public col: number
  protected previousX: number
  protected previousY: number

  public abstract update(playerX: number, playerY: number): void
  public abstract draw(playerX: number, playerY: number): void

  constructor(
    public x: number,
    public y: number,
    public directionX: number,
    public directionY: number,
  ) {
  }
}