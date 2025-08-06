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

  async findAccordionButton(row) {
    // Multiple strategies to find the accordion button
    const strategies = [
      // Strategy 1: Direct class-based selectors
      () => row.querySelector('.accordion-row-button'),
      () => row.querySelector('[class*="accordion"]'),
      () => row.querySelector('.MuiSvgIcon-root.active'),
      
      // Strategy 2: SVG-based selectors (from your HTML example)
      () => row.querySelector('svg[viewBox="0 0 24 24"]'),
      () => row.querySelector('svg.MuiSvgIcon-root'),
      
      // Strategy 3: Look for clickable elements that might expand rows
      () => {
        const clickables = row.querySelectorAll('[role="button"], button, [onclick]');
        for (const el of clickables) {
          const parent = el.closest('td');
          if (parent && (el.querySelector('svg') || el.innerHTML.includes('▼') || el.innerHTML.includes('▲'))) {
            return el;
          }
        }
        return null;
      },
      
      // Strategy 4: Look in table cells for any expandable elements
      () => {
        const cells = row.querySelectorAll('td');
        for (const cell of cells) {
          const svgElements = cell.querySelectorAll('svg');
          for (const svg of svgElements) {
            // Look for expand/collapse icons
            const pathElement = svg.querySelector('path');
            if (pathElement) {
              const pathData = pathElement.getAttribute('d');
              // These are common expand/collapse icon paths
              if (pathData && (
                pathData.includes('L12 13.17') || // Your example path
                pathData.includes('l4.59-4.58') ||
                pathData.includes('M7.41') ||
                pathData.includes('chevron') ||
                pathData.includes('expand')
              )) {
                // Find the clickable parent
                let clickable = svg;
                while (clickable && clickable !== row) {
                  if (clickable.onclick || clickable.getAttribute('role') === 'button' || 
                      clickable.tagName === 'BUTTON' || clickable.style.cursor === 'pointer') {
                    return clickable;
                  }
                  clickable = clickable.parentElement;
                }
                return svg; // Return the SVG as fallback
              }
            }
          }
        }
        return null;
      },
      
      // Strategy 5: Look for any element that might be clickable to expand
      () => {
        const allElements = row.querySelectorAll('*');
        for (const el of allElements) {
          const style = window.getComputedStyle(el);
          if (style.cursor === 'pointer' && el.querySelector('svg')) {
            return el;
          }
        }
        return null;
      }
    ];

    // Try each strategy
    for (let i = 0; i < strategies.length; i++) {
      try {
        const button = strategies[i]();
        if (button) {
          console.log(`Found accordion button using strategy ${i + 1}:`, button);
          return button;
        }
      } catch (error) {
        console.log(`Strategy ${i + 1} failed:`, error);
      }
    }

    // Final fallback: click anywhere on the row that might be clickable
    console.log('No specific button found, trying row-level click');
    return row;
  }

  async clickAccordion(row, index) {
    console.log(`\n=== Processing Row ${index + 1} ===`);
    
    // First check if accordion is already expanded
    let accordionContent = row.querySelector('.c-table-row-accordion') || 
                          row.nextElementSibling?.querySelector('.c-table-row-accordion');
    
    if (accordionContent) {
      console.log(`Row ${index + 1}: Accordion already expanded, skipping click`);
      return true;
    }

    const accordionButton = await this.findAccordionButton(row);
    
    if (!accordionButton) {
      console.log(`Row ${index + 1}: No accordion button found`);
      // Try clicking on the row itself as last resort
      try {
        row.click();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        accordionContent = row.querySelector('.c-table-row-accordion') || 
                          row.nextElementSibling?.querySelector('.c-table-row-accordion');
        
        if (accordionContent) {
          console.log(`Row ${index + 1}: Row click worked!`);
          return true;
        }
      } catch (error) {
        console.log(`Row ${index + 1}: Row click failed:`, error);
      }
      return false;
    }

    // Try multiple click attempts with different methods
    const clickMethods = [
      () => accordionButton.click(),
      () => {
        const clickEvent = new MouseEvent('click', {
          view: window,
          bubbles: true,
          cancelable: true
        });
        accordionButton.dispatchEvent(clickEvent);
      },
      () => {
        const clickEvent = new Event('click', { bubbles: true });
        accordionButton.dispatchEvent(clickEvent);
      },
      () => {
        // Try focusing and pressing Enter
        if (accordionButton.focus) accordionButton.focus();
        const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
        accordionButton.dispatchEvent(enterEvent);
      }
    ];

    for (let attempt = 0; attempt < clickMethods.length; attempt++) {
      try {
        console.log(`Row ${index + 1}: Trying click method ${attempt + 1}`);
        
        clickMethods[attempt]();
        
        // Wait and check if accordion expanded
        for (let check = 0; check < 15; check++) { // Check for up to 4.5 seconds
          await new Promise(resolve => setTimeout(resolve, 300));
          
          accordionContent = row.querySelector('.c-table-row-accordion') || 
                           row.nextElementSibling?.querySelector('.c-table-row-accordion');
          
          if (accordionContent) {
            console.log(`Row ${index + 1}: Accordion expanded successfully with method ${attempt + 1} after ${(check + 1) * 300}ms`);
            
            // Scroll the accordion into view to ensure it's fully loaded
            accordionContent.scrollIntoView({ behavior: 'instant', block: 'center' });
            await new Promise(resolve => setTimeout(resolve, 200));
            
            return true;
          }
        }
        
        console.log(`Row ${index + 1}: Method ${attempt + 1} failed to expand accordion`);
        
      } catch (error) {
        console.log(`Row ${index + 1}: Click method ${attempt + 1} threw error:`, error);
      }
    }
    
    console.log(`Row ${index + 1}: All click methods failed`);
    return false;
  }

  extractAccordionData(row) {
    // Look for the expanded accordion content - try multiple approaches
    let accordionContent = row.querySelector('.c-table-row-accordion');
    
    if (!accordionContent) {
      // Check next sibling row (accordion might be in separate row)
      const nextRow = row.nextElementSibling;
      if (nextRow && nextRow.querySelector('.c-table-row-accordion')) {
        accordionContent = nextRow.querySelector('.c-table-row-accordion');
      }
    }
    
    if (!accordionContent) {
      console.log('No accordion content found');
      return {};
    }

    const accordionData = {};
    console.log('Extracting accordion data...');

    try {
      // Extract pickup information - first timeline location
      const timelineLocations = accordionContent.querySelectorAll('.timeline-location');
      if (timelineLocations.length >= 1) {
        const pickupLocation = timelineLocations[0];
        const pickupTime = pickupLocation.querySelector('.time')?.textContent?.trim() || '';
        const pickupAddress = pickupLocation.querySelector('.address')?.textContent?.trim() || '';
        accordionData.pickupTime = pickupTime;
        accordionData.pickupAddress = pickupAddress;
        console.log('Pickup extracted:', { pickupTime, pickupAddress });
      }

      // Extract dropoff information - second timeline location
      if (timelineLocations.length >= 2) {
        const dropoffLocation = timelineLocations[1];
        const dropoffTime = dropoffLocation.querySelector('.time')?.textContent?.trim() || '';
        const dropoffAddress = dropoffLocation.querySelector('.address')?.textContent?.trim() || '';
        accordionData.dropoffTime = dropoffTime;
        accordionData.dropoffAddress = dropoffAddress;
        console.log('Dropoff extracted:', { dropoffTime, dropoffAddress });
      }

      // Extract receiver details
      const receiverSection = accordionContent.querySelector('.receiver-column .contacts .content');
      if (receiverSection) {
        const receiverName = receiverSection.querySelector('.name')?.textContent?.trim() || '';
        const receiverMobile = receiverSection.querySelector('.mobile')?.textContent?.trim() || '';
        accordionData.receiverName = receiverName;
        accordionData.receiverMobile = receiverMobile;
        console.log('Receiver extracted:', { receiverName, receiverMobile });
      }

      // Extract other details - be more specific with selectors
      const infoColumn = accordionContent.querySelector('.info-column');
      if (infoColumn) {
        const columnItems = infoColumn.querySelectorAll('.column__item');
        
        columnItems.forEach(item => {
          const title = item.querySelector('.title')?.textContent?.trim().toLowerCase() || '';
          const content = item.querySelector('.content')?.textContent?.trim() || '';
          
          if (title.includes('duration')) {
            accordionData.duration = content;
            console.log('Duration extracted:', content);
          } else if (title.includes('distance')) {
            accordionData.distance = content;
            console.log('Distance extracted:', content);
          } else if (title.includes('comment')) {
            accordionData.additionalComments = content;
            console.log('Comments extracted:', content);
          }
        });
      }

      // Extract invoice link
      const invoiceLink = accordionContent.querySelector('.invoice-section a');
      if (invoiceLink) {
        accordionData.invoiceUrl = invoiceLink.href || '';
        console.log('Invoice URL extracted:', accordionData.invoiceUrl);
      }

    } catch (error) {
      console.error('Error extracting accordion data:', error);
    }

    console.log('Final accordion data:', accordionData);
    return accordionData;
  }

  async extractTripData() {
    const trips = [];
    const tableRows = this.getTableRows();
    
    if (tableRows.length === 0) {
      console.log('No trip rows found - page may still be loading');
      return null;
    }

    console.log(`\n🚀 STARTING ACCORDION EXTRACTION FOR ${tableRows.length} ROWS 🚀`);

    for (let index = 0; index < tableRows.length; index++) {
      const row = tableRows[index];
      
      try {
        const cells = row.querySelectorAll('td');
        if (cells.length < 10) {
          console.log(`Row ${index + 1}: Only ${cells.length} cells, skipping`);
          continue;
        }

        // Extract basic data from table cells
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
          console.log(`\n📋 PROCESSING ROW ${index + 1}/${tableRows.length}`);
          console.log(`   Date: ${startDate}, CRN: ${crnNumber}, Status: ${orderStatus}/${paymentStatus}`);
          
          // Initialize trip data with basic info
          const tripData = {
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
          };
          
          // Try to expand accordion and get additional details
          console.log(`   🔍 Attempting accordion expansion...`);
          const accordionExpanded = await this.clickAccordion(row, index);
          
          if (accordionExpanded) {
            console.log(`   ✅ Accordion expanded! Extracting detailed data...`);
            
            // Wait a bit more for content to fully render
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const accordionData = this.extractAccordionData(row);
            
            // Merge accordion data
            Object.assign(tripData, accordionData);
            
            console.log(`   📊 Extracted accordion fields:`, Object.keys(accordionData));
            
            // Optionally close accordion to keep UI clean
            setTimeout(() => {
              try {
                this.clickAccordion(row, index);
              } catch (e) {
                // Ignore errors when closing
              }
            }, 100);
            
          } else {
            console.log(`   ❌ Failed to expand accordion for row ${index + 1}`);
            
            // Set empty accordion fields
            Object.assign(tripData, {
              pickupTime: '',
              pickupAddress: '',
              dropoffTime: '',
              dropoffAddress: '',
              receiverName: '',
              receiverMobile: '',
              duration: '',
              distance: '',
              additionalComments: '',
              invoiceUrl: ''
            });
          }

          trips.push(tripData);
          console.log(`   ✅ Row ${index + 1} added to results`);
          
        } else {
          console.log(`Row ${index + 1}: Date ${startDate} not in range, skipping`);
        }
        
      } catch (error) {
        console.error(`❌ ERROR processing row ${index + 1}:`, error);
        
        // Still add basic data even if accordion fails
        if (startDate && this.isDateInRange(startDate)) {
          trips.push({
            extractedAt: new Date().toISOString(),
            startDate: startDate,
            crnNumber: crnNumber || 'ERROR',
            city: city || '',
            customerName: customerName || '',
            phoneNumber: phoneNumber || '',
            vehicle: vehicle || '',
            orderStatus: orderStatus || '',
            paymentStatus: paymentStatus || '',
            amount: cleanAmount || '0',
            amountFormatted: amountText || '₹ 0',
            rowIndex: index + 1,
            pickupTime: 'ERROR',
            pickupAddress: 'ERROR',
            dropoffTime: 'ERROR',
            dropoffAddress: 'ERROR',
            receiverName: 'ERROR',
            receiverMobile: 'ERROR',
            duration: 'ERROR',
            distance: 'ERROR',
            additionalComments: 'ERROR',
            invoiceUrl: 'ERROR'
          });
        }
      }
      
      // Delay between rows to prevent overwhelming the page
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log(`\n🎉 EXTRACTION COMPLETE! Found ${trips.length} trips in date range`);
    
    // Summary of accordion success rate
    const successfulAccordions = trips.filter(trip => trip.pickupTime && trip.pickupTime !== '' && trip.pickupTime !== 'ERROR').length;
    const successRate = ((successfulAccordions / trips.length) * 100).toFixed(1);
    console.log(`📈 Accordion success rate: ${successfulAccordions}/${trips.length} (${successRate}%)`);
    
    return trips;
  }

  generateCSV(trips) {
    if (!trips || trips.length === 0) {
      return 'No data found for the selected date range';
    }

    // CSV headers - including new accordion fields
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
      'Pickup Time',
      'Pickup Address',
      'Dropoff Time', 
      'Dropoff Address',
      'Receiver Name',
      'Receiver Mobile',
      'Duration',
      'Distance',
      'Additional Comments',
      'Invoice URL',
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
        trip.pickupTime || '',
        `"${trip.pickupAddress || ''}"`,
        trip.dropoffTime || '',
        `"${trip.dropoffAddress || ''}"`,
        `"${trip.receiverName || ''}"`,
        trip.receiverMobile || '',
        trip.duration || '',
        trip.distance || '',
        `"${trip.additionalComments || ''}"`,
        trip.invoiceUrl || '',
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
    const trips = await this.extractTripData();
    
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
