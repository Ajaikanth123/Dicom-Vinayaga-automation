# PowerShell Script to Add Users to Firebase
# Run this in PowerShell: .\run-these-commands.ps1

Write-Host "🚀 Adding users to Firebase Realtime Database..." -ForegroundColor Cyan
Write-Host ""

# Add Ramanathapuram User
Write-Host "📝 Adding Ramanathapuram user..." -ForegroundColor Yellow
$body1 = @{
    email = "3danbudentalscansramnadu@gmail.com"
    name = "ANBU Ramanathapuram"
    role = "branch-user"
    assignedBranch = "ramanathapuram"
    branchName = "ANBU Ramanathapuram"
    branchDisplayName = "Ramanathapuram"
    createdAt = (Get-Date).ToString("o")
} | ConvertTo-Json

try {
    $result1 = Invoke-RestMethod -Uri "https://nice4-d7886-default-rtdb.asia-southeast1.firebasedatabase.app/users/AC2pyfRushhIrWsk4FUQfRIboJc2.json" -Method Put -Body $body1 -ContentType "application/json"
    Write-Host "   ✅ Ramanathapuram user added!" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Error: $_" -ForegroundColor Red
}

Write-Host ""

# Add Hosur User
Write-Host "📝 Adding Hosur user..." -ForegroundColor Yellow
$body2 = @{
    email = "3danbuscanshosur@gmail.com"
    name = "ANBU Hosur"
    role = "branch-user"
    assignedBranch = "hosur"
    branchName = "ANBU Hosur"
    branchDisplayName = "Hosur"
    createdAt = (Get-Date).ToString("o")
} | ConvertTo-Json

try {
    $result2 = Invoke-RestMethod -Uri "https://nice4-d7886-default-rtdb.asia-southeast1.firebasedatabase.app/users/9saCUKmPqNR8bfnFhGGj6htfWoP2.json" -Method Put -Body $body2 -ContentType "application/json"
    Write-Host "   ✅ Hosur user added!" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Error: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "⚠️  ADMIN USER SETUP REQUIRED:" -ForegroundColor Yellow
Write-Host "   1. Go to Firebase Console → Authentication" -ForegroundColor White
Write-Host "   2. Add user: anbudentalscans@gmail.com" -ForegroundColor White
Write-Host "   3. Copy the UID" -ForegroundColor White
Write-Host "   4. Run this command (replace YOUR_ADMIN_UID):" -ForegroundColor White
Write-Host ""
Write-Host '   $adminBody = @{' -ForegroundColor Cyan
Write-Host '       email = "anbudentalscans@gmail.com"' -ForegroundColor Cyan
Write-Host '       name = "Admin User"' -ForegroundColor Cyan
Write-Host '       role = "admin"' -ForegroundColor Cyan
Write-Host '       isAdmin = $true' -ForegroundColor Cyan
Write-Host '       canSelectBranches = $true' -ForegroundColor Cyan
Write-Host '       createdAt = (Get-Date).ToString("o")' -ForegroundColor Cyan
Write-Host '   } | ConvertTo-Json' -ForegroundColor Cyan
Write-Host ""
Write-Host '   Invoke-RestMethod -Uri "https://nice4-d7886-default-rtdb.asia-southeast1.firebasedatabase.app/users/YOUR_ADMIN_UID.json" -Method Put -Body $adminBody -ContentType "application/json"' -ForegroundColor Cyan
Write-Host ""

# Verify
Write-Host "🔍 Verifying users..." -ForegroundColor Cyan
try {
    $users = Invoke-RestMethod -Uri "https://nice4-d7886-default-rtdb.asia-southeast1.firebasedatabase.app/users.json" -Method Get
    Write-Host ""
    Write-Host "✅ Users in database:" -ForegroundColor Green
    $users.PSObject.Properties | ForEach-Object {
        Write-Host "   - $($_.Value.name) ($($_.Value.email))" -ForegroundColor White
    }
} catch {
    Write-Host "   ❌ Could not verify: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 Done! Check Firebase Console to verify." -ForegroundColor Green
Write-Host "   URL: https://console.firebase.google.com/project/nice4-d7886/database" -ForegroundColor White
