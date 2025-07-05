const { ipcRenderer } = require("electron");
const { formatBytes } = require("valkream-function-lib");

class Process {
  constructor(process_id, process_container, process_name, process_icon) {
    this.process_id = process_id;
    this.process_container = process_container;
    this.process_name = process_name;
    this.process_icon = process_icon;
    this.data = {
      processedBytes: 0,
      totalBytes: 0,
      percent: 0,
      speed: 0,
      name: "",
      status: {
        text: "En attente",
        class: "progress-item-status",
      },
    };

    this.initIpcListener();
    this.init();
  }

  initIpcListener() {
    ipcRenderer.on(`process-progress-${this.process_id}`, (event, data) => {
      this.updateData(data);
      this.updateUI();
    });
  }

  updateData(data) {
    if (data.processedBytes !== undefined)
      this.data.processedBytes = data.processedBytes;
    if (data.totalBytes !== undefined) this.data.totalBytes = data.totalBytes;
    if (data.percent !== undefined) this.data.percent = data.percent;
    if (data.speed !== undefined) this.data.speed = data.speed;
    if (data.name !== undefined) this.data.name = data.name;
    if (data.status !== undefined) this.data.status = data.status;
  }

  updateUI() {
    const element = document.getElementById(this.process_id);
    if (!element) return;

    // Mettre à jour le nom du fichier
    const filenameElement = element.querySelector(".progress-item-filename");
    if (filenameElement) {
      filenameElement.textContent = this.data.name;
      // Masquer si le nom est vide ou null
      if (!this.data.name || this.data.name === "-") {
        filenameElement.style.display = "none";
      } else {
        filenameElement.style.display = "block";
      }
    }

    // Mettre à jour le statut
    const statusElement = element.querySelector(".progress-item-status");
    if (statusElement) {
      statusElement.textContent = this.data.status.text;
      statusElement.className = `progress-item-status ${this.data.status.class}`;
      element.className = `progress-item ${this.data.status.class}`;
    }

    // Mettre à jour la vitesse
    const speedElement = element.querySelector(".progress-item-speed");
    if (speedElement) {
      speedElement.textContent = `${formatBytes(this.data.speed)}/s`;
      // Masquer si la vitesse est 0 ou null
      if (!this.data.speed || this.data.speed === 0) {
        speedElement.style.display = "none";
      } else {
        speedElement.style.display = "block";
      }
    }

    // Mettre à jour la barre de progression
    const progressElement = element.querySelector(".progress-item-fill");
    if (progressElement) {
      progressElement.style.width = `${this.data.percent}%`;
      // Masquer si le pourcentage est 0 ou null
      if (!this.data.percent || this.data.percent === 0) {
        progressElement.style.display = "none";
      } else {
        progressElement.style.display = "block";
      }
    }

    // Mettre à jour le pourcentage
    const percentElement = element.querySelector(".progress-item-percent");
    if (percentElement) {
      percentElement.textContent = `${this.data.percent}%`;
      // Masquer si le pourcentage est 0 ou null
      if (!this.data.percent || this.data.percent === 0) {
        percentElement.style.display = "none";
      } else {
        percentElement.style.display = "block";
      }
    }

    // Mettre à jour les bytes traités
    const processedElement = element.querySelector(".progress-item-processed");
    if (processedElement) {
      processedElement.textContent = `${formatBytes(this.data.processedBytes)}`;
      // Masquer si les bytes traités sont 0 ou null
      if (!this.data.processedBytes || this.data.processedBytes === 0) {
        processedElement.style.display = "none";
      } else {
        processedElement.style.display = "block";
      }
    }

    // Mettre à jour les bytes totaux
    const totalElement = element.querySelector(".progress-item-total");
    if (totalElement) {
      totalElement.textContent = `${formatBytes(this.data.totalBytes)}`;
      // Masquer si les bytes totaux sont 0 ou null
      if (!this.data.totalBytes || this.data.totalBytes === 0) {
        totalElement.style.display = "none";
      } else {
        totalElement.style.display = "block";
      }
    }
  }

  init() {
    const processElement = document.createElement("div");
    processElement.className = "progress-item";
    processElement.id = this.process_id;

    processElement.innerHTML = `
      <div class="progress-item-header">
        <div class="progress-item-info">
          <span class="material-icons">${this.process_icon}</span>
          <span class="progress-item-name">${this.process_name}</span>
        </div>
        <div class="progress-item-filename" style="display: none;">${
          this.data.name
        }</div>
        <div class="progress-item-status ${this.data.status.class}">${
      this.data.status.text
    }</div>
      </div>

      <!-- Barre de progression avec vitesse -->
      <div class="progress-item-bar-container">
        <div class="progress-item-speed" style="display: none;">${formatBytes(
          this.data.speed
        )}/s</div>
        <div class="progress-item-bar">
          <div class="progress-item-fill" style="width: ${
            this.data.percent
          }%; display: none;"></div>
        </div>
        <div class="progress-item-percent" style="display: none;">${
          this.data.percent
        }%</div>
      </div>

      <!-- Informations en bas -->
      <div class="progress-item-bottom">
        <div class="progress-item-processed" style="display: none;">${formatBytes(
          this.data.processedBytes
        )}</div>
        <div class="progress-item-total" style="display: none;">${formatBytes(
          this.data.totalBytes
        )}</div>
      </div>
    `;

    this.process_container.appendChild(processElement);
  }

  setStatus(status) {
    this.data.status = status;

    // Si le statut est "done", mettre la barre de progression à 100%
    if (status.text === "Terminé" || status.class === "completed") {
      this.data.percent = 100;
    }

    this.updateUI();
  }

  updateProgress(processedBytes, totalBytes, speed, name) {
    this.data.processedBytes = processedBytes;
    this.data.totalBytes = totalBytes;
    this.data.percent =
      totalBytes > 0 ? Math.round((processedBytes / totalBytes) * 100) : 0;
    this.data.speed = speed;
    if (name) this.data.name = name;
    this.updateUI();
  }
}

export default Process;
