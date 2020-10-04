const log = require("./log")("index");
const { Keyboard } = require("./keyboard");
const { Graphics } = require("./graphics");
const { NetworkClient } = require("./network-client");
const { Simulator } = require("./simulator");
const game = require("./game");
const { addV, multiplyV } = require("./vector");
const { level, checkpoints } = require("./level");
const { JsonWebsocketMessenger } = require("./jsonwebsocketmessenger");
const { playerRadius, checkpointRadius } = require("./constants");
const foreground = require("./foreground.png");

const colors = ["red", "green", "yellow", "blue"];

const canvas = document.createElement("canvas");
canvas.width = 1024;
canvas.height = 786;
window.document.body.appendChild(canvas);
canvas.style.background = `url(${foreground.default})`;
canvas.setAttribute("tabIndex", "0");
canvas.focus();
canvas.oncontextmenu = () => false;
const context = canvas.getContext("2d");

const keyboard = new Keyboard(canvas);
const graphics = new Graphics(canvas);

const simulator = new Simulator(game);

const websocketUrl = `${
  window.location.protocol === "https:" ? "wss:" : "ws:"
}//${window.location.host}/game`;
const websocket = new window.WebSocket(websocketUrl);

const messenger = new JsonWebsocketMessenger(websocket);
const networkClient = new NetworkClient({
  messenger,
  simulator,
});

keyboard.on("keyup", (key) => {
  networkClient.gameInput({ type: "keyup", key });
});
keyboard.on("keydown", (key) => {
  networkClient.gameInput({ type: "keydown", key });
});

canvas.addEventListener("click", (e) => {
  networkClient.gameInput({ type: "click", x: e.clientX, y: e.clientY });
});

const requestAnimationFrame =
  window.requestAnimationFrame ||
  window.mozRequestAnimationFrame ||
  window.webkitRequestAnimationFrame ||
  window.msRequestAnimationFrame ||
  function (callback) {
    window.setTimeout(callback, 1000 / 60);
  };

requestAnimationFrame(draw);
function draw() {
  const state = simulator.getCurrentState();
  const context = graphics.context;
  const activeClient = state.clients.filter(
    (client) => client.id === networkClient.clientid
  )[0];

  graphics.clear();

  // Draw checkpoint.
  const checkpointPosition = checkpoints[state.checkpoint];
  graphics.fillCircle(
    checkpointPosition[0],
    checkpointPosition[1],
    checkpointRadius,
    activeClient && activeClient.finished ? "gray" : "green"
  );

  // Draw active player aura.
  if (activeClient) {
    const auraRadius = 10;
    const gradient = graphics.context.createRadialGradient(
      activeClient.position[0],
      activeClient.position[1],
      playerRadius,
      activeClient.position[0],
      activeClient.position[1],
      playerRadius + auraRadius
    );
    gradient.addColorStop(0, "#ccff0050");
    gradient.addColorStop(1, "#ccff0000");
    graphics.fillCircle(
      activeClient.position[0],
      activeClient.position[1],
      playerRadius + auraRadius,
      gradient
    );
  }

  // Draw players.
  for (const client of state.clients) {
    graphics.fillCircle(
      client.position[0],
      client.position[1],
      playerRadius,
      colors[client.id % colors.length]
    );
  }

  // Draw level lines.
  for (const lineSegment of level) {
    graphics.strokeLine(lineSegment.start, lineSegment.end);
    const middle = multiplyV(addV(lineSegment.start, lineSegment.end), 0.5);
    graphics.strokeLine(
      middle,
      addV(middle, multiplyV(lineSegment.normal, 10)),
      "gray"
    );
  }

  // Draw HUD.
  graphics.context.fillStyle = "black";

  const lines = [
    `frame: ${simulator.getCurrentFrame()}`,
    `serverFrame: ${networkClient.serverFrame}`,
    `framesDifference: ${networkClient.framesDifference}`,
    `latencySolving: ${networkClient.latencyMs}`,
  ];

  let y = 10;
  for (const line of lines) {
    graphics.context.fillText(line, 0, y);
    y += 10;
  }

  requestAnimationFrame(draw);
}

messenger.on("close", () => {
  setTimeout(() => {
    window.location.reload();
  }, 1000);
  document.write("reloading");
});
