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

  parseDate(dateString) {
    // Convert DD/MM/YYYY to Date object
    const [day, month, year] = dateString.split('/');
    return new Date(2000 + parseInt(year), parseInt(month) - 1, parseInt(day));
  }

  isDateInRange(dateString) {
    if (!this.startDate || !this.endDate) return true; // If no range set, include all
    
    const tripDate = this.parseDate(dateString);
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    
    return tripDate >= start && tripDate <= end;
  }

  extractTripData() {
    const trips = [];
    
    // Look for table rows with trip data
    const tableRows = document.querySelectorAll('tr.table-row-2');
    
    if (tableRows.length === 0) {
      console.log('No trip rows found - page may still be loading');
      return null;
    }

    tableRows.forEach((row, index) => {
      try {
        const cells = row.querySelectorAll('td');
        if (cells.length < 10) return; // Ensure we have all required columns

        // Extract data from each cell based on the table structure
        const startDate = cells[1]?.textContent?.trim() || '';
        const crnNumber = cells[2]?.textContent?.trim() || '';
        const city = cells[3]?.textContent?.trim() || '';
        const customerName = cells[4]?.textContent?.trim() || '';
        const phoneNumber = cells[5]?.textContent?.trim() || '';
        const vehicle = cells[6]?.textContent?.trim() || '';
        
        // Extract order status
        const orderStatusDiv = cells[7]?.querySelector('.c-order-status div');
        const orderStatus = orderStatusDiv?.textContent?.trim() || '';
        
        // Extract payment status
        const paymentStatusDiv = cells[8]?.querySelector('.c-order-payment-status .status');
        const paymentStatus = paymentStatusDiv?.textContent?.trim() || '';
        
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
    await new Promise(resolve => setTimeout(resolve, 2000));

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
