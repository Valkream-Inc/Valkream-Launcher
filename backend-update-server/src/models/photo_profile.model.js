const { ClientError, ServerError } = require('../compoment/error.compoment.js');
const path = require('path');
const fs = require('fs').promises;
const log = require("../compoment/log.compoment.js")

// Définir le répertoire de destination pour les fichiers téléchargés
const uploadDir = path.join(__dirname, '../uploads');

// Limites de taille et types MIME autorisés
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png'];

// Constructeur de Photo_profile
const Photo_profile = function (photo_profile) {
    this.email = photo_profile.email;
    this.user_id = photo_profile.user_id || null;
    this.file = photo_profile.file || null;
    this.name = photo_profile.name || null;
};

Photo_profile.upload = async (photo_profile) => {
    if (photo_profile.file.size > MAX_FILE_SIZE)
        throw new ClientError('error_file_too_large', 400, photo_profile.email, 'upload photo_profile');

    // Vérification du type MIME
    if (!ALLOWED_MIME_TYPES.includes(photo_profile.file.mimetype))
        throw new ClientError('error_invalid_file_type', 400, photo_profile.email, 'upload photo_profile');

    try {
        const photo_profile_Dir = path.join(uploadDir, "photo_profile");
        await fs.mkdir(photo_profile_Dir, { recursive: true });

        const files = await fs.readdir(photo_profile_Dir);
        const filesToDelete = files.filter(file => file.startsWith(`${photo_profile.user_id}_`));
        await Promise.all(filesToDelete.map(file => {
            const filePath = path.join(photo_profile_Dir, file);
            return fs.unlink(filePath);
        }));

        const destinationPath = path.join(photo_profile_Dir, `${photo_profile.user_id}_${photo_profile.file.originalname}`);

        const fileBuffer = Buffer.isBuffer(photo_profile.file.buffer)
            ? photo_profile.file.buffer
            : Buffer.from(photo_profile.file.buffer.data)

        await fs.writeFile(destinationPath, fileBuffer);

    } catch (err) {
        log(photo_profile.email, 'upload photo_profile', "warning_" + err);
        throw new ServerError('error_upload_photo_profile', photo_profile.email, 'upload photo_profile');
    }

    return { msg: 'success_upload' };
};

Photo_profile.get = async (photo_profile) => {

    try {
        const photo_profile_Dir = path.join(uploadDir, "photo_profile");
        await fs.mkdir(photo_profile_Dir, { recursive: true });

        const files = await fs.readdir(photo_profile_Dir);
        const photoFile = files.find(file => file.startsWith(photo_profile.user_id + '_'));

        // Si aucun fichier correspondant n'est trouvé, renvoyez une erreur 404
        if (!photoFile)
            return path.join(__dirname, '../public/default-user.png');;

        // Chemin complet du fichier
        return path.join(photo_profile_Dir, photoFile);

    } catch (err) {
        log(photo_profile.email, 'get photo_profile', "warning_" + err);
        throw new ServerError('error_get_photo_profile', photo_profile.email, 'get photo_profile');
    }
};

module.exports = Photo_profile;
