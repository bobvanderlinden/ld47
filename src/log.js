class ConsoleLogger {
  error(...args) {
    console.error(...args);
  }
  warn(...args) {
    console.warn(...args);
  }
  info(...args) {
    console.info(...args);
  }
  debug(...args) {
    // console.debug(...args);
  }
}

class ChildLogger {
  constructor(logger, ...args) {
    this.logger = logger;
    this.args = args;
  }

  error(...args) {
    this.logger.error(...this.args, ...args);
  }
  warn(...args) {
    this.logger.warn(...this.args, ...args);
  }
  info(...args) {
    this.logger.info(...this.args, ...args);
  }
  debug(...args) {
    this.logger.debug(...this.args, ...args);
  }
}

const defaultLogger = new ConsoleLogger();
module.exports = (...args) => new ChildLogger(defaultLogger, ...args);
module.exports.error = defaultLogger.error.bind(defaultLogger);
module.exports.warn = defaultLogger.warn.bind(defaultLogger);
module.exports.info = defaultLogger.info.bind(defaultLogger);
module.exports.debug = defaultLogger.debug.bind(defaultLogger);
