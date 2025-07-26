# Porter Transaction Data Automation - Package Information

## Extension Files

- **manifest.json**: Chrome extension manifest (v3)
- **content.js**: Data extraction script for Porter pages
- **background.js**: Service worker for scheduling and notifications
- **popup.html**: Extension popup interface
- **popup.js**: Popup functionality and configuration

## GitHub Integration

- **porter-data.yml**: GitHub Actions workflow for data processing
- **data/**: Directory for storing transaction data

## Configuration Required

1. GitHub Personal Access Token with `repo` scope
2. Repository owner and name for data storage

## Installation Steps

1. Run `setup.ps1` to validate setup
2. Load extension in Chrome (developer mode)
3. Configure GitHub settings in extension popup
4. Test with Porter dashboard open

## Data Collection Schedule

- Automatic: Daily at 11:00 PM IST
- Manual: On-demand via extension popup
- Requires Porter dashboard to be open in browser

## File Structure

```
extension/
├── manifest.json       # Extension configuration
├── content.js         # Porter page data extraction
├── background.js      # Scheduling and notifications
├── popup.html        # User interface
├── popup.js          # Interface functionality
├── icon16.png        # Extension icon (16x16)
├── icon48.png        # Extension icon (48x48)
└── icon128.png       # Extension icon (128x128)
```
