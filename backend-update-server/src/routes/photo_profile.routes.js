var router = require("express").Router();
require('dotenv-defaults').config();

const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // Set file size limit (e.g., 10 MB)
        fieldSize: 10 * 1024 * 1024, // Set field size limit (e.g., 10 MB)
        fields: 10, // Optional: limit the number of non-file fields
        files: 1 // Optional: limit the number of file fields
    }
});

const handleErrorAsync = (func) => (req, res, next) => {
    func(req, res, next).catch(next);  // Simplification de la gestion des erreurs asynchrones
};

const photo_profile = require("../controllers/photo_profile.controller.js");

module.exports = app => {

    router.post('/upload', upload.single('file'), handleErrorAsync(photo_profile.upload));
    router.post('/get', handleErrorAsync(photo_profile.get));

    app.use(process.env.backend_file_ROUTES + "/photo_profile", router);
};
