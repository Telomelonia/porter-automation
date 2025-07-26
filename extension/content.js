// Content Script - Runs on Porter pages
class PorterDataExtractor {
  constructor() {
    this.currentDate = this.getCurrentDateString();
    this.githubConfig = null;
    this.loadConfig();
  }

  async loadConfig() {
    try {
      const result = await chrome.storage.sync.get(['githubConfig']);
      this.githubConfig = result.githubConfig;
    } catch (error) {
      console.error('Failed to load config:', error);
    }
  }

  getCurrentDateString() {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = String(today.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  }

  extractTransactionData() {
    const transactions = [];
    
    // Wait for data to load
    const transactionRows = document.querySelectorAll('tr.table-row');
    
    if (transactionRows.length === 0) {
      console.log('No transaction rows found - page may still be loading');
      return null;
    }

    transactionRows.forEach((row, index) => {
      try {
        const cells = row.querySelectorAll('td');
        if (cells.length < 4) return;

        // Extract date
        const dateCell = cells[1];
        const dateText = dateCell?.textContent?.trim();
        const dateMatch = dateText?.match(/(\d{2}\/\d{2}\/\d{2})/);
        const timeMatch = dateText?.match(/(\d{1,2}:\d{2}\s*[AP]M)/i);

        if (!dateMatch) return;

        const transactionDate = dateMatch[1];
        
        // Only process today's transactions
        if (transactionDate === this.currentDate) {
          const transactionTime = timeMatch ? timeMatch[1] : 'Time not found';
          
          // Extract user
          const userCell = cells[2];
          const user = userCell?.textContent?.trim() || 'Unknown User';
          
          // Extract amount
          const amountCell = cells[3];
          const amountDiv = amountCell?.querySelector('#amount');
          const amountText = amountDiv?.textContent?.trim() || 'Amount not found';
          
          // Determine transaction type
          const isCredit = amountDiv?.classList.contains('status-green') || amountText.includes('+');
          const transactionType = isCredit ? 'Credit' : 'Debit';
          
          // Clean amount
          const cleanAmount = amountText.replace(/[₹,+\s]/g, '');

          transactions.push({
            extractedAt: new Date().toISOString(),
            date: transactionDate,
            time: transactionTime,
            user: user,
            amount: cleanAmount,
            amountFormatted: amountText,
            type: transactionType,
            rowIndex: index + 1
          });
        }
      } catch (error) {
        console.error(`Error processing row ${index + 1}:`, error);
      }
    });

    return transactions;
  }

  async sendDataToGitHub(transactions) {
    if (!this.githubConfig || !this.githubConfig.repoOwner || !this.githubConfig.repoName || !this.githubConfig.token) {
      console.error('GitHub configuration not found');
      return false;
    }

    const payload = {
      timestamp: new Date().toISOString(),
      date: this.currentDate,
      transactionCount: transactions ? transactions.length : 0,
      transactions: transactions || [],
      summary: transactions ? this.calculateSummary(transactions) : null
    };

    try {
      const url = `https://api.github.com/repos/${this.githubConfig.repoOwner}/${this.githubConfig.repoName}/dispatches`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.githubConfig.token}`,
          'Content-Type': 'application/json',
          'X-GitHub-Api-Version': '2022-11-28'
        },
        body: JSON.stringify({
          event_type: 'porter-data',
          client_payload: {
            data: payload,
            timestamp: new Date().toISOString()
          }
        })
      });

      if (response.ok) {
        console.log('Data sent successfully to GitHub');
        // Store success status
        chrome.storage.local.set({
          lastSync: new Date().toISOString(),
          lastSyncStatus: 'success',
          lastDataCount: transactions ? transactions.length : 0
        });
        return true;
      } else {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
    } catch (error) {
      console.error('Failed to send data:', error);
      chrome.storage.local.set({
        lastSync: new Date().toISOString(),
        lastSyncStatus: 'failed',
        error: error.message
      });
      return false;
    }
  }

  calculateSummary(transactions) {
    let totalCredit = 0;
    let totalDebit = 0;
    let creditCount = 0;
    let debitCount = 0;

    transactions.forEach(transaction => {
      const amount = parseFloat(transaction.amount.replace(/,/g, ''));
      if (transaction.type === 'Credit') {
        totalCredit += amount;
        creditCount++;
      } else {
        totalDebit += amount;
        debitCount++;
      }
    });

    return {
      totalTransactions: transactions.length,
      creditTransactions: creditCount,
      debitTransactions: debitCount,
      totalCreditAmount: totalCredit,
      totalDebitAmount: totalDebit,
      netAmount: totalCredit - totalDebit
    };
  }

  async runExtraction() {
    console.log('Starting Porter data extraction for date:', this.currentDate);
    
    // Ensure config is loaded
    if (!this.githubConfig) {
      await this.loadConfig();
    }
    
    // Wait for page to load completely
    if (document.readyState !== 'complete') {
      await new Promise(resolve => {
        window.addEventListener('load', resolve);
      });
    }

    // Additional wait for dynamic content
    await new Promise(resolve => setTimeout(resolve, 3000));

    const transactions = this.extractTransactionData();
    
    if (transactions && transactions.length > 0) {
      console.log(`Found ${transactions.length} transactions for ${this.currentDate}`);
      return await this.sendDataToGitHub(transactions);
    } else {
      console.log(`No transactions found for ${this.currentDate}`);
      // Still send empty data to track the attempt
      return await this.sendDataToGitHub([]);
    }
  }
}

// Initialize when content script loads
if (typeof window !== 'undefined' && window.location.hostname === 'pfe.porter.in') {
  const extractor = new PorterDataExtractor();
  
  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'extractData') {
      extractor.runExtraction().then(success => {
        sendResponse({ success });
      });
      return true; // Keep message channel open for async response
    }
  });

  // Auto-run if it's close to 11 PM
  const now = new Date();
  if (now.getHours() === 23 && now.getMinutes() >= 0) {
    extractor.runExtraction();
  }
}
