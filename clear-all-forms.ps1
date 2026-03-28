# PowerShell Script to Clear All Forms from Firebase
# This will DELETE all forms data but keep users data
# Run this in PowerShell: .\clear-all-forms.ps1

Write-Host "⚠️  WARNING: This will DELETE ALL FORMS from Firebase!" -ForegroundColor Red
Write-Host ""
$confirmation = Read-Host "Are you sure you want to continue? Type 'YES' to confirm"

if ($confirmation -ne "YES") {
    Write-Host "❌ Operation cancelled." -ForegroundColor Yellow
    exit
}

Write-Host ""
Write-Host "🗑️  Clearing all forms from Firebase..." -ForegroundColor Cyan
Write-Host ""

try {
    # Delete all forms (using correct Asia Southeast region URL)
    $result = Invoke-RestMethod -Uri "https://nice4-d7886-default-rtdb.asia-southeast1.firebasedatabase.app/forms.json" -Method Delete
    
    Write-Host "✅ All forms deleted successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 What was deleted:" -ForegroundColor Yellow
    Write-Host "   - All forms from all branches" -ForegroundColor White
    Write-Host "   - ANBU-HSR forms" -ForegroundColor White
    Write-Host "   - ANBU-SLM-GUG forms" -ForegroundColor White
    Write-Host "   - salem-gugai forms (if any)" -ForegroundColor White
    Write-Host "   - salem-lic forms (if any)" -ForegroundColor White
    Write-Host "   - ramanathapuram forms (if any)" -ForegroundColor White
    Write-Host "   - hosur forms (if any)" -ForegroundColor White
    Write-Host ""
    Write-Host "✅ Users data is still intact!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 Done! Your database is now clean." -ForegroundColor Green
    Write-Host "   You can start fresh with new forms." -ForegroundColor White
    
} catch {
    Write-Host "❌ Error deleting forms: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Possible reasons:" -ForegroundColor Yellow
    Write-Host "   - Database rules don't allow deletion" -ForegroundColor White
    Write-Host "   - Network connection issue" -ForegroundColor White
    Write-Host "   - Forms node doesn't exist" -ForegroundColor White
}

Write-Host ""
Write-Host "🔍 Verify at: https://console.firebase.google.com/project/nice4-d7886/database" -ForegroundColor Cyan
