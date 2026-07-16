function write(level, event, details = {}) {
  console.log(JSON.stringify({
    level,
    event,
    timestamp: new Date().toISOString(),
    ...details
  }));
}

module.exports = {
  info(event, details) {
    write("info", event, details);
  },

  error(event, details) {
    write("error", event, details);
  }
};
