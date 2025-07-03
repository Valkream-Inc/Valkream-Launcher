const handleError = (err, res, next) => {
    if (err instanceof ClientError) {
        res.status(err.statusCode).send(err.message);
    } else if (err instanceof ServerError) {
        res.status(err.statusCode).send(err.message);
    } else {
        res.status(500).send("Erreur serveur");
    }
}

module.exports = handleError;