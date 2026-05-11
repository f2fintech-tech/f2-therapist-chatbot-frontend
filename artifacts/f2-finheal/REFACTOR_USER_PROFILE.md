# Frontend User Profile Refactoring

## Summary of Changes

The frontend has been refactored to support **any user** instead of being hardcoded for development user "Aditya". All user-specific hardcoded values have been replaced with dynamic, profile-driven design.

## What Was Hardcoded (Before)

1. **ChatArea.tsx** - Greeting message: `"Good morning, Aditya"`
2. **Sidebar.tsx** - User profile section:
   - User name: `"Aditya Rawal"`
   - User initials: `"AR"`
   - User tier: `"Premium Member"`
3. **ChatArea.tsx** - User message avatar: `"AR"` initials

## What Was Changed (After)

### 1. New User Utility Module (`src/utils/user.ts`)

Created a centralized user profile utility with functions:

- `getInitials(displayName)` - Generate user initials from display name
- `parseName(fullName)` - Split full name into first/last name
- `generateUserDisplayName(userId, overrideName)` - Generate friendly display name
- `createUserProfile(userId, displayNameOverride)` - Create a full `UserProfile` object
- `setUserDisplayName(displayName)` - Store user name in sessionStorage
- `getOrCreateUserProfile(userId, displayNameOverride)` - Get or create profile

### 2. Updated Component Props

All components now accept a `userProfile: UserProfile` prop:

```typescript
interface UserProfile {
  userId: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  initials: string;
  userTier?: string;
  email?: string;
}
```

### 3. Component Updates

#### **FinHealChat.tsx** (Page)
- Generates a persistent `USER_ID` using UUID
- Creates a `USER_PROFILE` from the user ID
- Passes `userProfile` to `ChatArea` and `Sidebar`

#### **ChatArea.tsx**
- Accepts `userProfile` prop
- Uses `userProfile.firstName || userProfile.displayName` in greeting
- Uses `userProfile.initials` for user message avatar

#### **Sidebar.tsx**
- Accepts `userProfile` prop
- Uses `userProfile.initials` in avatar
- Uses `userProfile.displayName` as user name
- Uses `userProfile.userTier` for membership status

## How It Works

### User ID Generation

The system generates a **persistent UUID** per browser session:

```typescript
// In FinHealChat.tsx
const USER_ID = resolveUserId();
// Generates or retrieves UUID from sessionStorage
// Reuses same ID for entire session
```

### User Profile Creation

From the UUID, the system creates a user profile with sensible defaults:

```typescript
const USER_PROFILE = getOrCreateUserProfile(USER_ID);
// Returns: {
//   userId: "123e4567-e89b-12d3-a456-426614174000",
//   displayName: "Financial Friend",
//   firstName: "Financial",
//   lastName: "Friend",
//   initials: "FF",
//   userTier: "Standard"
// }
```

### Override User Name

You can override the default display name in three ways:

#### **Option 1: Environment Variable**
```env
# .env
VITE_USER_ID=123e4567-e89b-12d3-a456-426614174000
```

#### **Option 2: Pass Display Name on First Component Load**
```typescript
// In FinHealChat.tsx or a setup hook
setUserDisplayName("Aditya Rawal");
const USER_PROFILE = getOrCreateUserProfile(USER_ID, "Aditya Rawal");
```

#### **Option 3: SessionStorage (Runtime)**
```typescript
setUserDisplayName("Jane Doe");
// Persist across reloads in same session
```

## Testing with Different Users

### Scenario 1: Generic User (Default)
- Open app in fresh browser tab
- Greeting shows: "Good morning, Financial Friend"
- Avatar initials: "FF"
- User tier: "Standard Member"

### Scenario 2: Custom Named User
- Set `VITE_USER_ID` in `.env`:
  ```env
  VITE_USER_ID=john-doe-user
  ```
- Or call `setUserDisplayName("John Doe")` at app startup
- Greeting shows: "Good morning, John"
- Avatar initials: "JD"

### Scenario 3: Multiple Sessions
- Each browser tab maintains its own `USER_ID` in sessionStorage
- Close tab → generate new ID on next visit
- This ensures different browser sessions have different users

## Files Modified

1. **Created**:
   - `/src/utils/user.ts` - User profile utilities

2. **Updated**:
   - `/src/pages/FinHealChat.tsx` - Add user profile generation
   - `/src/components/ChatArea.tsx` - Use dynamic user name/initials
   - `/src/components/Sidebar.tsx` - Use dynamic user profile
   - `/src/.env` - No hardcoded user IDs (auto-generated)

## Backward Compatibility

- Old hardcoded flow: Removed ✅
- All components generic: ✅
- No breaking changes to backend API: ✅
- Works seamlessly with any UUID user ID: ✅

## Next Steps (Optional)

1. **Add User Settings**: Create a settings page where users can update their display name/tier
2. **Persist to Backend**: Save user preferences to backend when user updates profile
3. **Add Avatar Upload**: Allow users to set custom avatars instead of initials
4. **Multi-User Sessions**: Track multiple users within family/team context
5. **Locale Support**: Support names from different languages/character sets

---

**Status**: ✅ Refactoring complete. The UI now works for any user, not just "Aditya".
