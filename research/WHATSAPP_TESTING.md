# Testing WhatsApp Integration

## Quick Test

The WhatsApp integration has been added to your Smart Laundry POS system. Here's how to test it:

### 1. Environment Variables Fixed

The `process` variable error has been fixed by using Vite's `import.meta.env` instead. The configuration now uses:

- `import.meta.env.VITE_WHATSAPP_ENABLED`
- `import.meta.env.VITE_WHATSAPP_API_URL`
- `import.meta.env.DEV` (for development mode detection)

### 2. Test the Integration

1. **Start your development server**: `npm run dev`

2. **Navigate to the test page**: `http://localhost:5173/whatsapp-test`
   - Login first if required
   - The test page will show the integration status

3. **Check environment variables**:
   - The test page shows all environment variables
   - If they show "undefined", add them to your `.env` file

4. **Test functionality**:
   - Click "Test Order Notification" 
   - Click "Test Custom Message"
   - Check browser console for output

### 3. Environment Setup

If environment variables are undefined, create a `.env` file in your project root:

```env
VITE_WHATSAPP_ENABLED=true
VITE_WHATSAPP_API_URL=http://localhost:8080
VITE_WHATSAPP_API_USERNAME=admin
VITE_WHATSAPP_API_PASSWORD=your_secure_password
VITE_WHATSAPP_API_TIMEOUT=10000
VITE_WHATSAPP_NOTIFY_ORDER_CREATED=true
VITE_WHATSAPP_NOTIFY_ORDER_COMPLETED=true
```

### 4. Development Mode

In development (`import.meta.env.DEV = true`):
- Messages are logged to console instead of being sent
- No actual WhatsApp API calls are made
- Safe for testing without sending real messages

### 5. Browser Console Output

When testing, check the browser console for:
- Configuration details
- Message content that would be sent
- Success/error status
- Development mode notifications

### 6. Integration Status

The test page shows:
- ✅ **Configured**: Environment variables are properly set
- 🔧 **Dev Mode**: Development mode is active (safe testing)
- ✅ **Enabled**: WhatsApp integration is turned on
- ✅ **Features**: Individual notification types are enabled

### 7. Next Steps

Once testing confirms everything works:

1. **Use in POS components**:
   ```tsx
   // Replace this
   import { useCreateOrder } from '@/hooks/useOrdersOptimized';
   
   // With this
   import { useCreateOrderWithNotifications as useCreateOrder } from '@/hooks/useOrdersWithNotifications';
   ```

2. **Configure production environment**:
   - Set up actual WhatsApp API endpoint
   - Update credentials
   - Set `VITE_WHATSAPP_ENABLED=true` in production

3. **Monitor in production**:
   - Check application logs
   - Verify messages are being sent
   - Monitor for any errors

## Troubleshooting

### Common Issues

1. **"Can't find variable: process"** - ✅ Fixed by using `import.meta.env`
2. **Environment variables undefined** - Add to `.env` file
3. **Network errors** - Check WhatsApp API URL and credentials
4. **No messages sent** - Ensure not in development mode for production

### Debug Steps

1. Check `/whatsapp-test` page
2. Verify environment variables in browser console
3. Test with development mode first
4. Check network tab for API calls (in production)
5. Review application logs

## Files Added

- `src/integrations/whatsapp/` - Core integration files
- `src/hooks/useWhatsApp.ts` - React hook
- `src/hooks/useOrdersWithNotifications.ts` - Enhanced order hooks
- `src/pages/WhatsAppTestPage.tsx` - Test page
- `src/components/debug/WhatsAppStatus.tsx` - Status component
- `.env.local` - Example environment file

The integration is now ready for testing and gradually rolling out to your POS system!
