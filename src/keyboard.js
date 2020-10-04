const log = require("./log")("keyboard");
const EventEmitter = require("events");

const keyNames = {
  27: "escape",
  32: "space",
  38: "up",
  40: "down",
  39: "right",
  37: "left",
  13: "enter",
  16: "shift",
};

// Alphabetical characters
for (let i = 0; i < 27; i++) {
  keyNames[i + 65] = String.fromCharCode(i + 97);
}
// Numeric characters
for (let i = 0; i < 10; i++) {
  keyNames[i + 48] = String.fromCharCode(i + 48);
}

class Keyboard extends EventEmitter {
  constructor(element) {
    super();
    this.element = element;
    this.state = {};
    element.addEventListener(
      "keyup",
      (event) => {
        var keyName = keyNames[event.keyCode];
        if (keyName) {
          if (this.state[keyName]) {
            delete this.state[keyName];
            log.debug("keyup", keyName);
            this.emit("keyup", keyName);
          }
          event.preventDefault();
        }
      },
      true
    );

    element.addEventListener(
      "keydown",
      (event) => {
        var keyName = keyNames[event.keyCode];
        if (keyName) {
          if (!this.state[keyName]) {
            this.state[keyName] = true;
            log.debug("keydown", keyName);
            this.emit("keydown", keyName);
          }
          event.preventDefault();
        }
      },
      true
    );
  }
}

module.exports = {
  Keyboard,
};
