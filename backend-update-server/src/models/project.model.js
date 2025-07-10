const { ClientError, ServerError } = require('../compoment/error.compoment.js');
const path = require('path');
const fs = require('fs').promises;
const log = require("../compoment/log.compoment.js")
const { execSync } = require('child_process');

// Définir le répertoire de destination pour les fichiers téléchargés
const uploadDir = path.join(__dirname, '../uploads');
const publicDir = path.join(__dirname, '../public');

// Constructeur de project
const Project = function (project) {
    this.email = project.email;
    this.id = project.id || null;
    this.files = project.files || null;
};

Project.upload = async (project) => {

    try {
        const projectDir = path.join(uploadDir, "user", project.id);
        // Vérifier si le répertoire existe avant de le supprimer
      /*  try {
            await fs.access(projectDir); // Vérifie si le répertoire existe
            await fs.rm(projectDir, { recursive: true });
        } catch (err) {
            if (err.code !== 'ENOENT') throw err; // Ignore seulement l'erreur ENOENT
        }*/
        await fs.mkdir(projectDir, { recursive: true });

        let destinationPath;
        let fileBuffer;
        let fileContent;

        for (let file of project.files) {
            const destinationDir = path.join(projectDir, path.dirname(file.relativePath));
            await fs.mkdir(destinationDir, { recursive: true });

            destinationPath = path.join(projectDir, file.relativePath);
            const fileBuffer = Buffer.from(file.bufferArray);
            await fs.writeFile(destinationPath, fileBuffer);
        }

        /*  destinationPath = path.join(projectDir, "..", "compose.yaml");
          fileContent = await fs.readFile(path.join(publicDir, 'docker-default', 'compose.txt'), 'utf-8');
          let customizedContent = fileContent
              .replace(/{{PORT}}/g, project.id)              // Remplacer {{PORT}} par le port
          await fs.writeFile(destinationPath, customizedContent, 'utf-8');
  
          destinationPath = path.join(projectDir, "..", "Dockerfile");
          fileBuffer = await fs.readFile(path.join(publicDir, 'docker-default', "Dockerfile"));
          await fs.writeFile(destinationPath, fileBuffer);
  
          destinationPath = path.join(projectDir, "..", "nginx.conf");
          fileBuffer = await fs.readFile(path.join(publicDir, 'docker-default', "nginx.conf"));
          await fs.writeFile(destinationPath, fileBuffer);*/

    } catch (err) {
        log(project.email, 'upload project', "warning_" + err);
        throw new ServerError('error_upload_project', project.email, 'upload project');
    }

    return { msg: 'success_upload' };
};

Project.get = async (project) => {

    try {
        const projectDir = path.join(uploadDir, "user", String(project.id));
        await fs.mkdir(projectDir, { recursive: true });

        const getDirectoryTree = async (dirPath) => {
            const items = await fs.readdir(dirPath, { withFileTypes: true });
            return await Promise.all(items.map(async (item) => {
                const fullPath = path.join(dirPath, item.name);
                if (item.isDirectory()) {
                    return {
                        name: item.name,
                        type: 'folder',
                        children: await getDirectoryTree(fullPath),
                    };
                } else {
                    return {
                        name: item.name,
                        type: 'file',
                        extension: path.extname(item.name).toLowerCase(),
                    };
                }
            }));
        };
        const res = await getDirectoryTree(projectDir);
        return { msg: 'success_get', info: res }
    } catch (err) {
        log(project.email, 'get project', "warning_" + err);
        throw new ServerError('error_get_project', project.email, 'get project');
    };
}

Project.build = async (project) => {

    try {
        const projectDir = path.join(uploadDir, "project", String(project.id));

        const command = `cd ${projectDir} && docker compose up -d --build --force-recreate`;
        await execSync(command);

    } catch (err) {
        log(project.email, 'build project', "warning_" + err);
        throw new ServerError('error_build_project', project.email, 'build project');
    }

    return { msg: 'success_project_build' };
};

Project.start = async (project) => {

    try {
        const projectDir = path.join(uploadDir, "project", String(project.id));

        const command = `cd ${projectDir} && docker compose up -d`;
        await execSync(command);

    } catch (err) {
        log(project.email, 'start project', "warning_" + err);
        throw new ServerError('error_start_project', project.email, 'start project');
    }

    return { msg: 'success_project_start' };
};

Project.stop = async (project) => {

    try {
        const projectDir = path.join(uploadDir, "project", String(project.id));

        const command = `cd ${projectDir} && docker compose down`;
        await execSync(command);

    } catch (err) {
        log(project.email, 'stop project', "warning_" + err);
        throw new ServerError('error_stop_project', project.email, 'stop project');
    }

    return { msg: 'success_project_stop' };
};

Project.restart = async (project) => {

    await Project.stop(new Project({
        id: project.id,
        email: project.email
    }));

    await Project.start(new Project({
        id: project.id,
        email: project.email
    }));

    return { msg: 'success_project_restart' };
};
module.exports = Project;
