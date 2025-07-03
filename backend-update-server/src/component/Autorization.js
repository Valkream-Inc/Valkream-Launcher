class Autorization {    
    constructor(apiKey, apiToken, next) {
        this.apiKey = apiKey;
        this.apiToken = apiToken;
    }

    isAuthorized(req, res, next) {
        const send_api_key = req.body.api_key;
        const send_api_token = req.body.api_token;
        if (send_api_key !== this.apiKey || send_api_token !== this.apiToken) {
            res.status(401).send("❌ API key ou token invalide.");
        } else {
            next();
        }
    }
}

module.exports = Autorization;
