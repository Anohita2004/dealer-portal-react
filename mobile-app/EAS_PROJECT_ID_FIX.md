# Fix: Invalid UUID appId Error

## Problem
The `app.json` file had a placeholder project ID (`"your-project-id"`) instead of the actual EAS project ID.

## Solution Applied
Updated `app.json` with the correct project ID: `0c76468c-e3f6-4011-95d0-137df8344117`

## Next Steps

Now run the build command again:

```bash
cd mobile-app
eas build --profile development --platform android
```

The build should work now!

## What Happened

1. ✅ EAS project was created: `0c76468c-e3f6-4011-95d0-137df8344117`
2. ✅ Project was linked successfully
3. ❌ `app.json` had placeholder ID instead of real ID
4. ✅ Fixed: Updated with correct project ID

## Verify

Check that `app.json` now has:
```json
"extra": {
  "eas": {
    "projectId": "0c76468c-e3f6-4011-95d0-137df8344117"
  }
}
```

Now the build should proceed successfully!

