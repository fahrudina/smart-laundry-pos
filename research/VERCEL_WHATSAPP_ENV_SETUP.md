# Vercel Environment Variables Setup for WhatsApp Integration

## Issue Resolution: "WhatsApp service enabled but configuration is invalid"

This error occurs when the WhatsApp configuration validation fails. Here's how to fix it:

## Root Causes:
1. **Missing VITE_ prefixed environment variables** - Client-side variables need the VITE_ prefix
2. **URL validation failing for relative paths** - Fixed in `validateWhatsAppConfig` function

## Required Environment Variables in Vercel:

### Server-side Variables (SECURE - for serverless function only):
```bash
WHATSAPP_API_URL=http://34.229.217.97
WHATSAPP_USERNAME=admin
WHATSAPP_PASSWORD=your_whatsapp_password
```

### Client-side Variables (SAFE - non-sensitive configuration):
```bash
VITE_WHATSAPP_ENABLED=true
VITE_WHATSAPP_API_TIMEOUT=10000
VITE_WHATSAPP_NOTIFY_ORDER_CREATED=true
VITE_WHATSAPP_NOTIFY_ORDER_COMPLETED=true
VITE_WHATSAPP_DEVELOPMENT_MODE=false
```

### Development Only Variables (for .env.local):
```bash
VITE_WHATSAPP_USE_PROXY=true
VITE_WHATSAPP_API_USERNAME=admin
VITE_WHATSAPP_API_PASSWORD=your_whatsapp_password
```

### Optional Variables:
```bash
VITE_RECEIPT_BASE_URL=https://your-custom-domain.com
```

## How to Set Variables in Vercel:

1. Go to your Vercel dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add each variable above with the correct values
5. Make sure to set them for **Production**, **Preview**, and **Development** environments
6. Redeploy your application

## Validation Changes Made:

### Before (causing the error):
```typescript
// This failed for relative URLs like '/api/whatsapp-send'
try {
  new URL(config.baseUrl);
} catch {
  console.warn('Invalid WhatsApp API base URL');
  return false;
}
```

### After (fixed):
```typescript
// Now handles both relative URLs (/api/whatsapp-send) and absolute URLs
if (config.baseUrl.startsWith('/')) {
  // Relative URL - valid for serverless functions
  return true;
}

try {
  new URL(config.baseUrl);
  return true;
} catch {
  console.warn('Invalid WhatsApp API base URL:', config.baseUrl);
  return false;
}
```

## Testing the Fix:

1. Set all environment variables in Vercel
2. Deploy the application
3. Check browser console - the warning should be gone
4. Test WhatsApp functionality in the app
5. Verify `isConfigured` returns `true` in the useWhatsApp hook

## Environment Variable Flow:

```
Development:
VITE_WHATSAPP_USE_PROXY=true → Uses local proxy at localhost:8080

Production (Vercel):
VITE_WHATSAPP_USE_PROXY=false → Uses Vercel serverless function /api/whatsapp-send
```

## Debugging Steps:

If you still see the warning:

1. **Check browser console** for detailed validation logs
2. **Verify environment variables** are set correctly in Vercel
3. **Check network tab** to see if WhatsApp API calls are working
4. **Test in development** to ensure local setup works first

The warning should disappear once all VITE_ prefixed variables are properly set in Vercel.
