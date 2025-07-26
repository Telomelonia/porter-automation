// Background Script - Handles scheduling
class PorterScheduler {
  constructor() {
    this.setupAlarms();
    this.setupInstallListener();
  }

  setupInstallListener() {
    chrome.runtime.onInstalled.addListener(() => {
      console.log('Porter Transaction Scraper installed');
      this.setupAlarms();
    });
  }

  setupAlarms() {
    // Clear existing alarms
    chrome.alarms.clearAll();
    
    // Create alarm for 11:00 PM IST daily
    chrome.alarms.create('porterDataSync', {
      when: this.getNext11PM(),
      periodInMinutes: 24 * 60 // 24 hours
    });

    console.log('Alarm set for next 11 PM:', new Date(this.getNext11PM()));

    // Listen for alarm
    chrome.alarms.onAlarm.addListener((alarm) => {
      if (alarm.name === 'porterDataSync') {
        this.triggerDataExtraction();
      }
    });
  }

  getNext11PM() {
    const now = new Date();
    const next11PM = new Date();
    next11PM.setHours(23, 0, 0, 0); // 11:00 PM
    
    // If it's already past 11 PM today, set for tomorrow
    if (now.getTime() > next11PM.getTime()) {
      next11PM.setDate(next11PM.getDate() + 1);
    }
    
    return next11PM.getTime();
  }

  async triggerDataExtraction() {
    try {
      console.log('Triggering data extraction at:', new Date().toISOString());
      
      // Check if Porter tab is open
      const tabs = await chrome.tabs.query({
        url: 'https://pfe.porter.in/dashboard/payments*'
      });

      if (tabs.length > 0) {
        // Execute extraction on existing tab
        chrome.tabs.sendMessage(tabs[0].id, { action: 'extractData' }, (response) => {
          if (chrome.runtime.lastError) {
            console.error('Error sending message to tab:', chrome.runtime.lastError);
            this.showNotification('Error', 'Failed to extract data from Porter tab');
          } else if (response && response.success) {
            this.showNotification('Success', 'Porter transaction data extracted successfully');
          } else {
            this.showNotification('Warning', 'Data extraction completed but may have failed');
          }
        });
      } else {
        // Create notification for user to open Porter
        this.showNotification(
          'Porter Data Sync',
          'Please open Porter dashboard to sync today\'s transaction data'
        );
      }
    } catch (error) {
      console.error('Failed to trigger data extraction:', error);
      this.showNotification('Error', 'Failed to trigger data extraction');
    }
  }

  showNotification(title, message) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon48.png',
      title: title,
      message: message
    });
  }

  // Manual trigger method for popup
  async manualExtraction() {
    return await this.triggerDataExtraction();
  }
}

// Initialize scheduler
const scheduler = new PorterScheduler();

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'manualExtract') {
    scheduler.manualExtraction();
    sendResponse({ success: true });
  } else if (message.action === 'getStatus') {
    chrome.storage.local.get(['lastSync', 'lastSyncStatus', 'lastDataCount', 'error'], (result) => {
      sendResponse(result);
    });
    return true; // Keep message channel open
  }
});
