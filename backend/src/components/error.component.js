class ClientError extends Error {
  constructor(message, statusCode, user, process) {
    super(message);
    this.statusCode = statusCode;
    this.user = user;
    this.process = process || null;
  }
}

class ServerError extends Error {
  constructor(message, user, process) {
    super(message);
    this.user = user;
    this.process = process || null;
  }
}

module.exports = {
  ClientError,
  ServerError,
};
