# Porter Trip Data Scraper

Simple Chrome extension to extract trip data from Porter dashboard to CSV.

## Setup

1. Open Chrome → `chrome://extensions/`
2. Enable "Developer mode"
   ![alt text](image.png)
3. Click "Load unpacked" → Select the project `extension` folder as seen in the root dir
   ![alt text](image-1.png)
4. Open Porter trip details page: `https://pfe.porter.in/dashboard/trip_details` and reload the page, in case
5. Click extension icon → Select date range → Extract to CSV

## Features

- Date range selection
- Extracts: Start Date, CRN, City, Customer, Phone, Vehicle, Status, Payment, Amount
- Downloads as CSV file automatically
- No external dependencies or configuration needed
