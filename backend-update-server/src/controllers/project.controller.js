const log = require("../compoment/log.compoment.js");
const { ClientError, ServerError } = require("../compoment/error.compoment.js");
const Project = require("../models/project.model.js");

exports.upload = async (req, res) => {
    if (!req.body.files || !req.body.id)
        throw new ClientError('error_empty_info', 400, req.body.email, "upload project");

    const data = await Project.upload(new Project({
        id: req.body.id,
        files: JSON.parse(req.body.files),
        email: req.body.email
    }));

    log(req.body.email, "upload project", data.msg);
    return res.status(200).send(data);
};

exports.get = async (req, res) => {
    if (!req.body.id)
        throw new ClientError('error_empty_info', 400, req.body.email, "get project");

    const data = await Project.get(new Project({
        id: req.body.id,
        email: req.body.email
    }));

    log(req.body.email, "get project", data.msg);
    return res.status(200).send(data);
};


exports.build = async (req, res) => {
    console.log(req.body);
    if (!req.body.id)
        throw new ClientError('error_empty_info', 400, req.body.email, "build project");

    const data = await Project.build(new Project({
        id: req.body.id,
        email: req.body.email
    }));

    log(req.body.email, "build project", data.msg);
    return res.status(200).send(data);
};

exports.start = async (req, res) => {
    console.log(req.body);
    if (!req.body.id)
        throw new ClientError('error_empty_info', 400, req.body.email, "start project");

    const data = await Project.start(new Project({
        id: req.body.id,
        email: req.body.email
    }));

    log(req.body.email, "start project", data.msg);
    return res.status(200).send(data);
};

exports.stop = async (req, res) => {
    console.log(req.body);
    if (!req.body.id)
        throw new ClientError('error_empty_info', 400, req.body.email, "stop project");

    const data = await Project.stop(new Project({
        id: req.body.id,
        email: req.body.email
    }));

    log(req.body.email, "stop project", data.msg);
    return res.status(200).send(data);
};

exports.restart = async (req, res) => {
    console.log(req.body);
    if (!req.body.id)
        throw new ClientError('error_empty_info', 400, req.body.email, "restart project");

    const data = await Project.restart(new Project({
        id: req.body.id,
        email: req.body.email
    }));

    log(req.body.email, "restart project", data.msg);
    return res.status(200).send(data);
};