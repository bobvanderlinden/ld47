const EventEmitter = require("events");
const { parse, stringify } = require("./deterministic-json");
const log = require("./log");

class JsonWebsocketMessenger extends EventEmitter {
  constructor(ws) {
    super();
    this.ws = ws;
    ws.onmessage = this.handleWebsocketMessage.bind(this);
    ws.onclose = this.handleWebsocketClose.bind(this);
  }

  handleWebsocketMessage(event) {
    var data = event.utf8Data || event.data;
    var msg = parse(data);
    log.debug("<", msg.type, msg);
    this.emit("message", msg);
  }

  handleWebsocketClose() {
    this.emit("close");
  }

  send(msg) {
    log.debug(">", msg.type, msg);
    this.ws.send(stringify(msg));
  }

  close() {
    this.ws.close();
  }
}

module.exports = { JsonWebsocketMessenger };
