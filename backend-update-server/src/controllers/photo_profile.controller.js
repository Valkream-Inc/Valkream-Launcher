const log = require("../compoment/log.compoment.js");
const { ClientError, ServerError } = require("../compoment/error.compoment.js");
const Photo_profile = require("../models/photo_profile.model.js");

exports.upload = async (req, res) => {

    if (!req.body.file || !req.body.user_id)
        throw new ClientError('error_empty_info', 400, req.body.email, "upload photo_profile");

    const data = await Photo_profile.upload(new Photo_profile({
        user_id: req.body.user_id,
        file: JSON.parse(req.body.file),
        email: req.body.email
    }));

    log(req.body.email, "upload photo_profile", data.msg);
    return res.status(200).send(data);
};

exports.get = async (req, res) => {
    if (!req.body.user_id)
        throw new ClientError('error_empty_info', 400, req.body.email, "get photo_profile");

    const data = await Photo_profile.get(new Photo_profile({
        user_id: req.body.user_id,
        email: req.body.email
    }));

    res.setHeader('Content-Type', 'image/png');
    return res.sendFile(data, err => {
        if (err) {
            log(req.body.email, 'get photo_profile', "warning_" + err);
            throw new ServerError('error_get_photo_profile', req.body.email, 'get photo_profile');
        }
        log(req.body.email, "get photo_profile", "success_photo_profile_get");
    });
};