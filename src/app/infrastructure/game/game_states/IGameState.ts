export default interface IGameState {
  enter(previousState?: IGameState): void
  exit(nextState?: IGameState): void
  update(): void
  render(): void
  destroyGame?(): void 
}
