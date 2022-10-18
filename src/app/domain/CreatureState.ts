enum CreatureState {
  Idling,
  Moving,
  MovingCooldown,    // TODO: Try removing this state
  Attacking,
  AttackingCooldown, // TODO: Try removing this state
  Dying,
  Decaying,
  Removed,
}

export default CreatureState
