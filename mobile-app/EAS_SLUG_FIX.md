# Fix: Slug Mismatch Error

## Problem
The slug in `app.json` (`dealer-portal-mobile`) doesn't match the EAS project slug (`dealer-portal-react`).

## Solution Applied
Updated `app.json` slug to match EAS project: `dealer-portal-react`

## Next Steps

Now run the build command again:

```bash
cd mobile-app
eas build --profile development --platform android
```

The build should work now!

## What Was Wrong

- EAS project slug: `dealer-portal-react` (created when you ran `eas build:configure`)
- app.json slug: `dealer-portal-mobile` (didn't match)
- ✅ Fixed: Updated to `dealer-portal-react`

## Why This Happened

When you ran `eas build:configure` from the root directory, it created a project with slug based on the root directory name (`dealer-portal-react`), but your `app.json` had a different slug (`dealer-portal-mobile`).

## Verify

Check that `app.json` now has:
```json
"slug": "dealer-portal-react"
```

Now the build should proceed successfully!

