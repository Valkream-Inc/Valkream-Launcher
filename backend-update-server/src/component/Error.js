class ClientError extends Error {
    constructor(message, res, statusCode = 400) {
        super(message);
        this.statusCode = statusCode;
        res.status(this.statusCode).send(this.message);
    }
}

class ServerError extends Error {
    constructor(message, res, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        res.status(this.statusCode).send(this.message);
    }
}

module.exports = { ClientError, ServerError };