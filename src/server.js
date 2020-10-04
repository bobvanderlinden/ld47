const webpack = require("webpack");
const webpackDevMiddleware = require("webpack-dev-middleware");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const express = require("express");
const ws = require("ws");
const { Simulator } = require("./simulator");
const { JsonWebsocketMessenger } = require("./jsonwebsocketmessenger");
const { NetworkServer } = require("./network-server");
const game = require("./game");

const app = express();
app.use(express.static("web"));
app.use(
  webpackDevMiddleware(
    webpack({
      mode: "development",
      plugins: [new HtmlWebpackPlugin()],
      module: {
        rules: [
          {
            test: /\.(png|jpe?g|gif)$/i,
            use: [
              {
                loader: "file-loader",
              },
            ],
          },
        ],
      },
    })
  )
);

const server = app.listen(process.env.PORT || 3000);
const wss = new ws.Server({ noServer: true });

const simulator = new Simulator(game);
const networkServer = new NetworkServer(simulator);

server.on("upgrade", (request, socket, head) => {
  if (request.url === "/game") {
    wss.handleUpgrade(request, socket, head, (socket) => {
      const messenger = new JsonWebsocketMessenger(socket);
      networkServer.createClient(messenger, "henk");
    });
  }
});
