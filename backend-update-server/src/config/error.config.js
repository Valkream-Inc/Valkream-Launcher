const log = require("../compoment/log.compoment.js");
const { ClientError, ServerError } = require("../compoment/error.compoment.js");

module.exports = app => {
    app.use((err, req, res, next) => {
        if (err instanceof ClientError) {
            log(err.user, err.process, err.message);
            res.status(err.statusCode).json({ err: err.message });

        } else if (err instanceof ServerError) {
            log(err.user, err.process, err.message);
            res.status(500).json({ err: 'internal_server_error' });

        } else {
            log(null, null, "warning_" + 'Error not catch ' + err.stack);
            res.status(500).json({ err: 'Internal server error' });
        }
        next();
    });
}