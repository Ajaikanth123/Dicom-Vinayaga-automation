# Quick Guide: Adding New Users

## 📝 Step-by-Step Instructions

### 1. Add User to Firebase Authentication
First, create the user account in Firebase:
- Go to Firebase Console → Authentication → Users
- Click "Add User"
- Enter email and password
- Or: User can sign up via Google Sign-In

### 2. Assign User to Branch
Edit `src/utils/userConfig.js`:

```javascript
export const BRANCH_ASSIGNMENTS = {
  'anbudentalscans@gmail.com': 'ANBU-SLM-LIC',
  '3danbudentalscansramnadu@gmail.com': 'ANBU-RMD',
  '3danbuscanshosur@gmail.com': 'ANBU-HSR',
  'salemgugai@anbu-dental.com': 'ANBU-SLM-GUG',
  
  // ADD NEW USER HERE:
  'newuser@example.com': 'ANBU-SLM-LIC'  // ← Add this line
};
```

### 3. (Optional) Make User Admin
If the user needs admin access, add to admin list:

```javascript
export const ADMIN_EMAILS = [
  'admin@anbu-dental.com',
  'anbudentalscans@gmail.com',
  
  // ADD ADMIN HERE:
  'newadmin@example.com'  // ← Add this line
];
```

### 4. Available Branch IDs
Use one of these branch IDs:
- `ANBU-SLM-LIC` → ANBU – Salem (LIC Colony)
- `ANBU-SLM-GUG` → ANBU – Salem (Gugai)
- `ANBU-RMD` → ANBU – Ramanathapuram
- `ANBU-HSR` → ANBU – Hosur

### 5. Save and Deploy
- Save the file
- Commit changes to Git
- Deploy to production
- User can now log in with assigned branch

## 🎯 Examples

### Example 1: Add Regular User
```javascript
// User: doctor@salem.com
// Branch: Salem LIC Colony
// Access: Branch-specific only

export const BRANCH_ASSIGNMENTS = {
  // ... existing users ...
  'doctor@salem.com': 'ANBU-SLM-LIC'
};
```

### Example 2: Add Admin User
```javascript
// User: manager@anbu-dental.com
// Access: All branches

export const ADMIN_EMAILS = [
  'admin@anbu-dental.com',
  'anbudentalscans@gmail.com',
  'manager@anbu-dental.com'  // ← New admin
];

// Admin users don't need branch assignment
// They can access all branches
```

### Example 3: Add Multiple Users
```javascript
export const BRANCH_ASSIGNMENTS = {
  // Salem LIC users
  'salem.lic.user1@example.com': 'ANBU-SLM-LIC',
  'salem.lic.user2@example.com': 'ANBU-SLM-LIC',
  
  // Ramanathapuram users
  'ramnadu.user1@example.com': 'ANBU-RMD',
  'ramnadu.user2@example.com': 'ANBU-RMD',
  
  // Hosur users
  'hosur.user1@example.com': 'ANBU-HSR'
};
```

## ⚠️ Important Notes

1. **Email must match exactly** (case-insensitive)
2. **Branch ID must be exact** (case-sensitive)
3. **Admin users don't need branch assignment** (they access all)
4. **Changes require code deployment** (not dynamic)
5. **User must exist in Firebase first** (create account first)

## 🔍 Troubleshooting

### User can't log in
- ✅ Check Firebase Authentication (user exists?)
- ✅ Check email spelling in userConfig.js
- ✅ Verify password is correct

### User sees wrong branch
- ✅ Check BRANCH_ASSIGNMENTS mapping
- ✅ Verify branch ID is correct
- ✅ Clear browser cache and localStorage
- ✅ Log out and log back in

### User can't switch branches
- ✅ This is normal for non-admin users
- ✅ Add to ADMIN_EMAILS if they need access to all branches

### Changes not taking effect
- ✅ Save the file
- ✅ Restart dev server (npm run dev)
- ✅ Clear browser cache
- ✅ Hard refresh (Ctrl+Shift+R)

## 📞 Quick Reference

**File to edit**: `src/utils/userConfig.js`

**Two arrays to modify**:
1. `ADMIN_EMAILS` - Users with full access
2. `BRANCH_ASSIGNMENTS` - User-to-branch mapping

**After editing**:
1. Save file
2. Restart server (if dev)
3. Deploy (if production)
4. User logs in → Auto-assigned to branch
