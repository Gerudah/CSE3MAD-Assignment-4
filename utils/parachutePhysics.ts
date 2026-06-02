export type Physics = {
  velocity: number;
  acceleration: number;
  weight: number;
  netForce: number;
  dragForce: number;
  gForce: number;
};

/**
 * Derives physics quantities from a parachute drop experiment.
 *
 * Model assumptions:
 *  - Uniform acceleration over dropTime (v = h / t).
 *  - Net upward drag = weight − ma; clamped to 0 when net force exceeds weight.
 *  - G-force at landing calculated from velocity change during contact time.
 */
export function calcPhysics(
  height: number,
  mass: number,
  dropTime: number,
  contactTime: number
): Physics {
  const velocity = height / dropTime;
  const acceleration = velocity / dropTime;
  const weight = mass * 9.8;
  const netForce = mass * acceleration;
  const dragForce = Math.max(0, weight - netForce);
  const gForce = (velocity / contactTime) / 9.8;
  return { velocity, acceleration, weight, netForce, dragForce, gForce };
}
