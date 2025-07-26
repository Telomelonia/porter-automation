# Porter Automation Setup Guide for Mac Users 🍎

This guide will help Mac users set up the Porter Transaction Automation bot.

## Prerequisites for Mac

- **Chrome Browser** (required - Safari won't work)
- **Terminal** access (built-in)
- **GitHub Account** with repository access

## Step-by-Step Mac Setup

### 1. Download and Prepare

```bash
# Navigate to your desired folder
cd ~/Downloads  # or wherever you want the project

# If you have git, clone the repository:
git clone https://github.com/KCLogistics/porter-automation.git
cd porter-automation

# If you downloaded as ZIP, extract it and navigate to the folder
```

### 2. Run the Mac Setup Script

```bash
# Make the script executable
chmod +x setup.sh

# Run the setup validation
./setup.sh
```

The script will check all files and show you the setup instructions.

### 3. Install Chrome Extension

1. **Open Chrome** (not Safari!)
2. **Go to Extensions**: Type `chrome://extensions/` in address bar
3. **Enable Developer Mode**: Toggle the switch in top-right corner
4. **Load Extension**:
   - Click "Load unpacked"
   - Navigate to the `porter-automation/extension` folder
   - Click "Select" or "Open"
5. **Pin Extension**: Click the puzzle piece icon → pin Porter extension

### 4. Configure GitHub Settings

1. **Create GitHub Token**:

   ```
   GitHub.com → Settings → Developer settings → Personal access tokens
   → Generate new token (classic) → Select "repo" scope → Copy token
   ```

2. **Configure Extension**:
   - Click the Porter extension icon in Chrome
   - Fill in:
     - Repository Owner: `KCLogistics`
     - Repository Name: `porter-automation`
     - GitHub Token: `ghp_...` (paste your token)
   - Click "Save Config"

### 5. Test the Setup

1. **Open Porter**: Go to `https://pfe.porter.in/dashboard/payments` in Chrome
2. **Test Extraction**: Click Porter extension icon → "Extract Now"
3. **Check Status**: Extension should show success/failure status

## Mac-Specific Features

### Notifications Setup

```bash
# Enable Chrome notifications in System Preferences
System Preferences → Notifications & Focus → Google Chrome
# Set to "Allow notifications" and choose "Alerts" style
```

### Automatic Daily Runs

- Extension runs automatically at 11:00 PM IST daily
- Chrome can be minimized (doesn't need to be active window)
- Porter tab should be open in background

### Terminal Commands for Troubleshooting

```bash
# Check if Chrome is running
ps aux | grep Chrome

# View system logs for Chrome
log show --predicate 'process == "Google Chrome"' --last 1h

# Check file permissions
ls -la setup.sh

# Make script executable if needed
chmod +x setup.sh
```

## Mac Keyboard Shortcuts

- **Developer Tools**: `Cmd + Option + I`
- **Extensions Page**: `Cmd + Shift + Delete` → Extensions
- **Chrome Settings**: `Cmd + ,`

## Common Mac Issues & Solutions

### Issue: "setup.sh: Permission denied"

```bash
chmod +x setup.sh
./setup.sh
```

### Issue: Chrome notifications not working

1. System Preferences → Security & Privacy → Privacy
2. Select "Notifications" → Add Chrome if not listed
3. Enable notifications for Chrome

### Issue: Extension not loading

1. Completely quit Chrome: `Cmd + Q`
2. Restart Chrome
3. Go to `chrome://extensions/`
4. Refresh the page
5. Try loading the extension again

### Issue: Can't find extension folder

```bash
# Navigate to the correct folder
cd ~/Downloads/porter-automation  # or your download location
ls -la extension/  # Should show manifest.json and other files
```

## Security Notes for Mac

- GitHub token is stored in Chrome's encrypted keychain
- Extension only runs on Porter pages
- All communication is over HTTPS
- No data stored locally on your Mac

## Automation Schedule

The bot automatically runs:

- **Time**: 11:00 PM IST (India Standard Time)
- **Frequency**: Daily
- **Requirements**: Chrome open with Porter tab

## File Structure on Mac

```
porter-automation/
├── setup.sh              # Mac setup script ✅
├── setup.ps1             # Windows setup script
├── extension/             # Chrome extension files
│   ├── manifest.json
│   ├── content.js
│   ├── background.js
│   ├── popup.html
│   └── popup.js
├── .github/workflows/     # GitHub automation
└── data/                  # Transaction storage
```

## Need Help?

1. **Check Extension Status**: Click extension icon for current status
2. **View Browser Console**: `Cmd + Option + I` → Console tab
3. **Check GitHub Actions**: Go to your repository → Actions tab
4. **Test Manual Extraction**: Use "Extract Now" button in extension

## Success Indicators

✅ Extension loads without errors  
✅ GitHub token configuration saves  
✅ Manual extraction works  
✅ Data appears in GitHub repository  
✅ Automatic daily notifications work

Your Porter automation bot is now ready to work 24/7 on your Mac! 🚀
