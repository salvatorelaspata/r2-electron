window.addEventListener("DOMContentLoaded", async () => {
  const information = document.getElementById("info");
  try {
    information.innerText = `Chrome (v${window.versions.chrome()}), Node.js (v${window.versions.node()}), e Electron (v${window.versions.electron()})`;

    const response = await window.versions.ping();
    console.log(response);
  } catch (error) {
    console.error("Errore:", error);
    information.innerText = `Errore nel caricamento delle informazioni: ${error.message}`;
  }
});

let currentBucket = null;

// Funzione per formattare la data
const formatDate = (date) => {
  return new Date(date).toLocaleString();
};

// Aggiorna l'indicatore dell'ultimo aggiornamento
const updateLastUpdate = () => {
  const lastUpdate = document.getElementById("last-update");
  lastUpdate.textContent = `Ultimo aggiornamento: ${formatDate(new Date())}`;
};

// Renderizza la card di un bucket
const renderBucketCard = (bucketName, stats) => {
  return `
        <div class="bucket-card" data-bucket="${bucketName}">
            <h3>${bucketName}</h3>
            <div class="bucket-stats">
                <p>Oggetti totali: ${stats.totalObjects}</p>
                <p>Dimensione totale: ${stats.humanReadableSize}</p>
            </div>
        </div>
    `;
};

// Renderizza la lista degli oggetti in un bucket
const renderObjectsList = (objects) => {
  // Sort objects: directories first, then files
  objects.sort((a, b) => {
    if (a.size === 0 && b.size !== 0) return -1;
    if (a.size !== 0 && b.size === 0) return 1;
    return a.key.localeCompare(b.key);
  });

  return objects
    .map(
      (obj) => `
        <tr>
            <td>${obj.key}</td>
            <td>${obj.humanReadableSize}</td>
            <td>${formatDate(obj.lastModified)}</td>
            <td>
                <button class="action-button delete-button" data-key="${obj.key
        }">Cancella</button>
                <button class="action-button download-button" data-key="${obj.key
        }">Scarica</button>
                ${obj.size === 0 ? `<button class="action-button upload-to-folder-button" data-key="${obj.key}">Carica qui</button>` : ''}
            </td>
        </tr>
    `
    )
    .join("");
};

// Aggiorna la vista dei dettagli del bucket
const updateBucketDetails = (bucketName, stats) => {
  const detailsSection = document.getElementById("bucket-details");
  const selectedBucket = document.getElementById("selected-bucket");
  const objectsTable = document.getElementById("objects-table");

  selectedBucket.textContent = bucketName;
  objectsTable.innerHTML = stats.objects.length > 0 ? renderObjectsList(stats.objects) : '<tr><td colspan="4">Nessun oggetto presente</td></tr>';
  detailsSection.classList.remove("hidden");

  // Add event listeners for buttons
  objectsTable.querySelectorAll(".delete-button").forEach((button) => {
    button.addEventListener("click", (event) => {
      const objectKey = event.target.getAttribute("data-key");
      handleDeleteObject(bucketName, objectKey);
    });
  });

  objectsTable.querySelectorAll(".download-button").forEach((button) => {
    button.addEventListener("click", (event) => {
      const objectKey = event.target.getAttribute("data-key");
      handleDownloadObject(bucketName, objectKey);
    });
  });

  objectsTable.querySelectorAll(".upload-to-folder-button").forEach((button) => {
    button.addEventListener("click", (event) => {
      const folderName = event.target.getAttribute("data-key");
      handleUploadObject(bucketName, folderName);
    });
  });

  // Add event listener for upload button
  const uploadButton = document.getElementById("upload-button");
  uploadButton.onclick = () => {
    const folderName = document.getElementById("folder-name").value;
    handleUploadObject(bucketName, folderName);
  };

  // Add event listener for create folder button
  const createFolderButton = document.getElementById("create-folder-button");
  createFolderButton.onclick = () => handleCreateFolder(bucketName);
};

