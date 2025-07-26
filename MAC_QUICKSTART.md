# Quick Start for Mac Users 🍎

## TL;DR Setup (5 minutes)

```bash
# 1. Download and setup
cd ~/Downloads
# Extract porter-automation.zip or clone from GitHub
cd porter-automation

# 2. Run Mac setup script
chmod +x setup.sh
./setup.sh

# 3. Install in Chrome
# Open Chrome → chrome://extensions/ → Enable Developer Mode → Load Unpacked → Select 'extension' folder

# 4. Configure GitHub
# Extension popup → Enter GitHub repo details and token → Save

# 5. Test
# Open Porter dashboard → Click extension → "Extract Now"
```

## What the Bot Does on Mac

- ✅ **Runs automatically at 11 PM IST daily**
- ✅ **Works in background** (Chrome can be minimized)
- ✅ **macOS notifications** in Notification Center
- ✅ **Secure token storage** in Chrome's encrypted storage
- ✅ **Auto-commits data** to GitHub repository

## Mac-Specific Benefits

- **Native Notifications**: Integrates with macOS Notification Center
- **Background Processing**: Runs even when Chrome is minimized
- **Keychain Security**: Uses macOS security features
- **Low Resource Usage**: Minimal impact on Mac performance

## Files Created for Mac Users

- `setup.sh` - Mac setup validation script
- `MAC_SETUP.md` - Detailed Mac instructions
- Standard Chrome extension files (cross-platform)

## Daily Workflow (Zero Maintenance)

1. **11:00 PM**: Bot automatically wakes up
2. **Check**: Looks for Porter tab in Chrome
3. **Extract**: Scrapes today's transaction data
4. **Upload**: Sends to GitHub via API
5. **Notify**: Shows macOS notification with results
6. **Sleep**: Waits until tomorrow

That's it! Your Mac will now automatically collect Porter data every day. 🚀

For detailed troubleshooting and advanced setup, see [MAC_SETUP.md](MAC_SETUP.md)
