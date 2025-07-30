// Content Script - Runs on Porter trip details pages
class PorterTripExtractor {
  constructor() {
    this.startDate = null;
    this.endDate = null;
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
      
      console.log(`Comparing dates: Trip=${tripDate.toDateString()}, Start=${start.toDateString()}, End=${end.toDateString()}`);
      console.log(`In range: ${tripDate >= start && tripDate <= end}`);
      
      return tripDate >= start && tripDate <= end;
    } catch (error) {
      console.error('Error parsing date:', porterDateString, error);
      return false;
    }
  }

  extractTripData() {
    const trips = [];
    
    // Look for table rows with trip data - try multiple selectors
    let tableRows = document.querySelectorAll('tr.table-row-2');
    
    if (tableRows.length === 0) {
      // Try alternative selectors
      tableRows = document.querySelectorAll('tr.MuiTableRow-root');
      console.log(`Found ${tableRows.length} rows with alternative selector`);
    }
    
    if (tableRows.length === 0) {
      console.log('No trip rows found - page may still be loading');
      return null;
    }

    console.log(`Processing ${tableRows.length} rows...`);

    tableRows.forEach((row, index) => {
      try {
        const cells = row.querySelectorAll('td');
        if (cells.length < 10) {
          console.log(`Row ${index + 1}: Only ${cells.length} cells, skipping`);
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

        console.log(`Row ${index + 1}: Date=${startDate}, CRN=${crnNumber}`);

        // Check if date is in range (if range is set)
        if (startDate && this.isDateInRange(startDate)) {
          console.log(`✓ Including row ${index + 1} in results`);
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
        } else {
          console.log(`✗ Excluding row ${index + 1} - date not in range or invalid`);
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
      
      return { success: true, count: trips.length };
    } else {
      console.log('No trips found in the specified date range');
      return { success: false, message: 'No trips found in date range' };
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
