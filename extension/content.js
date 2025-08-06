// Content Script - Runs on Porter trip details pages
class PorterTripExtractor {
  constructor() {
    this.startDate = null;
    this.endDate = null;
    this.maxRetries = 50; // Maximum number of "See more" clicks to prevent infinite loops
    this.waitTime = 2000; // Wait time between clicks (ms)
  }

  setDateRange(startDate, endDate) {
    this.startDate = startDate;
    this.endDate = endDate;
  }

  parsePorterDate(dateString) {
    // Convert DD/MM/YYYY to Date object
    const [day, month, year] = dateString.split('/');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }

  parseInputDate(dateString) {
    // Convert YYYY-MM-DD to Date object
    return new Date(dateString + 'T00:00:00');
  }

  isDateInRange(porterDateString) {
    if (!this.startDate || !this.endDate) return true; // If no range set, include all
    
    try {
      const tripDate = this.parsePorterDate(porterDateString);
      const start = this.parseInputDate(this.startDate);
      const end = this.parseInputDate(this.endDate);
      
      // Set time to start of day for accurate comparison
      tripDate.setHours(0, 0, 0, 0);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      
      return tripDate >= start && tripDate <= end;
    } catch (error) {
      console.error('Error parsing date:', porterDateString, error);
      return false;
    }
  }

  // Check if we've reached the end of our date range
  hasReachedDateRangeEnd() {
    if (!this.startDate) return false; // If no start date filter, continue loading
    
    const tableRows = this.getTableRows();
    if (tableRows.length === 0) return true;
    
    // Check the last few rows to see if we've gone past our date range
    const lastRows = Array.from(tableRows).slice(-5); // Check last 5 rows
    
    for (const row of lastRows) {
      const cells = row.querySelectorAll('td');
      if (cells.length >= 2) {
        const dateText = cells[1]?.textContent?.trim();
        if (dateText && dateText.match(/\d{2}\/\d{2}\/\d{4}/)) {
          try {
            const rowDate = this.parsePorterDate(dateText);
            const startDate = this.parseInputDate(this.startDate);
            rowDate.setHours(0, 0, 0, 0);
            startDate.setHours(0, 0, 0, 0);
            
            // If we find a row that's before our start date, we've loaded enough
            if (rowDate < startDate) {
              console.log(`Reached date range end - found date ${dateText} before start date ${this.startDate}`);
              return true;
            }
          } catch (error) {
            console.error('Error checking date range end:', error);
          }
        }
      }
    }
    
    return false;
  }

  getTableRows() {
    let tableRows = document.querySelectorAll('tr.table-row-2');
    
    if (tableRows.length === 0) {
      tableRows = document.querySelectorAll('tr.MuiTableRow-root');
    }
    
    return tableRows;
  }

  findSeeMoreButton() {
    // Look for the "See more" button with the specific structure you provided
    const seeMoreSelectors = [
      'span.MuiFab-label', // Direct selector from your example
      'button[aria-label*="more"]', // Alternative ARIA label
      'button:contains("See more")', // Button containing text
      '.MuiFab-root', // Material UI FAB button
      '[data-testid*="load-more"]', // Common test ID pattern
      '[data-testid*="see-more"]'
    ];

    for (const selector of seeMoreSelectors) {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        const text = element.textContent || element.innerText || '';
        if (text.toLowerCase().includes('see more') || text.toLowerCase().includes('load more')) {
          // Find the clickable parent button
          let clickableElement = element;
          while (clickableElement && clickableElement.tagName !== 'BUTTON') {
            clickableElement = clickableElement.parentElement;
            if (clickableElement && (clickableElement.onclick || clickableElement.addEventListener)) {
              break;
            }
          }
          return clickableElement || element;
        }
      }
    }

    // Fallback: look for any element containing "See more" text
    const allElements = document.querySelectorAll('*');
    for (const element of allElements) {
      if (element.textContent && element.textContent.toLowerCase().includes('see more')) {
        return element;
      }
    }

