# Quick Commands - Correct Region URL

Your database is in **Asia Southeast** region, so use this URL:
`https://nice4-d7886-default-rtdb.asia-southeast1.firebasedatabase.app`

---

## Clear All Forms (One Command)

```powershell
Invoke-RestMethod -Uri "https://nice4-d7886-default-rtdb.asia-southeast1.firebasedatabase.app/forms.json" -Method Delete
Write-Host "✅ All forms deleted!" -ForegroundColor Green
```

---

## Add Users

### Add Ramanathapuram User:
```powershell
$body = @{email="3danbudentalscansramnadu@gmail.com";name="ANBU Ramanathapuram";role="branch-user";assignedBranch="ramanathapuram";branchName="ANBU Ramanathapuram";branchDisplayName="Ramanathapuram";createdAt=(Get-Date).ToString("o")} | ConvertTo-Json
Invoke-RestMethod -Uri "https://nice4-d7886-default-rtdb.asia-southeast1.firebasedatabase.app/users/AC2pyfRushhIrWsk4FUQfRIboJc2.json" -Method Put -Body $body -ContentType "application/json"
Write-Host "✅ Ramanathapuram user added!" -ForegroundColor Green
```

### Add Hosur User:
```powershell
$body = @{email="3danbuscanshosur@gmail.com";name="ANBU Hosur";role="branch-user";assignedBranch="hosur";branchName="ANBU Hosur";branchDisplayName="Hosur";createdAt=(Get-Date).ToString("o")} | ConvertTo-Json
Invoke-RestMethod -Uri "https://nice4-d7886-default-rtdb.asia-southeast1.firebasedatabase.app/users/9saCUKmPqNR8bfnFhGGj6htfWoP2.json" -Method Put -Body $body -ContentType "application/json"
Write-Host "✅ Hosur user added!" -ForegroundColor Green
```

### Add Admin User (Replace YOUR_ADMIN_UID):
```powershell
$body = @{email="anbudentalscans@gmail.com";name="Admin User";role="admin";isAdmin=$true;canSelectBranches=$true;createdAt=(Get-Date).ToString("o")} | ConvertTo-Json
Invoke-RestMethod -Uri "https://nice4-d7886-default-rtdb.asia-southeast1.firebasedatabase.app/users/YOUR_ADMIN_UID.json" -Method Put -Body $body -ContentType "application/json"
Write-Host "✅ Admin user added!" -ForegroundColor Green
```

---

## Verify

### Check all users:
```powershell
Invoke-RestMethod -Uri "https://nice4-d7886-default-rtdb.asia-southeast1.firebasedatabase.app/users.json" -Method Get
```

### Check all forms:
```powershell
Invoke-RestMethod -Uri "https://nice4-d7886-default-rtdb.asia-southeast1.firebasedatabase.app/forms.json" -Method Get
```

---

## All-in-One: Clear Forms + Add Users

Copy and paste this entire block:

```powershell
# Clear all forms
Write-Host "🗑️  Clearing forms..." -ForegroundColor Cyan
Invoke-RestMethod -Uri "https://nice4-d7886-default-rtdb.asia-southeast1.firebasedatabase.app/forms.json" -Method Delete
Write-Host "✅ Forms cleared!" -ForegroundColor Green

# Add Ramanathapuram user
Write-Host "📝 Adding Ramanathapuram user..." -ForegroundColor Cyan
$body1 = @{email="3danbudentalscansramnadu@gmail.com";name="ANBU Ramanathapuram";role="branch-user";assignedBranch="ramanathapuram";branchName="ANBU Ramanathapuram";branchDisplayName="Ramanathapuram";createdAt=(Get-Date).ToString("o")} | ConvertTo-Json
Invoke-RestMethod -Uri "https://nice4-d7886-default-rtdb.asia-southeast1.firebasedatabase.app/users/AC2pyfRushhIrWsk4FUQfRIboJc2.json" -Method Put -Body $body1 -ContentType "application/json"
Write-Host "✅ Ramanathapuram user added!" -ForegroundColor Green

# Add Hosur user
Write-Host "📝 Adding Hosur user..." -ForegroundColor Cyan
$body2 = @{email="3danbuscanshosur@gmail.com";name="ANBU Hosur";role="branch-user";assignedBranch="hosur";branchName="ANBU Hosur";branchDisplayName="Hosur";createdAt=(Get-Date).ToString("o")} | ConvertTo-Json
Invoke-RestMethod -Uri "https://nice4-d7886-default-rtdb.asia-southeast1.firebasedatabase.app/users/9saCUKmPqNR8bfnFhGGj6htfWoP2.json" -Method Put -Body $body2 -ContentType "application/json"
Write-Host "✅ Hosur user added!" -ForegroundColor Green

Write-Host ""
Write-Host "🎉 Done! Now add admin user in Firebase Console and run the admin command." -ForegroundColor Green
```

---

## Important Notes

1. **Database Region**: Your database is in `asia-southeast1`, not the default US region
2. **All scripts updated**: The `.ps1` files have been updated with the correct URL
3. **Admin UID**: You still need to create the admin user in Firebase Console first, then add to database

---

## Next Steps

1. ✅ Clear forms (command above)
2. ✅ Add users (commands above)
3. ⏳ Create admin in Firebase Console Authentication
4. ⏳ Add admin to database with their UID
5. ✅ Test login at https://nice4-d7886.web.app
