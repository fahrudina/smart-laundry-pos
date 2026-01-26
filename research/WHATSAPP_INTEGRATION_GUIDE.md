# WhatsApp Integration Guide

## Overview

This integration provides a clean, testable WhatsApp messaging service for the Smart Laundry POS system. It automatically sends notifications when:

1. **Order Created** - Customer receives confirmation with order details
2. **Order Completed** - Customer gets notified when laundry is ready for pickup

## Integration Structure

```
src/integrations/whatsapp/
├── index.ts              # Main exports
├── types.ts              # TypeScript interfaces
├── client.ts             # WhatsApp API client
├── service.ts            # High-level notification service
├── templates.ts          # Message templates
└── __tests__/
    ├── mock-service.ts   # Mock implementation for testing
    └── client.test.ts    # Unit tests (Jest-ready)

src/hooks/
├── useWhatsApp.ts                    # React hook for WhatsApp
└── useOrdersWithNotifications.ts    # Enhanced order hooks

src/components/settings/
└── WhatsAppSettings.tsx             # Settings management UI

src/lib/
└── whatsapp-config.ts               # Configuration management
```

## Configuration

### Environment Variables

Add these to your `.env` file:

```env
# WhatsApp API Configuration
VITE_WHATSAPP_ENABLED=true
VITE_WHATSAPP_API_URL=http://localhost:8080
VITE_WHATSAPP_API_USERNAME=admin
VITE_WHATSAPP_API_PASSWORD=your_secure_password
VITE_WHATSAPP_API_TIMEOUT=10000

# Feature Flags
VITE_WHATSAPP_NOTIFY_ORDER_CREATED=true
VITE_WHATSAPP_NOTIFY_ORDER_COMPLETED=true
```

### Development Mode

Development mode is automatically detected by Vite (`import.meta.env.DEV`), which logs messages instead of sending them.

## Usage Examples

### Basic Usage in Components

```tsx
import { useWhatsApp } from '@/hooks/useWhatsApp';

const MyComponent = () => {
  const { notifyOrderCreated, notifyOrderCompleted, isConfigured } = useWhatsApp();
  
  if (!isConfigured) {
    console.warn('WhatsApp not configured');
  }
  
  // ... component logic
};
```

### Enhanced Order Creation (Recommended)

```tsx
import { useCreateOrderWithNotifications } from '@/hooks/useOrdersWithNotifications';

const POSComponent = () => {
  // Replace useCreateOrder with useCreateOrderWithNotifications
  const createOrderMutation = useCreateOrderWithNotifications();
  
  // Use exactly the same as before - notifications are automatic
  const handleCreateOrder = async (orderData) => {
    await createOrderMutation.mutateAsync(orderData);
  };
};
```

### Manual Notification

```tsx
import { useWhatsApp } from '@/hooks/useWhatsApp';

const OrderManagement = () => {
  const { notifyOrderCompleted } = useWhatsApp();
  
  const handleMarkCompleted = async (order) => {
    // Update order status...
    
    // Send notification
    await notifyOrderCompleted(order.customer_phone, {
      orderId: order.id.slice(-8).toUpperCase(),
      customerName: order.customer_name,
      totalAmount: order.total_amount,
      completedAt: new Date().toLocaleDateString('id-ID'),
      services: order.order_items.map(item => item.service_name),
    });
  };
};
```

## Integration Steps

### Step 1: Update Existing POS Components

For components using `useCreateOrder`, simply replace the import:

```tsx
// Before
import { useCreateOrder } from '@/hooks/useOrdersOptimized';

// After
import { useCreateOrderWithNotifications as useCreateOrder } from '@/hooks/useOrdersWithNotifications';
```

### Step 2: Update Order Status Components

For components updating execution status:

```tsx
// Before
import { useUpdateExecutionStatus } from '@/hooks/useOrdersOptimized';

// After
import { useUpdateExecutionStatusWithNotifications as useUpdateExecutionStatus } from '@/hooks/useOrdersWithNotifications';

// When calling the mutation, pass order data:
updateExecutionMutation.mutate({
  orderId,
  executionStatus: 'completed',
  orderData: {
    customer_name: order.customer_name,
    customer_phone: order.customer_phone,
    total_amount: order.total_amount,
    order_items: order.order_items,
  },
});
```

### Step 3: Add Settings Page

Add WhatsApp settings to your admin/settings area:

```tsx
import { WhatsAppSettings } from '@/components/settings/WhatsAppSettings';

const SettingsPage = () => {
  return (
    <div>
      {/* Other settings */}
      <WhatsAppSettings />
    </div>
  );
};
```

## Testing

### Mock Service

Use the mock service for testing:

```tsx
import { MockWhatsAppService, runBasicTests } from '@/integrations/whatsapp/__tests__/mock-service';

const mockService = new MockWhatsAppService();
await runBasicTests(mockService);

console.log('Messages sent:', mockService.getSentMessages());
```

### Development Mode

In development, set `NODE_ENV=development` to log messages instead of sending them.

### Manual Testing

Use the settings page to test:

1. Open WhatsApp Settings
2. Test connection
3. Send test message
4. Run mock tests

## Message Templates

Messages are automatically formatted in Indonesian:

### Order Created
```
🧺 *Pesanan Laundry Berhasil Dibuat*

Halo [Customer Name]! ✨

Pesanan Anda telah diterima dengan detail:
📋 *ID Pesanan:* [Order ID]
💰 *Total:* Rp[Amount]
🧼 *Layanan:* [Services]
⏰ *Estimasi Selesai:* [Date]

Terima kasih telah mempercayakan laundry Anda kepada kami! 🙏
```

### Order Completed
```
🎉 *Laundry Anda Sudah Selesai!*

Halo [Customer Name]! ✨

Kabar baik! Pesanan laundry Anda sudah selesai:
📋 *ID Pesanan:* [Order ID]
💰 *Total:* Rp[Amount]
🧼 *Layanan:* [Services]
✅ *Selesai pada:* [Date]

Silakan datang untuk mengambil laundry Anda. Terima kasih! 🙏
```

## Error Handling

- WhatsApp failures DO NOT block order operations
- Errors are logged but don't affect user experience
- Development mode prevents accidental messages
- Graceful degradation when service is not configured

## API Requirements

Your WhatsApp API should accept:

```bash
curl -X POST http://localhost:8080/api/send-message \
  -u admin:your_secure_password \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+1234567890",
    "message": "Hello from WhatsPoints API!"
  }'
```

And return:

```json
{
  "success": true,
  "message": "Message sent successfully",
  "id": "message_id_here"
}
```

## Benefits

1. **Clean Architecture**: Separate concerns, easy to test
2. **Non-blocking**: Order operations never fail due to WhatsApp issues
3. **Configurable**: Enable/disable via environment variables
4. **Testable**: Mock service and comprehensive testing tools
5. **Production Ready**: Proper error handling and logging
6. **Localized**: Indonesian language templates
7. **Extensible**: Easy to add new message types

## Troubleshooting

### WhatsApp Not Configured
- Check environment variables
- Use WhatsApp Settings page to test configuration

### Messages Not Sending
- Check API connectivity in settings
- Verify phone number format (+628...)
- Check API credentials

### Development Issues
- Ensure `NODE_ENV=development` for testing
- Use mock service for isolated testing
- Check browser console for detailed logs
