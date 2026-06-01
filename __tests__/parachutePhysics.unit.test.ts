/**
 * Unit tests for calcPhysics() in utils/parachutePhysics.ts
 *
 * The function models a parachute drop experiment using:
 *   velocity     = height / dropTime
 *   acceleration = velocity / dropTime
 *   weight       = mass × 9.8
 *   netForce     = mass × acceleration
 *   dragForce    = max(0, weight − netForce)
 *   gForce       = (velocity / contactTime) / 9.8
 */

import { calcPhysics } from '../utils/parachutePhysics';

describe('calcPhysics', () => {
  // ── velocity ──────────────────────────────────────────────────────────────

  it('computes velocity as height / dropTime', () => {
    const { velocity } = calcPhysics(2, 0.1, 1, 0.2);
    expect(velocity).toBeCloseTo(2.0, 5);
  });

  it('velocity scales proportionally with height', () => {
    const { velocity: v1 } = calcPhysics(1, 0.1, 1, 0.2);
    const { velocity: v2 } = calcPhysics(3, 0.1, 1, 0.2);
    expect(v2).toBeCloseTo(v1 * 3, 5);
  });

  // ── acceleration ──────────────────────────────────────────────────────────

  it('computes acceleration as velocity / dropTime', () => {
    // height=2, dropTime=1 → velocity=2; acceleration = 2/1 = 2
    const { acceleration } = calcPhysics(2, 0.1, 1, 0.2);
    expect(acceleration).toBeCloseTo(2.0, 5);
  });

  it('acceleration = height / dropTime²', () => {
    // height=4, dropTime=2 → velocity=2, acceleration=1
    const { acceleration } = calcPhysics(4, 0.1, 2, 0.3);
    expect(acceleration).toBeCloseTo(1.0, 5);
  });

  // ── weight ────────────────────────────────────────────────────────────────

  it('computes weight as mass × 9.8', () => {
    const { weight } = calcPhysics(2, 0.5, 1, 0.2);
    expect(weight).toBeCloseTo(0.5 * 9.8, 5);
  });

  it('weight is independent of height, dropTime, and contactTime', () => {
    const mass = 0.2;
    const w1 = calcPhysics(1, mass, 1, 0.1).weight;
    const w2 = calcPhysics(5, mass, 3, 0.5).weight;
    expect(w1).toBeCloseTo(w2, 5);
  });

  // ── dragForce — slow drop (parachute present) ─────────────────────────────

  it('dragForce = weight − netForce when object falls slowly enough', () => {
    // height=2, mass=0.1, dropTime=2, contactTime=0.3
    // velocity=1, acceleration=0.5, weight=0.98, netForce=0.05 → drag=0.93
    const { dragForce, weight, netForce } = calcPhysics(2, 0.1, 2, 0.3);
    expect(dragForce).toBeCloseTo(weight - netForce, 5);
    expect(dragForce).toBeCloseTo(0.93, 4);
  });

  it('a longer dropTime (more drag) produces higher dragForce', () => {
    const fast = calcPhysics(2, 0.1, 0.8, 0.1);  // faster fall
    const slow = calcPhysics(2, 0.1, 2.5, 0.3);  // slower, more drag
    expect(slow.dragForce).toBeGreaterThan(fast.dragForce);
  });

  // ── dragForce — fast drop (baseline, no parachute) ───────────────────────

  it('dragForce is clamped to 0 when netForce exceeds weight', () => {
    // height=1, dropTime=0.3: acceleration≈11.1 m/s² > g=9.8
    // → netForce > weight regardless of mass → dragForce = 0
    const { dragForce } = calcPhysics(1, 0.2, 0.3, 0.05);
    expect(dragForce).toBe(0);
  });

  it('dragForce is never negative', () => {
    // Extremely fast fall — netForce >> weight
    const { dragForce } = calcPhysics(0.5, 0.5, 0.1, 0.05);
    expect(dragForce).toBeGreaterThanOrEqual(0);
  });

  // ── gForce ────────────────────────────────────────────────────────────────

  it('computes gForce as (velocity / contactTime) / 9.8', () => {
    // height=2, dropTime=1, contactTime=0.2 → velocity=2, gForce=(2/0.2)/9.8 ≈ 1.0204
    const { gForce } = calcPhysics(2, 0.1, 1, 0.2);
    expect(gForce).toBeCloseTo((2 / 0.2) / 9.8, 4);
  });

  it('a shorter contactTime produces a higher gForce (harder impact)', () => {
    const soft = calcPhysics(2, 0.1, 1, 0.5);  // contactTime=0.5 s
    const hard = calcPhysics(2, 0.1, 1, 0.1);  // contactTime=0.1 s
    expect(hard.gForce).toBeGreaterThan(soft.gForce);
  });

  // ── comparative: parachute vs baseline ───────────────────────────────────

  it('parachute design has higher dragForce and lower gForce than baseline', () => {
    // Baseline: fast drop, no chute (height/dropTime² > 9.8)
    const baseline = calcPhysics(1, 0.2, 0.3, 0.05);
    // With chute: slow drop, soft landing
    const withChute = calcPhysics(1, 0.2, 2.0, 0.3);

    expect(withChute.dragForce).toBeGreaterThan(baseline.dragForce);
    expect(withChute.gForce).toBeLessThan(baseline.gForce);
  });

  // ── all fields present ────────────────────────────────────────────────────

  it('returns an object with all six physics fields', () => {
    const result = calcPhysics(2, 0.1, 1, 0.2);
    expect(result).toHaveProperty('velocity');
    expect(result).toHaveProperty('acceleration');
    expect(result).toHaveProperty('weight');
    expect(result).toHaveProperty('netForce');
    expect(result).toHaveProperty('dragForce');
    expect(result).toHaveProperty('gForce');
  });
});