// Gestione loading e errori
const UI = {
  showLoading: () => {
    document.getElementById("loading-overlay").classList.remove("hidden");
  },
  hideLoading: () => {
    const loadingOverlay = document.getElementById("loading-overlay");
    if (loadingOverlay) {
      loadingOverlay.classList.add("hidden");
    }
  },
  showToast: (message, type = "error") => {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;

    document.getElementById("toast-container").appendChild(toast);

    // Rimuovi il toast dopo 5 secondi
    setTimeout(() => {
      toast.remove();
    }, 5000);
  },
  showError: (message) => {
    const errorDiv = document.createElement("div");
    errorDiv.className = "error-message";
    errorDiv.textContent = message;

    // Inserisci l'errore all'inizio del container
    const container = document.querySelector(".container");
    container.insertBefore(errorDiv, container.firstChild);
  },
  clearErrors: () => {
    document.querySelectorAll(".error-message").forEach((el) => el.remove());
  },
};

// Aggiorna la funzione updateDashboard con gestione errori
const updateDashboard = async () => {
  UI.showLoading();
  UI.clearErrors();

  try {
    const stats = await window.api.getAllStats();

    if (!stats || Object.keys(stats).length === 0) {
      UI.showError("Nessun bucket trovato");
      return;
    }

    const bucketsContainer = document.getElementById("buckets-list");

    bucketsContainer.innerHTML = Object.entries(stats)
      .map(([bucketName, bucketStats]) =>
        renderBucketCard(bucketName, bucketStats)
      )
      .join("");

    document.querySelectorAll(".bucket-card").forEach((card) => {
      card.addEventListener("click", () =>
        handleBucketClick(card.dataset.bucket)
      );
    });

    updateLastUpdate();

    if (currentBucket) {
      const currentStats = stats[currentBucket];
      if (currentStats) {
        updateBucketDetails(currentBucket, currentStats);
      }
    }

    UI.showToast("Dashboard aggiornata con successo", "success");
  } catch (error) {
    console.error("Errore durante l'aggiornamento della dashboard:", error);
    UI.showError(
      `Errore durante l'aggiornamento della dashboard: ${error.message}`
    );
    UI.showToast("Errore durante l'aggiornamento della dashboard");
  } finally {
    UI.hideLoading();
  }
};

// Aggiorna la funzione handleBucketClick con gestione errori
const handleBucketClick = async (bucketName) => {
  UI.showLoading();

  try {
    currentBucket = bucketName;
    // Forza un aggiornamento fresco delle statistiche
    const stats = await window.api.getBucketStats(bucketName);

    if (!stats) {
      // Se il bucket è vuoto, crea un oggetto stats vuoto
      updateBucketDetails(bucketName, { objects: [], totalObjects: 0, totalSize: 0, humanReadableSize: '0 B' });
    } else {
      updateBucketDetails(bucketName, stats);
    }
  } catch (error) {
    console.error(
      "Errore durante il caricamento dei dettagli del bucket:",
      error
    );
    UI.showError(
      `Errore durante il caricamento dei dettagli del bucket: ${error.message}`
    );
    UI.showToast(`Errore nel caricamento di ${bucketName}`);
  } finally {
    UI.hideLoading();
  }
};

const handleDeleteObject = async (bucketName, objectKey) => {
  const confirmation = confirm(
    `Sei sicuro di voler cancellare l'oggetto ${objectKey}?`
  );
  if (!confirmation) return;

  UI.showLoading();

  try {
    await window.api.deleteObject(bucketName, objectKey);
    UI.showToast(`Oggetto ${objectKey} cancellato con successo`, "success");
    await handleBucketClick(bucketName); // Refresh bucket details
  } catch (error) {
    console.error("Errore durante la cancellazione dell'oggetto:", error);
    UI.showError(
      `Errore durante la cancellazione dell'oggetto: ${error.message}`
    );
    UI.showToast(`Errore durante la cancellazione dell'oggetto ${objectKey}`);
  } finally {
    UI.hideLoading();
  }
};

