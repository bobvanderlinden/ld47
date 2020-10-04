//@ts-check

const log = require("./log")("physics");
const { playerRadius } = require("./constants");
const {
  perpendicularRightV,
  perpendicularLeftV,
  normalizeV,
  lengthV,
  multiplyV,
  substractV,
  addV,
  distanceToV,
  dotV,
  negateV,
  zeroV,
} = require("./vector");

class LineSegment {
  constructor(startx, starty, endx, endy) {
    this.start = [startx, starty];
    this.end = [endx, endy];
    const offset = substractV(this.end, this.start);
    this.length = lengthV(offset);
    this.normal = perpendicularLeftV(normalizeV(offset));
  }
}

function createBox(points) {
  var lineSegments = [];
  var prevPoint = points[points.length - 1];
  for (const point of points) {
    lineSegments.push(
      new LineSegment(prevPoint[0], prevPoint[1], point[0], point[1])
    );
    prevPoint = point;
  }
  return lineSegments;
}
function getLineCollisions(
  position,
  velocity,
  radius,
  lineSegments,
  collisions
) {
  for (const lineSegment of lineSegments) {
    if (dotV(lineSegment.normal, velocity) > 0) {
      continue;
    }
    const lineDirection = perpendicularRightV(lineSegment.normal);
    const lineLength = distanceToV(lineSegment.start, lineSegment.end);
    const relativePosition = substractV(position, lineSegment.start);
    const offY = dotV(lineSegment.normal, relativePosition) - radius;
    const offX = dotV(lineDirection, relativePosition);
    if (offY < -radius * 2) {
      continue;
    } else if (offY < 0) {
      if (offX > 0 && offX < lineLength) {
        collisions.push({
          normal: lineSegment.normal,
          offset: offY * -1,
        });
      } else if (offX < 0 && offX > -radius) {
        const distance = distanceToV(lineSegment.start, position);
        if (distance < radius) {
          collisions.push({
            normal: lineSegment.normal,
            offset: radius - distance,
          });
        }
      } else if (offX > lineLength && offX < lineLength + radius) {
        const distance = distanceToV(lineSegment.end, position);
        if (distance < radius) {
          collisions.push({
            normal: lineSegment.normal,
            offset: radius - distance,
          });
        }
      }
    } else {
      continue;
    }
  }
}

function offsetComparer(a, b) {
  return b.offset - a.offset;
}

function handleCircleLineCollision(
  collidable,
  radius,
  bounciness,
  collisionlines,
  collisions
) {
  let collided = false;
  for (var iteration = 0; iteration < 5; iteration++) {
    var potentialCollisions = [];

    getLineCollisions(
      collidable.position,
      collidable.velocity,
      radius,
      collisionlines,
      potentialCollisions
    );
    if (potentialCollisions.length > 0) {
      // Find closest collision.
      const collision = potentialCollisions.sort(offsetComparer)[0];

      collidable.position = addV(
        collidable.position,
        multiplyV(collision.normal, collision.offset)
      );

      // Velocity directed toward surface.
      const vc = dotV(collision.normal, collidable.velocity);

      collidable.velocity = substractV(
        collidable.velocity,
        multiplyV(collision.normal, (1 + bounciness) * vc)
      );

      collisions.push(collision);
      collided = true;
    } else {
      break;
    }
  }
  return collided;
}

function handleCircleCollision(
  collidableA,
  massa,
  radiusa,
  collidableB,
  massb,
  radiusb,
  bounciness
) {
  const { position: positionA, velocity: velocityA } = collidableA;
  const { position: positionB, velocity: velocityB } = collidableB;
  const difference = substractV(positionA, positionB);
  var distance = lengthV(difference);
  if (distance < radiusa + radiusb) {
    var totalmass = massa + massb;
    const normal = normalizeV(difference);

    // Reposition
    var penetrationLength = radiusa + radiusb - distance - 1;
    const positionDelta = multiplyV(
      normal,
      penetrationLength * (massb / totalmass)
    );

    collidableA.position = addV(collidableA.position, positionDelta);
    collidableB.position = substractV(collidableB.position, positionDelta);

    // Bounce
    var d = dotV(normal, substractV(velocityA, velocityB));
    if (d < 0) {
      const velocityDelta = multiplyV(
        normal,
        d * (1 + bounciness) * (massb / totalmass)
      );
      collidableA.velocity = substractV(collidableA.velocity, velocityDelta);
      collidableB.velocity = addV(collidableB.velocity, velocityDelta);
    }

    return normal;
  }
  return null;
}

function handleCollision(collidables, collisionlines) {
  var collidableCollisions = collidables.map(function (collidable) {
    return [collidable, []];
  });

  // Try to resolve collisions 5 times
  for (var i = 0; i < 5; i++) {
    let collided = false;
    for (const [collidable, collisions] of collidableCollisions) {
      const hadCircleLineCollision = handleCircleLineCollision(
        collidable,
        playerRadius,
        0.0,
        collisionlines,
        collisions
      );

      collided = collided || hadCircleLineCollision;

      // Handle circle-circle collisions.
      for (let [otherCollidable, otherCollisions] of collidableCollisions) {
        if (otherCollidable === collidable) {
          continue;
        }
        var collisionNormal = handleCircleCollision(
          collidable,
          1,
          playerRadius,
          otherCollidable,
          1,
          playerRadius,
          0.0
        );
        if (collisionNormal) {
          collided = true;
          collisions.push({
            object: otherCollidable,
            normal: collisionNormal,
          });
          otherCollisions.push({
            object: collidable,
            normal: negateV(collisionNormal),
          });
        }
      }
    }

    if (!collided) {
      // If there was no collision this iteration, there will be no
      // collisions for a next iteration. All collisions have been resolved.
      break;
    }
  }
  return collidableCollisions;
}

function getPlayerCollisions(players, collisionLines) {
  var boxcollisions = {};
  var playercollisions = {};
  var collisions = handleCollision(players, collisionLines);
  for (const [player, playerCollisions] of collisions) {
    boxcollisions[player.clientid] = [];
    playercollisions[player.clientid] = [];
    player.onground = playerCollisions.reduce(function (result, collision) {
      if (
        collision.object.box !== undefined &&
        dotV(collision.normal, [0, 1]) < 0
      ) {
        boxcollisions[player.clientid].push(collision.object);
      }
      if (collision.object.clientid !== undefined) {
        playercollisions[player.clientid].push(collision.object.clientid);
      }
      return result || dotV(collision.normal, [0, 1]) < 0;
    }, false);
  }
  return {
    boxcollisions: boxcollisions,
    playercollisions: playercollisions,
  };
}

module.exports = {
  LineSegment,
  createBox,
  handleCircleLineCollision,
  handleCollision,
  getPlayerCollisions,
};
