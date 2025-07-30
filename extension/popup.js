// Popup JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Set default dates (last 7 days)
    const today = new Date();
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    document.getElementById('endDate').value = formatDate(today);
    document.getElementById('startDate').value = formatDate(lastWeek);
    
    // Set up event listener
    document.getElementById('extractBtn').addEventListener('click', extractData);
});

function formatDate(date) {
    return date.toISOString().split('T')[0];
}

function extractData() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const extractBtn = document.getElementById('extractBtn');
    
    // Validation
    if (!startDate || !endDate) {
        showAlert('error', 'Please select both start and end dates.');
        return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
        showAlert('error', 'Start date cannot be after end date.');
        return;
    }
    
    // Disable button and show loading
    extractBtn.disabled = true;
    extractBtn.textContent = 'Extracting...';
    
    // Check if Porter trip details tab is open
    chrome.tabs.query({ url: 'https://pfe.porter.in/dashboard/trip_details*' }, function(tabs) {
        if (tabs.length === 0) {
            showAlert('error', 'Please open Porter trip details page first.');
            extractBtn.disabled = false;
            extractBtn.textContent = 'Extract Trip Data to CSV';
            return;
        }
        
        // Send extraction request to content script
        chrome.tabs.sendMessage(tabs[0].id, {
            action: 'extractTrips',
            startDate: startDate,
            endDate: endDate
        }, function(response) {
            extractBtn.disabled = false;
            extractBtn.textContent = 'Extract Trip Data to CSV';
            
            if (chrome.runtime.lastError) {
                showAlert('error', 'Failed to communicate with the page. Please refresh and try again.');
                return;
            }
            
            if (response && response.success) {
                showAlert('success', `Successfully extracted ${response.count} trips to CSV file!`);
            } else {
                showAlert('error', response?.message || 'No data found for the selected date range.');
            }
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
