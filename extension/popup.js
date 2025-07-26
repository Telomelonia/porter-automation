// Popup JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Load current status
    loadStatus();
    
    // Load saved configuration
    loadConfig();
    
    // Set up event listeners
    document.getElementById('saveConfig').addEventListener('click', saveConfig);
    document.getElementById('extractNow').addEventListener('click', extractNow);
});

function loadStatus() {
    chrome.runtime.sendMessage({ action: 'getStatus' }, function(response) {
        if (response) {
            updateStatus(response);
        }
    });
}

function updateStatus(status) {
    // Last sync time
    const lastSyncElement = document.getElementById('lastSync');
    if (status.lastSync) {
        const syncDate = new Date(status.lastSync);
        lastSyncElement.textContent = syncDate.toLocaleString();
    } else {
        lastSyncElement.textContent = 'Never';
    }
    
    // Sync status
    const syncStatusElement = document.getElementById('syncStatus');
    if (status.lastSyncStatus === 'success') {
        syncStatusElement.textContent = 'Success';
        syncStatusElement.className = 'value status-success';
    } else if (status.lastSyncStatus === 'failed') {
        syncStatusElement.textContent = 'Failed';
        syncStatusElement.className = 'value status-failed';
        if (status.error) {
            showAlert('error', `Last sync failed: ${status.error}`);
        }
    } else {
        syncStatusElement.textContent = 'Never run';
        syncStatusElement.className = 'value status-never';
    }
    
    // Data count
    const dataCountElement = document.getElementById('dataCount');
    dataCountElement.textContent = status.lastDataCount || '0';
}

function loadConfig() {
    chrome.storage.sync.get(['githubConfig'], function(result) {
        if (result.githubConfig) {
            const config = result.githubConfig;
            document.getElementById('repoOwner').value = config.repoOwner || '';
            document.getElementById('repoName').value = config.repoName || '';
            document.getElementById('githubToken').value = config.token || '';
        }
    });
}

function saveConfig() {
    const repoOwner = document.getElementById('repoOwner').value.trim();
    const repoName = document.getElementById('repoName').value.trim();
    const token = document.getElementById('githubToken').value.trim();
    
    if (!repoOwner || !repoName || !token) {
        showAlert('error', 'Please fill in all GitHub configuration fields.');
        return;
    }
    
    const config = {
        repoOwner: repoOwner,
        repoName: repoName,
        token: token
    };
    
    chrome.storage.sync.set({ githubConfig: config }, function() {
        if (chrome.runtime.lastError) {
            showAlert('error', 'Failed to save configuration.');
        } else {
            showAlert('success', 'Configuration saved successfully!');
        }
    });
}

function extractNow() {
    const extractBtn = document.getElementById('extractNow');
    extractBtn.disabled = true;
    extractBtn.textContent = 'Extracting...';
    
    // Check if we have a valid configuration
    chrome.storage.sync.get(['githubConfig'], function(result) {
        if (!result.githubConfig || !result.githubConfig.repoOwner || !result.githubConfig.repoName || !result.githubConfig.token) {
            showAlert('error', 'Please configure GitHub settings first.');
            extractBtn.disabled = false;
            extractBtn.textContent = 'Extract Now';
            return;
        }
        
        // Check if Porter tab is open
        chrome.tabs.query({ url: 'https://pfe.porter.in/dashboard/payments*' }, function(tabs) {
            if (tabs.length === 0) {
                showAlert('error', 'Please open Porter dashboard in a tab first.');
                extractBtn.disabled = false;
                extractBtn.textContent = 'Extract Now';
                return;
            }
            
            // Send manual extraction request
            chrome.runtime.sendMessage({ action: 'manualExtract' }, function(response) {
                extractBtn.disabled = false;
                extractBtn.textContent = 'Extract Now';
                
                if (response && response.success) {
                    showAlert('success', 'Data extraction initiated. Check the status in a few seconds.');
                    // Reload status after a delay
                    setTimeout(loadStatus, 3000);
                } else {
                    showAlert('error', 'Failed to initiate data extraction.');
                }
            });
        });
    });
}

function showAlert(type, message) {
    const alertsContainer = document.getElementById('alerts');
    
    // Clear existing alerts
    alertsContainer.innerHTML = '';
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    alertsContainer.appendChild(alertDiv);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.parentNode.removeChild(alertDiv);
        }
    }, 5000);
}
