# Sidebar Layout Reference

## 📐 Visual Structure

```
┌─────────────────────────────────────┐
│  SIDEBAR HEADER                     │
│  ┌───┐                              │
│  │ 👤│  3D Anbu Dental Diagnostics  │
│  └───┘  Diagnostic Center           │
├─────────────────────────────────────┤
│                                     │
│  NAVIGATION MENU (Scrollable)       │
│                                     │
│  📝 Create Form                     │
│  📋 Manage Forms                    │
│  👥 Branch Patients                 │
│  📍 Manage Branches                 │
│  👨‍⚕️ Manage Doctors                  │
│  📊 Analytics                       │
│  ⚙️  Email Settings                 │
│                                     │
├─────────────────────────────────────┤
│  USER ACCOUNT SECTION               │
│  ┌─────────────────────────────┐   │
│  │ ┌───┐                       │   │
│  │ │ 👤│  user@example.com     │   │
│  │ └───┘  🔐 Signed in via     │   │
│  │        Email/Google         │   │
│  │        🛡️ Admin (if admin)  │   │
│  │                             │   │
│  │  ┌───────────────────────┐ │   │
│  │  │   🚪 Logout           │ │   │
│  │  └───────────────────────┘ │   │
│  └─────────────────────────────┘   │
├─────────────────────────────────────┤
│  FOOTER                             │
│  © 2026 3D Anbu Dental              │
│  Diagnostics LLP                    │
│  v1.0.0                             │
└─────────────────────────────────────┘
```

## 🎨 User Account Section Details

### Layout Components

```
┌─────────────────────────────────────────┐
│  USER ACCOUNT SECTION                   │
│  ┌───────────────────────────────────┐  │
│  │  ┌────┐  ┌──────────────────┐    │  │
│  │  │    │  │ Email Address    │    │  │
│  │  │ 👤 │  │ user@example.com │    │  │
│  │  │    │  ├──────────────────┤    │  │
│  │  └────┘  │ 🔐 Provider      │    │  │
│  │  Avatar  │ Signed in via... │    │  │
│  │          ├──────────────────┤    │  │
│  │          │ 🛡️ Admin Badge   │    │  │
│  │          │ (if admin)       │    │  │
│  │          └──────────────────┘    │  │
│  │                                   │  │
│  │  ┌─────────────────────────────┐ │  │
│  │  │      🚪 Logout             │ │  │
│  │  └─────────────────────────────┘ │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

## 📏 Dimensions & Spacing

### User Account Section
- **Padding**: 16px all sides
- **Background**: rgba(0, 0, 0, 0.1)
- **Border Top**: 1px solid rgba(255, 255, 255, 0.15)

### User Info Container
- **Display**: Flex row
- **Gap**: 12px
- **Margin Bottom**: 12px

### Avatar
- **Size**: 44px × 44px
- **Border Radius**: 50% (circular)
- **Background**: rgba(255, 255, 255, 0.15)
- **Icon Size**: 28px × 28px

### User Details
- **Email Font Size**: 13px
- **Email Font Weight**: 600
- **Email Color**: white
- **Provider Font Size**: 11px
- **Provider Color**: rgba(255, 255, 255, 0.7)

### Admin Badge
- **Padding**: 2px 8px
- **Border Radius**: 12px
- **Font Size**: 10px
- **Font Weight**: 600
- **Background**: rgba(255, 215, 0, 0.2)
- **Color**: #ffd700
- **Border**: 1px solid rgba(255, 215, 0, 0.3)

### Logout Button
- **Width**: 100%
- **Padding**: 10px 16px
- **Border Radius**: 8px
- **Background**: rgba(220, 38, 38, 0.15)
- **Color**: #ff6b6b
- **Font Size**: 14px
- **Font Weight**: 600

## 🎨 Color Scheme

### User Account Section
```css
Background: rgba(0, 0, 0, 0.1)
Border: rgba(255, 255, 255, 0.15)
Text (Email): #ffffff
Text (Provider): rgba(255, 255, 255, 0.7)
```

### Admin Badge
```css
Background: rgba(255, 215, 0, 0.2)
Border: rgba(255, 215, 0, 0.3)
Text: #ffd700
```

### Logout Button
```css
Background: rgba(220, 38, 38, 0.15)
Background (Hover): rgba(220, 38, 38, 0.25)
Text: #ff6b6b
Text (Hover): #ff5252
```

## 📱 Responsive Behavior

### Desktop (> 768px)
- Sidebar: Fixed, 260px width
- User section: Full width within sidebar
- Email: Truncated with ellipsis if too long

### Mobile (≤ 768px)
- Sidebar: Slide-in from left
- User section: Remains at bottom
- Logout button: Full width
- Touch-friendly tap targets

## 🔄 States

### Normal State
- Avatar: Default icon or Google photo
- Email: Displayed
- Provider: Shown with icon
- Logout: Red background

### Hover State (Logout)
- Background: Darker red
- Text: Brighter red
- Cursor: Pointer

### Admin User
- Shows admin badge
- Gold accent color
- Shield icon

### Non-Admin User
- No admin badge
- Standard layout

## 📊 Example Layouts

### Admin User Example
```
┌─────────────────────────────────┐
│ ┌──┐                            │
│ │👤│  admin@anbu-dental.com     │
│ └──┘  🔐 Signed in via Google   │
│       🛡️ Admin                  │
│                                 │
│ ┌─────────────────────────────┐ │
│ │      🚪 Logout             │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

### Non-Admin User Example
```
┌─────────────────────────────────┐
│ ┌──┐                            │
│ │👤│  user@branch.com           │
│ └──┘  🔐 Signed in via Email    │
│                                 │
│ ┌─────────────────────────────┐ │
│ │      🚪 Logout             │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

### With Google Photo
```
┌─────────────────────────────────┐
│ ┌──┐                            │
│ │📷│  user@gmail.com            │
│ └──┘  🔐 Signed in via Google   │
│                                 │
│ ┌─────────────────────────────┐ │
│ │      🚪 Logout             │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

## 🎯 Key Features

1. **Fixed Position**: Always visible at bottom
2. **Scrollable Nav**: Navigation menu scrolls, user section stays fixed
3. **Clear Hierarchy**: Visual separation from navigation
4. **Professional Design**: Medical-grade aesthetic
5. **Responsive**: Works on all screen sizes
6. **Accessible**: Clear labels and touch targets

## 📝 CSS Classes Reference

```css
.user-account-section     /* Main container */
.user-info                /* User info flex container */
.user-avatar              /* Avatar circle */
.avatar-image             /* Google photo img */
.avatar-icon              /* Default icon SVG */
.user-details             /* Email/provider container */
.user-email               /* Email text */
.user-provider            /* Provider text with icon */
.provider-icon            /* Provider icon SVG */
.user-badge               /* Badge container */
.admin-badge              /* Admin-specific badge */
.badge-icon               /* Badge icon SVG */
.logout-btn               /* Logout button */
.logout-icon              /* Logout icon SVG */
```

## 🔍 Implementation Notes

- User section uses flexbox for layout
- Avatar supports both image and icon
- Email truncates with ellipsis
- Logout button has confirmation dialog
- Admin badge only shows for admin users
- Provider detection from Firebase auth
- Responsive design with media queries
- Smooth transitions on hover states

---

**Reference Date**: January 22, 2026
**Component**: Sidebar User Account Section
**Status**: ✅ Implemented and Styled
