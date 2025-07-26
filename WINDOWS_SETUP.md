# Porter Automation Setup Guide for Windows Users 🪟

This guide will help Windows users set up the Porter Transaction Automation bot.

## Prerequisites for Windows

- **Chrome Browser** (required - Edge won't work)
- **PowerShell** (built-in Windows 10/11)
- **GitHub Account** with repository access

## Step-by-Step Windows Setup

### 1. Download and Prepare

```powershell
# Navigate to your desired folder (Downloads, Documents, etc.)
cd C:\Users\$env:USERNAME\Downloads

# If you have git, clone the repository:
git clone https://github.com/KCLogistics/porter-automation.git
cd porter-automation

# If you downloaded as ZIP, extract it and navigate to the folder
```

### 2. Run the Windows Setup Script

```powershell
# Run the setup validation
.\setup.ps1
```

**If you get an execution policy error**:

```powershell
# Temporarily allow script execution
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\setup.ps1
# Restore security after setup
Set-ExecutionPolicy -ExecutionPolicy Restricted -Scope CurrentUser
```

### 3. Install Chrome Extension

1. **Open Chrome** (not Edge!)
2. **Go to Extensions**: Type `chrome://extensions/` in address bar
3. **Enable Developer Mode**: Toggle the switch in top-right corner
4. **Load Extension**:
   - Click "Load unpacked"
   - Navigate to the `porter-automation\extension` folder
   - Click "Select Folder"
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

## Windows-Specific Features

### Notifications Setup

- Windows 10/11 notifications appear in Action Center
- Chrome notifications are automatically enabled
- No additional setup required

### Automatic Daily Runs

- Extension runs automatically at 11:00 PM IST daily
- Chrome can be minimized to system tray
- Porter tab should be open in background

### PowerShell Commands for Troubleshooting

```powershell
# Check if Chrome is running
Get-Process -Name "chrome" -ErrorAction SilentlyContinue

# View Chrome processes
tasklist | findstr chrome

# Check file permissions
Get-ChildItem .\extension\ -Recurse

# Test network connectivity
Test-NetConnection github.com -Port 443
```

## Windows Keyboard Shortcuts

- **Developer Tools**: `F12` or `Ctrl + Shift + I`
- **Extensions Page**: `Ctrl + Shift + Delete` → Extensions
- **Chrome Settings**: `Alt + F` → Settings

## Common Windows Issues & Solutions

### Issue: "Execution Policy" Error

```powershell
# Solution 1: Temporary bypass
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
.\setup.ps1

# Solution 2: Allow current user
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\setup.ps1

# Solution 3: Run directly
powershell -ExecutionPolicy Bypass -File .\setup.ps1
```

### Issue: Chrome notifications not working

1. Windows Settings → System → Notifications & actions
2. Turn on "Get notifications from apps and other senders"
3. Scroll down and enable notifications for Chrome

### Issue: Extension not loading

1. Close Chrome completely (check system tray)
2. Restart Chrome as Administrator (right-click Chrome → "Run as administrator")
3. Go to `chrome://extensions/`
4. Try loading the extension again

### Issue: Can't find extension folder

```powershell
# Navigate to the correct folder
cd .\porter-automation  # Your download location
dir .\extension\  # Should show manifest.json and other files
```

### Issue: GitHub API access blocked

- Check if corporate firewall is blocking github.com
- Try using mobile hotspot to test
- Contact IT department if needed

## Windows Firewall & Antivirus

```powershell
# If Windows Defender blocks the extension:
# 1. Windows Security → Virus & threat protection
# 2. Exclusions → Add folder → Select porter-automation folder

# Allow Chrome through Windows Firewall:
# Windows Settings → Network & Internet → Windows Firewall
# → Allow an app through firewall → Chrome
```

## File Structure on Windows

```
porter-automation\
├── setup.ps1             # Windows setup script ✅
├── setup.sh              # Mac/Linux setup script
├── extension\             # Chrome extension files
│   ├── manifest.json
│   ├── content.js
│   ├── background.js
│   ├── popup.html
│   └── popup.js
├── .github\workflows\     # GitHub automation
└── data\                  # Transaction storage
```

## Automation Schedule

The bot automatically runs:

- **Time**: 11:00 PM IST (India Standard Time)
- **Frequency**: Daily
- **Requirements**: Chrome open with Porter tab

## Registry & System Integration

The extension integrates with Windows:

- Chrome extension storage uses Windows encrypted APIs
- Notifications appear in Windows Action Center
- Runs as low-priority background process

## Performance Optimization

```powershell
# Check Chrome memory usage
Get-Process chrome | Select-Object ProcessName, WorkingSet, CPU

# Optimize Chrome for background running
# Chrome Settings → Advanced → System →
# ✅ "Continue running background apps when Chrome is closed"
```

## Need Help?

1. **Check Extension Status**: Click extension icon for current status
2. **View Browser Console**: `F12` → Console tab
3. **Check GitHub Actions**: Go to your repository → Actions tab
4. **Test Manual Extraction**: Use "Extract Now" button in extension
5. **Windows Event Viewer**: Check for Chrome-related errors

## Success Indicators

✅ Extension loads without errors  
✅ GitHub token configuration saves  
✅ Manual extraction works  
✅ Data appears in GitHub repository  
✅ Windows notifications appear

Your Porter automation bot is now ready to work 24/7 on Windows! 🚀
