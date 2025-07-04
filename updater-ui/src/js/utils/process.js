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
  }

  initIpcListener() {
    ipcRenderer.on(`process-progress-${this.process_id}`, (event, data) => {
      this.process_container.innerHTML = data;
      this.init();
    });
  }

  init() {
    this.process_container.appendChild(`
    <div class="progress-item" id="${this.process_id}">
      <div class="progress-item-header">
        <div class="progress-item-info">
          <span class="material-icons">${this.process_icon}</span>
          <span class="progress-item-name">${this.process_name}</span>
        </div>
        <div class="progress-item-filename">${this.data.name}</div>
        <div class="progress-item-status ${this.data.status.class}" id="main-file-status">${this.data.status.text}</div>
      </div>

      <!-- Nom du fichier centré en haut -->

      <!-- Barre de progression avec vitesse -->
      <div class="progress-item-bar-container">
        <div class="progress-item-speed">${this.data.speed} MB/s</div>
        <div class="progress-item-bar">
          <div class="progress-item-fill" style="width: ${this.data.percent}%"></div>
        </div>
        <div class="progress-item-percent">${this.data.percent}%</div>
      </div>

      <!-- Informations en bas -->
      <div class="progress-item-bottom">
        <div class="progress-item-processed">${this.data.processedBytes} bytes</div>
        <div class="progress-item-total">${this.data.totalBytes} bytes</div>
      </div>
    </div>
    `);
  }
}

export default Process;
