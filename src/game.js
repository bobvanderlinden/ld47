const log = require("./log")("game");
const { zeroV, addV, multiplyV, distanceToV } = require("./vector");
const { level, checkpoints } = require("./level");
const { handleCollision } = require("./physics");
const { playerRadius, checkpointRadius } = require("./constants");

function initGame() {
  return {
    frame: 0,
    checkpoint: 1,
    clients: [],
  };
}

function initClient({ id, name, state }) {
  return {
    id,
    name,
    keys: {},
    position:
      checkpoints[
        (state.checkpoint + checkpoints.length - 1) % checkpoints.length
      ],
    velocity: zeroV,
    finished: 0,
  };
}

function updateClient(client, state) {
  const movement = (client.keys.d ? 1 : 0) - (client.keys.a ? 1 : 0);

  const gravity = [0, 1];

  const acceleration = 0.5;
  const damping = 0.1;

  const velocity = [
    multiplyV(client.velocity, 1 - damping),
    multiplyV([movement, 0], acceleration),
    gravity,
  ].reduce(addV, zeroV);

  const position = addV(client.position, velocity);

  const finished =
    !client.finished &&
    distanceToV(checkpoints[state.checkpoint], client.position) <
      playerRadius + checkpointRadius
      ? state.frame
      : client.finished;

  return {
    ...client,
    position,
    velocity,
    finished,
  };
}

function updateGame(previousState, events) {
  log.debug("update", events, previousState);
  const state = events.reduce(updateEvent, previousState);
  const clients = state.clients.map((client) =>
    updateClient(client, previousState)
  );

  for (const [client, collisions] of handleCollision(clients, level)) {
    collisions.sort((a, b) => a.normal[1] - b.normal[1]);
    if (client.keys.space === state.frame) {
      for (const collision of collisions) {
        if (collision.normal[1] < 0) {
          // client is on ground.
          client.velocity = addV(client.velocity, [0, -10]);
          break;
        } else if (collision.normal[0] != 0 && collision.normal[1] === 0) {
          // client is against wall
          client.velocity = addV([0, -10], multiplyV(collision.normal, 10));
          break;
        }
      }
    }
  }

  const finishedCheckpoint =
    clients.length > 0 && clients.every((client) => client.finished);

  return {
    ...state,
    clients: finishedCheckpoint
      ? clients.map((client) => ({ ...client, finished: 0 }))
      : clients,
    checkpoint: finishedCheckpoint
      ? (state.checkpoint + 1) % checkpoints.length
      : state.checkpoint,
    frame: state.frame + 1,
  };
}

function updateEvent(state, event) {
  log.debug("updateEvent", event);
  switch (event.type) {
    case "connect":
      return {
        ...state,
        clients: [
          ...state.clients,
          initClient({ id: event.clientid, name: event.clientName, state }),
        ],
      };
    case "disconnect":
      return {
        ...state,
        clients: state.clients.filter((client) => client.id !== event.clientid),
      };
    case "game-input":
      return {
        ...state,
        clients: state.clients.map((client) => {
          const keys =
            ["keydown", "keyup"].includes(event.input.type) &&
            client.id === event.clientid
              ? {
                  ...client.keys,
                  [event.input.key]:
                    event.input.type === "keydown" ? state.frame : undefined,
                }
              : client.keys;

          // Debugging.
          const position =
            event.input.type === "click"
              ? [event.input.x, event.input.y]
              : client.position;
          return {
            ...client,
            position,
            keys,
          };
        }),
      };
    default:
      throw new Error(`Event type not recognized: ${event.type}`);
  }
}

const eventTypePriority = {
  connect: 1,
  "game-input": 2,
  disconnect: 99,
};

function compare(va, vb) {
  if (va === undefined) {
    if (vb === undefined) {
      return 0;
    }
    return 1;
  } else if (vb === undefined) {
    return -1;
  }
  return va > vb ? 1 : vb > va ? -1 : 0;
}

function compareEvents(ea, eb) {
  if (!eventTypePriority[ea.type] || !eventTypePriority[eb.type]) {
    throw new Error(`${ea.type} is not a known event type`);
  }
  return (
    compare(eventTypePriority[ea.type], eventTypePriority[eb.type]) ||
    compare(ea.clientid, eb.clientid) ||
    compare(ea.input && ea.input.key, eb.input && eb.input.key) ||
    compare(ea.input && ea.input.direction, eb.input && eb.input.direction) ||
    compare(ea.name, eb.name)
  );
}

module.exports = {
  init: initGame,
  update: updateGame,
  compareEvents,
};
