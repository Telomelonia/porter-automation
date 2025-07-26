#!/bin/bash

# Porter Extension Setup Script for macOS/Linux

echo "🚀 Setting up Porter Transaction Automation Extension..."

# Check if we're in the right directory
if [ ! -f "extension/manifest.json" ]; then
    echo "❌ Error: Please run this script from the porter-automation root directory"
    exit 1
fi

echo ""
echo "1. Creating icon placeholders..."

# Create simple icon placeholders (you should replace these with actual icons)
icon_sizes=(16 48 128)

for size in "${icon_sizes[@]}"; do
    icon_path="extension/icon${size}.png"
    if [ ! -f "$icon_path" ]; then
        # Create a simple placeholder file
        # In production, you should use actual PNG icon files
        echo "PNG placeholder for ${size}x${size} icon" > "$icon_path"
        echo "  📁 Created placeholder: $icon_path"
    fi
done

echo ""
echo "2. Validating extension files..."

required_files=(
    "extension/manifest.json"
    "extension/content.js"
    "extension/background.js"
    "extension/popup.html"
    "extension/popup.js"
)

missing_files=()
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        missing_files+=("$file")
    else
        echo "  ✅ $file"
    fi
done

if [ ${#missing_files[@]} -gt 0 ]; then
    echo ""
    echo "❌ Missing files:"
    for file in "${missing_files[@]}"; do
        echo "  ❌ $file"
    done
    exit 1
fi

echo ""
echo "3. Checking GitHub Actions workflow..."

if [ -f ".github/workflows/porter-data.yml" ]; then
    echo "  ✅ GitHub Actions workflow found"
else
    echo "  ❌ GitHub Actions workflow missing"
fi

echo ""
echo "🔧 4. Setup Instructions for Mac:"
echo "   a) Open Chrome and go to chrome://extensions/"
echo "   b) Enable 'Developer mode' (toggle in top right)"
echo "   c) Click 'Load unpacked' and select the 'extension' folder"
echo "   d) Configure GitHub settings in the extension popup"

echo ""
echo "🔑 5. GitHub Token Setup:"
echo "   a) Go to GitHub Settings → Developer settings → Personal access tokens"
echo "   b) Generate new token (classic) with 'repo' scope"
echo "   c) Copy the token and paste it in the extension popup"

echo ""
echo "🧪 6. Testing:"
echo "   a) Open https://pfe.porter.in/dashboard/payments in Chrome"
echo "   b) Click the extension icon and configure GitHub settings"
echo "   c) Click 'Extract Now' to test manual extraction"

echo ""
echo "📱 7. Mac-Specific Notes:"
echo "   • Chrome notifications will appear in Notification Center"
echo "   • Extension runs in background even when Chrome is minimized"
echo "   • Make sure Chrome has permission to send notifications"
echo "   • Use Command+Option+I to open Developer Tools if needed"

echo ""
echo "🎉 Setup complete!"
echo "Extension is ready for installation in Chrome on macOS."
