const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Définir le répertoire de destination pour les fichiers téléchargés
const uploadDir = path.join(__dirname, '../uploads');

// Vérifier si le répertoire de destination existe, sinon le créer
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let directory = req.body.directory || '';
        const uploadPath = path.join(uploadDir, directory);
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

// Configuration du stockage pour Multer
const Photo_Profile_storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let Dir = path.join(uploadDir, 'photo_profile');
        if (!fs.existsSync(Dir)) {
            fs.mkdirSync(Dir);
        }
        cb(null, Dir); // Assurez-vous que ce dossier existe
    },
    filename: (req, file, cb) => {
        cb(null, req.body.user_id + '-' + file.originalname); // Renomme chaque fichier pour éviter les conflits
    }
});

const Photo_Profile_upload = multer({ storage: Photo_Profile_storage });

upload = multer({ storage });

module.exports = {
    uploadDir,
    Photo_Profile_upload
};