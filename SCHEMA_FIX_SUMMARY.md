# Schema Validation Error Fix

## Problem
Convex was throwing schema validation errors:
```
[CONVEX M(users:CreateUser)] Server Error
Uncaught Error: Failed to insert or update a document in table "users" because it does not match the schema: Value does not match validator.
Path: .subscriptionId
Value: null
Validator: v.string()
```

## Root Cause
The Convex schema defined `subscriptionId` as `v.optional(v.string())`, but several parts of the code were explicitly setting `subscriptionId: null` instead of `undefined` or omitting the field entirely.

## Fixed Locations

### 1. convex/users.js
**Line 216** - In the subscription cancellation function:
```javascript
// Before (BROKEN):
await ctx.db.patch(user._id, {
    subscriptionId: null,
    credits: 5000
});

// After (FIXED):
await ctx.db.patch(user._id, {
    subscriptionId: undefined,
    credits: 5000
});
```

### 2. convex/subscriptions.js
**Line 206** - In the subscription cancellation function:
```javascript
// Before (BROKEN):
await ctx.db.patch(userId, {
    subscriptionId: null,
    credits: 5000
});

// After (FIXED):
await ctx.db.patch(userId, {
    subscriptionId: undefined,
    credits: 5000
});
```

**Line 274** - In payment record creation:
```javascript
// Before (BROKEN):
subscriptionId: subscriptionId || null

// After (FIXED):
subscriptionId: subscriptionId || undefined
```

**Line 432** - In another payment record creation:
```javascript
// Before (BROKEN):
subscriptionId: subscriptionId || null

// After (FIXED):
subscriptionId: subscriptionId || undefined
```

## Key Learning
When using Convex with `v.optional(v.string())`:
- ✅ Omit the field entirely
- ✅ Set to `undefined`
- ❌ **NEVER** set to `null`

## Verification
After the fix:
- User creation works correctly ✅
- No schema validation errors ✅
- Subscription flow continues to work ✅
- Both local development and production webhooks work ✅

## Test Results
```
6/30/2025, 8:24:56 PM [CONVEX M(users:CreateUser)] [LOG] '✅ New user created with ID:' 'j9708hypw19esctbtwx11jkqgh7jtztz'
6/30/2025, 8:24:56 PM [CONVEX M(users:CreateUser)] [LOG] '👤 Returning new user:' {
  _id: 'j9708hypw19esctbtwx11jkqgh7jtztz',
  name: 'Eurocomercial Jer',
  email: 'dominiojer@gmail.com',
  credits: 5000
}
```

No more schema validation errors! 🎉