const handleDownloadObject = async (bucketName, objectKey) => {
  UI.showLoading();

  try {
    const signedUrl = await window.api.getSignedUrl(bucketName, objectKey);
    const link = document.createElement("a");
    link.href = signedUrl;
    link.download = objectKey;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    UI.showToast(`Oggetto ${objectKey} scaricato con successo`, "success");
  } catch (error) {
    console.error("Errore durante il download dell'oggetto:", error);
    UI.showError(`Errore durante il download dell'oggetto: ${error.message}`);
    UI.showToast(`Errore durante il download dell'oggetto ${objectKey}`);
  } finally {
    UI.hideLoading();
  }
};

const handleUploadObject = async (bucketName, folderName = "") => {
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.onchange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    UI.showLoading();

    try {
      const arrayBuffer = await file.arrayBuffer();
      const objectKey = folderName ? `${folderName}/${file.name}` : file.name;
      await window.api.putObject(bucketName, objectKey, arrayBuffer);
      UI.showToast(`Oggetto ${file.name} caricato con successo`, "success");
      await handleBucketClick(bucketName); // Refresh bucket details
    } catch (error) {
      console.error("Errore durante il caricamento dell'oggetto:", error);
      UI.showError(
        `Errore durante il caricamento dell'oggetto: ${error.message}`
      );
      UI.showToast(`Errore durante il caricamento dell'oggetto ${file.name}`);
    } finally {
      UI.hideLoading();
    }
  };
  fileInput.click();
};

const handleCreateFolder = async (bucketName) => {
  const folderName = document.getElementById("folder-name").value;
  if (!folderName) return;

  UI.showLoading();

  try {
    console.log("Creazione della cartella:", folderName);
    await window.api.createFolder(bucketName, folderName);
    UI.showToast(`Cartella ${folderName} creata con successo`, "success");
    await handleBucketClick(bucketName); // Refresh bucket details
  } catch (error) {
    console.error("Errore durante la creazione della cartella:", error);
    UI.showError(`Errore durante la creazione della cartella: ${error.message}`);
    UI.showToast(`Errore durante la creazione della cartella ${folderName}`);
  } finally {
    UI.hideLoading();
  }
};

// Aggiungi questo dopo la definizione delle altre funzioni
const setupBucketUpdates = () => {
  window.api.onBucketStatsUpdated((event, { bucketName, stats }) => {
    if (!stats) return;

    // Aggiorna la card del bucket
    const bucketCard = document.querySelector(
      `.bucket-card[data-bucket="${bucketName}"]`
    );
    if (bucketCard) {
      const statsHtml = `
                <h3>${bucketName}</h3>
                <div class="bucket-stats">
                    <p>Oggetti totali: ${stats.totalObjects}</p>
                    <p>Dimensione totale: ${stats.humanReadableSize}</p>
                </div>
            `;
      bucketCard.innerHTML = statsHtml;
    }

    // Se questo è il bucket attualmente selezionato, aggiorna anche i dettagli
    if (currentBucket === bucketName) {
      updateBucketDetails(bucketName, stats);
    }

    updateLastUpdate();
  });
};

// Modifica la funzione initialize per includere il setup degli aggiornamenti
const initialize = async () => {
  UI.showLoading();

  try {
    await window.api.startMonitoring();
    await updateDashboard();

    // Aggiungi il setup degli aggiornamenti
    setupBucketUpdates();

    // Aggiorna la dashboard ogni 30 secondi
    setInterval(async () => {
      try {
        await updateDashboard();
      } catch (error) {
        console.error("Errore durante l'aggiornamento automatico:", error);
        UI.showToast("Errore durante l'aggiornamento automatico");
      }
    }, 30000);
  } catch (error) {
    console.error("Errore durante l'inizializzazione:", error);
    UI.showError(`Errore durante l'inizializzazione: ${error.message}`);
    UI.showToast("Errore durante l'inizializzazione dell'applicazione");
  } finally {
    UI.hideLoading();
  }
};

// Avvia l'applicazione quando il DOM è caricato
document.addEventListener("DOMContentLoaded", initialize);
