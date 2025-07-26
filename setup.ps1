# Porter Extension Setup Script

Write-Host "Setting up Porter Transaction Automation Extension..." -ForegroundColor Green

# Check if we're in the right directory
if (-not (Test-Path "extension\manifest.json")) {
  Write-Host "Error: Please run this script from the porter-automation root directory" -ForegroundColor Red
  exit 1
}

Write-Host "`n1. Creating icon placeholders..." -ForegroundColor Yellow

# Create simple icon placeholders (you should replace these with actual icons)
$iconSizes = @(16, 48, 128)

foreach ($size in $iconSizes) {
  $iconPath = "extension\icon$size.png"
  if (-not (Test-Path $iconPath)) {
    # Create a simple placeholder file
    # In production, you should use actual PNG icon files
    "PNG placeholder for ${size}x${size} icon" | Out-File -FilePath $iconPath -Encoding ASCII
    Write-Host "  Created placeholder: $iconPath" -ForegroundColor Gray
  }
}

Write-Host "`n2. Validating extension files..." -ForegroundColor Yellow

$requiredFiles = @(
  "extension\manifest.json",
  "extension\content.js",
  "extension\background.js", 
  "extension\popup.html",
  "extension\popup.js"
)

$missingFiles = @()
foreach ($file in $requiredFiles) {
  if (-not (Test-Path $file)) {
    $missingFiles += $file
  }
  else {
    Write-Host "  checkmark $file" -ForegroundColor Green
  }
}

if ($missingFiles.Count -gt 0) {
  Write-Host "`nMissing files:" -ForegroundColor Red
  foreach ($file in $missingFiles) {
    Write-Host "  x $file" -ForegroundColor Red
  }
  exit 1
}

Write-Host "`n3. Checking GitHub Actions workflow..." -ForegroundColor Yellow

if (Test-Path ".github\workflows\porter-data.yml") {
  Write-Host "  checkmark GitHub Actions workflow found" -ForegroundColor Green
}
else {
  Write-Host "  x GitHub Actions workflow missing" -ForegroundColor Red
}

Write-Host "`n4. Setup Instructions:" -ForegroundColor Cyan
Write-Host "   a) Open Chrome and go to chrome://extensions/" -ForegroundColor White
Write-Host "   b) Enable 'Developer mode' (toggle in top right)" -ForegroundColor White
Write-Host "   c) Click 'Load unpacked' and select the 'extension' folder" -ForegroundColor White
Write-Host "   d) Configure GitHub settings in the extension popup" -ForegroundColor White

Write-Host "`n5. GitHub Token Setup:" -ForegroundColor Cyan
Write-Host "   a) Go to GitHub Settings -> Developer settings -> Personal access tokens" -ForegroundColor White
Write-Host "   b) Generate new token (classic) with 'repo' scope" -ForegroundColor White
Write-Host "   c) Copy the token and paste it in the extension popup" -ForegroundColor White

Write-Host "`n6. Testing:" -ForegroundColor Cyan
Write-Host "   a) Open https://pfe.porter.in/dashboard/payments in Chrome" -ForegroundColor White
Write-Host "   b) Click the extension icon and configure GitHub settings" -ForegroundColor White
Write-Host "   c) Click 'Extract Now' to test manual extraction" -ForegroundColor White

Write-Host "`nSetup complete! 🎉" -ForegroundColor Green
Write-Host "Extension is ready for installation in Chrome." -ForegroundColor White
