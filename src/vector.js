/* @ts-check */

/** @typedef {[number, number]} Vector2 */

/** @return {Vector2} */
function addV([ax, ay], [bx, by]) {
  return [ax + bx, ay + by];
}

/** @return {Vector2} */
function substractV([ax, ay], [bx, by]) {
  return [ax - bx, ay - by];
}

/** @return {Vector2} */
function multiplyV([x, y], f) {
  return [x * f, y * f];
}

/** @return {Vector2} */
function negateV([x, y]) {
  return [-x, -y];
}

/** @return {Vector2} */
function perpendicularLeftV([x, y]) {
  return [y, -x];
}

/** @return {Vector2} */
function perpendicularRightV([x, y]) {
  return [-y, x];
}

/** @return {number} */
function dotV([ax, ay], [bx, by]) {
  return ax * bx + ay * by;
}

/** @return {number} */
function lengthV([x, y]) {
  return Math.sqrt(x * x + y * y);
}

/** @return {Vector2} */
function normalizeV(v, fallback = zeroV) {
  const [x, y] = v;
  const length = lengthV(v);
  if (length === 0) {
    return fallback;
  }
  return [x / length, y / length];
}

/** @return {number} */
function distanceToV(a, b) {
  return lengthV(substractV(a, b));
}

/** @type {Vector2} */
const zeroV = [0, 0];

module.exports = {
  addV,
  substractV,
  multiplyV,
  negateV,
  perpendicularLeftV,
  perpendicularRightV,
  dotV,
  lengthV,
  normalizeV,
  distanceToV,
  zeroV,
};
