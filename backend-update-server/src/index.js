const express = require('express');
const bodyParser = require('body-parser');
require('dotenv-defaults').config();
const cors = require("cors");
const { ClientError } = require("./compoment/error.compoment.js");

const app = express();
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// CORS configuration
const corsOptions = {
    origin: function (origin, callback) {
        // Allow specific origins from environment variables
        const allowedOrigins = [
            'http://' + process.env.BACKEND_HOST + ":" + process.env.backend_login_PORT,
        ];

        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true); // Allow the request
        } else {
            log(null, null, 'warning_ Not allowed by CORS');
            callback(new ClientError('error_ Not allowed by CORS', 403, null, null)); // Reject the request
        }
    },
    methods: ['POST'], // Allow only GET and POST methods
    allowedHeaders: ['Content-Type', 'Authorization'], // Allow specific headers
    credentials: true // Allow requests with credentials (cookies, authentication, etc.)
};

app.use(cors(corsOptions));
app.set('trust proxy', 1);

require("./routes/photo_profile.routes.js")(app);
require("./routes/project.routes.js")(app);

/*// Définir le répertoire de destination pour les fichiers téléchargés
const uploadDir = path.join(__dirname, 'uploads');

// Vérifier si le répertoire de destination existe, sinon le créer
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
} */


/*const storage = multer.diskStorage({
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
});*/

/*const upload = multer({ storage });

app.use(express.static(path.join(__dirname, 'public')));*/

app.post
/*
app.get(process.env.backend_file_ROUTES, (req, res) => {
    res.sendFile(path.join(__dirname, 'upload.html'));
}); 

app.post(process.env.backend_file_ROUTES + 'upload', upload.any(), (req, res, next) => {
    const files = req.files;

    // Vérifier si des fichiers ont été téléversés
    if (!files || files.length === 0) {
        return res.status(400).send('Aucun fichier téléversé.');
    }

    // Vérifier si un répertoire de destination a été spécifié
    const directory = req.body.directory || '';

    // Si un répertoire est spécifié, vérifier s'il existe
    if (directory) {
        const destinationDir = path.join(uploadDir, directory);
        if (!fs.existsSync(destinationDir)) {
            fs.mkdirSync(destinationDir, { recursive: true });
        }
    }

    // Traiter chaque fichier téléversé
    files.forEach(file => {
        // Construire le chemin de destination pour le fichier
        let destination = uploadDir;

        // Si un répertoire est spécifié, ajuster le chemin de destination
        if (directory) {
            destination = path.join(destination, directory);
        }

        // Déplacer le fichier vers le répertoire de destination
        fs.rename(file.path, path.join(destination, file.originalname), err => {
            if (err) {
                return next(err);
            }
        });
    });

    res.send('Fichier(s) téléversé(s) avec succès.');
});


app.get(process.env.backend_file_ROUTES + 'files', (req, res) => {
    // Fonction récursive pour parcourir les dossiers et fichiers
    function getFilesRecursively(directory) {
        const files = fs.readdirSync(directory);
        let directoryContents = [];
        files.forEach(file => {
            const filePath = path.join(directory, file);
            const stats = fs.statSync(filePath);
            if (stats.isDirectory()) {
                directoryContents.push({
                    type: 'directory',
                    name: file,
                    path: filePath,
                    contents: getFilesRecursively(filePath)
                });
            } else {
                directoryContents.push({
                    type: 'file',
                    name: file,
                    path: filePath
                });
            }
        });
        return directoryContents;
    }

    // Appeler la fonction récursive avec le répertoire racine
    const directoryStructure = getFilesRecursively(uploadDir);

    // Envoyer la structure des dossiers et fichiers en tant que JSON
    res.json(directoryStructure);
});

app.post(process.env.backend_file_ROUTES + 'file-content', (req, res) => {
    const { fileName, directory } = req.body;

    if (!directory || !fileName) {
        return res.status(400).json({ error: 'Le nom du fichier et le répertoire sont requis.' });
    }

    const filePath = path.join(uploadDir, directory, fileName);

    // Vérifier si le fichier existe avant de tenter de le lire
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            return res.status(404).send('Fichier non trouvé.');
        }

        // Créer un flux de lecture du fichier
        const fileStream = fs.createReadStream(filePath);

        // Définir le type de contenu de la réponse
        res.setHeader('Content-Type', 'text/plain');

        // Pipe les données du flux de fichier à la réponse
        fileStream.pipe(res);
    });
});



app.get(process.env.backend_file_ROUTES + 'view-file', (req, res) => {
    res.sendFile(path.join(__dirname, 'view-file.html'));
});*/

//handle error
require("./config/error.config.js")(app);

// Démarrer le serveur
const PORT = process.env.backend_file_PORT || 3005;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

process.on('uncaughtException', function (e) {
    console.log('uncaughtException' + e);
});