var router = require("express").Router();
require('dotenv-defaults').config();

const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 20000 * 1024 * 1024, // Set file size limit (e.g., 10 MB)
        fieldSize: 20000 * 1024 * 1024, // Set field size limit (e.g., 10 MB)
        fields: 30, // Optional: limit the number of non-file fields
        files: 1000 // Optional: limit the number of file fields
    }
});

const handleErrorAsync = (func) => (req, res, next) => {
    func(req, res, next).catch(next);  // Simplification de la gestion des erreurs asynchrones
};

const project = require("../controllers/project.controller.js");

module.exports = app => {

    router.post('/upload', upload.array('files'), handleErrorAsync(project.upload));
    router.post('/get', handleErrorAsync(project.get));
    router.post('/build', handleErrorAsync(project.build));
    router.post('/start', handleErrorAsync(project.start));
    router.post('/stop', handleErrorAsync(project.stop));
    router.post('/restart', handleErrorAsync(project.restart));

    app.use(process.env.backend_file_ROUTES + "/project", router);
};
