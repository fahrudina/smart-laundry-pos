/**
 * WhatsApp Integration Test Suite
 * 
 * This file demonstrates how to test the WhatsApp integration
 * both manually and programmatically.
 */

import { MockWhatsAppService, createMockOrderData, createMockCompletedOrderData } from '@/integrations/whatsapp/__tests__/mock-service';
import { whatsAppService } from '@/integrations/whatsapp';

/**
 * Test the WhatsApp integration in development
 */
export const runWhatsAppTests = async () => {
  console.log('🧺 Starting WhatsApp Integration Tests...\n');
  
  // 1. Mock Service Tests
  console.log('1️⃣ Testing Mock Service');
  const mockService = new MockWhatsAppService();
  
  // Test order created notification
  const orderData = createMockOrderData({
    customerName: 'Jane Doe',
    orderId: 'TEST001',
    totalAmount: 95000,
  });
  
  const createResult = await mockService.notifyOrderCreated('+628123456789', orderData);
  console.log('Order created notification:', createResult);
  
  // Test order completed notification
  const completedData = createMockCompletedOrderData({
    customerName: 'Jane Doe',
    orderId: 'TEST001',
    totalAmount: 95000,
  });
  
  const completeResult = await mockService.notifyOrderCompleted('+628123456789', completedData);
  console.log('Order completed notification:', completeResult);
  
  console.log(`Mock service history: ${mockService.getMessageCount()} messages sent\n`);
  
  // 2. Real Service Tests (Development Mode)
  console.log('2️⃣ Testing Real Service (Development Mode)');
  
  if (whatsAppService.isConfigured()) {
    console.log('✅ WhatsApp service is configured');
    
    const testResult = await whatsAppService.testConnection();
    console.log('Connection test:', testResult ? '✅ Success' : '❌ Failed');
    
    const realOrderResult = await whatsAppService.notifyOrderCreated('+628123456789', orderData);
    console.log('Real order notification:', realOrderResult);
  } else {
    console.log('⚠️ WhatsApp service not configured - using development mode');
  }
  
  console.log('\n🎉 WhatsApp Integration Tests Complete!\n');
};

/**
 * Manual test scenarios
 */
export const manualTestScenarios = {
  // Test with Indonesian phone number formats
  phoneNumbers: [
    '+628123456789',    // International format
    '08123456789',      // Local format with 0
    '8123456789',       // Local format without 0
  ],
  
  // Test different order scenarios
  orderScenarios: [
    {
      name: 'Small Order',
      data: createMockOrderData({
        totalAmount: 25000,
        services: ['Cuci Biasa'],
      }),
    },
    {
      name: 'Large Order',
      data: createMockOrderData({
        totalAmount: 150000,
        services: ['Cuci Biasa', 'Setrika', 'Dry Clean'],
      }),
    },
    {
      name: 'Express Order',
      data: createMockOrderData({
        totalAmount: 75000,
        services: ['Express Wash'],
        estimatedCompletion: 'Hari ini, 18:00',
      }),
    },
  ],
  
  // Test error scenarios
  errorScenarios: [
    {
      name: 'Invalid Phone Number',
      phone: 'invalid-phone',
      expectedError: 'Invalid phone number format',
    },
    {
      name: 'Empty Message',
      message: '',
      expectedError: 'Message is required',
    },
  ],
};

/**
 * Performance test
 */
export const performanceTest = async () => {
  console.log('🚀 Running Performance Test...');
  
  const mockService = new MockWhatsAppService();
  const startTime = performance.now();
  
  // Send 100 notifications
  const promises = [];
  for (let i = 0; i < 100; i++) {
    const orderData = createMockOrderData({
      orderId: `PERF${i.toString().padStart(3, '0')}`,
    });
    promises.push(mockService.notifyOrderCreated('+628123456789', orderData));
  }
  
  await Promise.all(promises);
  
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  console.log(`📊 Performance Results:`);
  console.log(`- Messages sent: 100`);
  console.log(`- Total time: ${duration.toFixed(2)}ms`);
  console.log(`- Average per message: ${(duration / 100).toFixed(2)}ms`);
  console.log(`- Messages per second: ${(100 / (duration / 1000)).toFixed(2)}`);
};

/**
 * Integration health check
 */
export const healthCheck = async () => {
  console.log('🏥 WhatsApp Integration Health Check...\n');
  
  const checks = [
    {
      name: 'Service Configuration',
      test: () => whatsAppService.isConfigured(),
    },
    {
      name: 'Connection Test',
      test: async () => {
        if (!whatsAppService.isConfigured()) return false;
        return await whatsAppService.testConnection();
      },
    },
    {
      name: 'Mock Service',
      test: async () => {
        const mock = new MockWhatsAppService();
        const result = await mock.testConnection();
        return result;
      },
    },
  ];
  
  for (const check of checks) {
    try {
      const result = await check.test();
      console.log(`${result ? '✅' : '❌'} ${check.name}`);
    } catch (error) {
      console.log(`❌ ${check.name}: ${error}`);
    }
  }
  
  console.log('\n🏁 Health Check Complete!');
};

// Auto-run tests in development
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  // Uncomment to run tests automatically in development
  // setTimeout(() => {
  //   runWhatsAppTests();
  //   healthCheck();
  // }, 1000);
}
