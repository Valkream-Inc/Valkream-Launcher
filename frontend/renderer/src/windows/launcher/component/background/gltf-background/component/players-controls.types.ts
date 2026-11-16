/**
 * @author Valkream Team
 * @license MIT-NC
 */

export interface PlayerControlsProps {
  speed?: number;
  climbSpeed?: number;
}

/** Touches de déplacement actuellement enfoncées. */
export interface PlayerMoveState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
}