    return null;
  }

  async clickSeeMore() {
    const seeMoreButton = this.findSeeMoreButton();
    
    if (!seeMoreButton) {
      console.log('No "See more" button found');
      return false;
    }

    console.log('Found "See more" button, clicking...', seeMoreButton);
    
    try {
      // Try different click methods
      if (seeMoreButton.click) {
        seeMoreButton.click();
      } else {
        // Fallback to dispatch click event
        const clickEvent = new MouseEvent('click', {
          view: window,
          bubbles: true,
          cancelable: true
        });
        seeMoreButton.dispatchEvent(clickEvent);
      }
      
      return true;
    } catch (error) {
      console.error('Error clicking "See more" button:', error);
      return false;
    }
  }

  async waitForNewData(previousRowCount) {
    let attempts = 0;
    const maxAttempts = 10; // Wait up to 10 seconds for new data
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const currentRowCount = this.getTableRows().length;
      if (currentRowCount > previousRowCount) {
        console.log(`New data loaded: ${currentRowCount} total rows (was ${previousRowCount})`);
        return true;
      }
      
      attempts++;
    }
    
    console.log('No new data loaded after waiting');
    return false;
  }

  async loadAllData() {
    console.log('Starting to load all data by clicking "See more"...');
    let clickCount = 0;
    let previousRowCount = 0;
    let noNewDataCount = 0; // Track consecutive failures to load new data
    
    while (clickCount < this.maxRetries) {
      const currentRowCount = this.getTableRows().length;
      console.log(`Current row count: ${currentRowCount}`);
      
      // Check if we've reached our date range end
      if (this.hasReachedDateRangeEnd()) {
        console.log('Reached end of date range, stopping data loading');
        break;
      }
      
      // Try to find and click "See more" button
      const clicked = await this.clickSeeMore();
      
      if (!clicked) {
        console.log('No more "See more" button found, assuming all data is loaded');
        break;
      }
      
      clickCount++;
      console.log(`Clicked "See more" ${clickCount} times`);
      
      // Wait for new data to load
      const newDataLoaded = await this.waitForNewData(currentRowCount);
      
      if (!newDataLoaded) {
        noNewDataCount++;
        console.log(`No new data loaded after click ${clickCount}`);
        
        if (noNewDataCount >= 3) {
          console.log('No new data loaded for 3 consecutive attempts, stopping');
          break;
        }
      } else {
        noNewDataCount = 0; // Reset counter if new data was loaded
      }
      
      previousRowCount = currentRowCount;
      
      // Small delay between clicks to be respectful to the server
      await new Promise(resolve => setTimeout(resolve, this.waitTime));
    }
    
    const finalRowCount = this.getTableRows().length;
    console.log(`Finished loading data. Total clicks: ${clickCount}, Final row count: ${finalRowCount}`);
    
    return finalRowCount;
  }

  extractTripData() {
    const trips = [];
    const tableRows = this.getTableRows();
    
    if (tableRows.length === 0) {
      console.log('No trip rows found - page may still be loading');
      return null;
    }

    console.log(`Processing ${tableRows.length} rows...`);

    tableRows.forEach((row, index) => {
      try {
        const cells = row.querySelectorAll('td');
        if (cells.length < 10) {
          return;
        }

        // Extract data from each cell based on the table structure
        const startDate = cells[1]?.textContent?.trim() || '';
        const crnNumber = cells[2]?.textContent?.trim() || '';
        const city = cells[3]?.textContent?.trim() || '';
        const customerName = cells[4]?.textContent?.trim() || '';
        const phoneNumber = cells[5]?.textContent?.trim() || '';
        const vehicle = cells[6]?.textContent?.trim() || '';
        
        // Extract order status
        const orderStatusDiv = cells[7]?.querySelector('.c-order-status div') || cells[7]?.querySelector('div');
        const orderStatus = orderStatusDiv?.textContent?.trim() || cells[7]?.textContent?.trim() || '';
        
        // Extract payment status
        const paymentStatusDiv = cells[8]?.querySelector('.c-order-payment-status .status') || cells[8]?.querySelector('.status') || cells[8]?.querySelector('div');
        const paymentStatus = paymentStatusDiv?.textContent?.trim() || cells[8]?.textContent?.trim() || '';
        
        // Extract amount
        const amountCell = cells[9];
        const amountText = amountCell?.textContent?.trim() || '₹ 0';
        const cleanAmount = amountText.replace(/[₹,\s]/g, '');

        // Check if date is in range (if range is set)
        if (startDate && this.isDateInRange(startDate)) {
          trips.push({
            extractedAt: new Date().toISOString(),
            startDate: startDate,
            crnNumber: crnNumber,
            city: city,
            customerName: customerName,
            phoneNumber: phoneNumber,
            vehicle: vehicle,
            orderStatus: orderStatus,
            paymentStatus: paymentStatus,
            amount: cleanAmount,
            amountFormatted: amountText,
            rowIndex: index + 1
          });
        }
      } catch (error) {
        console.error(`Error processing row ${index + 1}:`, error);
      }
    });

    console.log(`Total trips found in date range: ${trips.length}`);
    return trips;
  }

  generateCSV(trips) {
    if (!trips || trips.length === 0) {
      return 'No data found for the selected date range';
    }

    // CSV headers
    const headers = [
      'Start Date',
      'CRN Number', 
      'City',
      'Customer Name',
      'Phone Number',
      'Vehicle',
      'Order Status',
      'Payment Status',
      'Amount',
      'Extracted At'
    ];

    // Convert trips to CSV rows
    const csvRows = [headers.join(',')];
    
    trips.forEach(trip => {
      const row = [
        trip.startDate,
        trip.crnNumber,
        trip.city,
        `"${trip.customerName}"`, // Quote names in case they contain commas
        trip.phoneNumber,
        trip.vehicle,
        trip.orderStatus,
        trip.paymentStatus,
        trip.amount,
        trip.extractedAt
      ];
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  }

  downloadCSV(csvContent, filename) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }

  async runExtraction(startDate, endDate) {
    console.log('Starting Porter trip data extraction...');
    console.log('Date range:', startDate, 'to', endDate);
    
    this.setDateRange(startDate, endDate);
    
    // Wait for page to load completely
    if (document.readyState !== 'complete') {
      await new Promise(resolve => {
        window.addEventListener('load', resolve);
      });
    }

    // Additional wait for dynamic content
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Load all data by clicking "See more" until no more data or date range is complete
    const totalRows = await this.loadAllData();
    console.log(`Loaded ${totalRows} total rows`);

    // Extract trip data from all loaded rows
    const trips = this.extractTripData();
    
    if (trips && trips.length > 0) {
      console.log(`Found ${trips.length} trips in date range`);
      
      // Generate CSV
      const csvContent = this.generateCSV(trips);
      
      // Create filename with date range
      const startFormatted = startDate ? startDate.replace(/-/g, '') : 'all';
      const endFormatted = endDate ? endDate.replace(/-/g, '') : 'all';
      const filename = `porter_trips_${startFormatted}_to_${endFormatted}.csv`;
      
      // Download CSV
      this.downloadCSV(csvContent, filename);
      
      return { success: true, count: trips.length, totalRowsLoaded: totalRows };
    } else {
      console.log('No trips found in the specified date range');
      return { success: false, message: 'No trips found in date range', totalRowsLoaded: totalRows };
    }
  }
}

// Initialize when content script loads
if (typeof window !== 'undefined' && window.location.hostname === 'pfe.porter.in') {
  const extractor = new PorterTripExtractor();
  
  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'extractTrips') {
      extractor.runExtraction(message.startDate, message.endDate).then(result => {
        sendResponse(result);
      });
      return true; // Keep message channel open for async response
    }
  });
}
