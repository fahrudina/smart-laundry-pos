import { MessageTemplate, OrderCreatedData, OrderCompletedData, OrderReadyForPickupData } from './types';

/**
 * Configuration for receipt URLs
 */
const getReceiptBaseUrl = (): string => {
  // Use environment variable if available, otherwise detect from current location
  if (import.meta.env.VITE_RECEIPT_BASE_URL) {
    return import.meta.env.VITE_RECEIPT_BASE_URL;
  }
  
  // In production, use the current domain
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  // Fallback for server-side rendering or build time
  return 'https://smart-laundry-pos.vercel.app';
};

/**
 * Get payment status in Indonesian
 */
const getPaymentStatusIndonesian = (status: string): string => {
  const statusMap: { [key: string]: string } = {
    'pending': 'Belum Lunas',
    'completed': 'Lunas',
    'down_payment': 'DP',
    'refunded': 'Dikembalikan'
  };
  return statusMap[status] || status;
};

/**
 * WhatsApp Message Templates
 * Contains pre-defined message templates for different scenarios
 */
export const messageTemplates: MessageTemplate = {
  /**
   * Template for order creation notification
   */
  orderCreated: (data: OrderCreatedData): string => {
    const currentDate = new Date().toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const currentTime = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    const estimatedDate = data.estimatedCompletion || 'Akan dikonfirmasi';

    // Build services list from order items
    const servicesList = data.orderItems.length > 0 
      ? data.orderItems.map(item => {
          let serviceInfo = `Tipe Laundry : ${item.service_name}`;
          if (item.service_type === 'kilo' && item.weight_kg) {
            serviceInfo += `\nBerat (kg) = ${item.weight_kg}`;
          }
          if (item.service_type === 'unit' && item.quantity) {
            serviceInfo += `\nJumlah (unit) = ${item.quantity}`;
          }
          serviceInfo += `\nHarga = Rp. ${item.service_price.toLocaleString('id-ID')},-`;
          return serviceInfo;
        }).join('\n\n')
      : 'Tipe Laundry : Regular';

    return `${data.storeInfo.name}
${data.storeInfo.address}
No. HP ${data.storeInfo.phone}
====================
Tanggal : ${currentDate} - ${currentTime}
Nama : ${data.customerName}
===================

${servicesList}

Subtotal = Rp. ${data.subtotal.toLocaleString('id-ID')},-

====================
Perkiraan Selesai : 
${estimatedDate}
====================
Status : ${getPaymentStatusIndonesian(data.paymentStatus)}

Terima kasih telah menggunakan layanan kami! 🙏
====================
Klik link dibawah ini untuk melihat nota digital
${getReceiptBaseUrl()}/receipt/${data.orderId}`;
  },

  /**
   * Template for order completion notification
   */
  orderCompleted: (data: OrderCompletedData): string => {
    const completedDate = new Date().toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const completedTime = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    // Build services list from order items
    const servicesList = data.orderItems.length > 0 
      ? data.orderItems.map(item => {
          let serviceInfo = `Tipe Laundry : ${item.service_name}`;
          if (item.service_type === 'kilo' && item.weight_kg) {
            serviceInfo += `\nBerat (kg) = ${item.weight_kg}`;
          }
          return serviceInfo;
        }).join('\n\n')
      : 'Tipe Laundry : Regular';

    return `🎉 *LAUNDRY SELESAI* 🎉

${data.storeInfo.name}
${data.storeInfo.address}
No. HP ${data.storeInfo.phone}
====================
Tanggal Selesai : ${completedDate} - ${completedTime}
No Nota : ${data.orderId.slice(-8).toUpperCase()}
Nama : ${data.customerName}
===================

${servicesList}
Total Bayar = Rp. ${data.totalAmount.toLocaleString('id-ID')},-

====================
Status : SELESAI ✅
Selesai pada : ${data.completedAt}
Siap diambil : YA
====================

Laundry Anda sudah selesai dan siap diambil!
Silakan datang ke toko dengan membawa nota ini.

====================
Klik link dibawah ini untuk melihat nota digital
${getReceiptBaseUrl()}/receipt/${data.orderId}`;
  },

  /**
   * Template for order ready for pickup notification
   */
  orderReadyForPickup: (data: OrderReadyForPickupData): string => {
    const readyDate = new Date().toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const readyTime = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    // Build services list from order items
    const servicesList = data.orderItems.length > 0 
      ? data.orderItems.map(item => {
          let serviceInfo = `Tipe Laundry : ${item.service_name}`;
          if (item.service_type === 'kilo' && item.weight_kg) {
            serviceInfo += `\nBerat (kg) = ${item.weight_kg}`;
          }
          return serviceInfo;
        }).join('\n\n')
      : 'Tipe Laundry : Regular';

    return `📦 *LAUNDRY SIAP DIAMBIL* 📦

Hai ${data.customerName},
Cucian anda sudah selesai, silahkan ambil di ${data.storeInfo.name}

====================
No Nota : ${data.orderId.slice(-8).toUpperCase()}

Total Bayar : Rp. ${data.totalAmount.toLocaleString('id-ID')},-
Status Bayar: ${getPaymentStatusIndonesian(data.paymentStatus)}

Terima kasih telah menggunakan layanan kami! 🙏
====================
Klik link dibawah ini untuk melihat nota digital
${getReceiptBaseUrl()}/receipt/${data.orderId}`;
  },
};

/**
 * Custom message builder for special cases
 */
export class MessageBuilder {
  /**
   * Create a custom order notification message
   */
  static customOrderMessage(
    customerName: string,
    orderId: string,
    customMessage: string
  ): string {
    return `📋 *Notifikasi Pesanan ${orderId}*

Halo ${customerName}!

${customMessage}

Terima kasih telah menggunakan layanan kami! 🙏

_Pesan otomatis dari Smart Laundry POS_`;
  }

  /**
   * Create a reminder message
   */
  static reminderMessage(
    customerName: string,
    orderId: string,
    daysOverdue: number
  ): string {
    return `⏰ *Pengingat Pengambilan Laundry*

Halo ${customerName}!

Pesanan laundry Anda dengan ID *${orderId}* sudah dapat diambil sejak ${daysOverdue} hari yang lalu.

Mohon segera ambil laundry Anda. Terima kasih! 🙏

_Pesan otomatis dari Smart Laundry POS_`;
  }

  /**
   * Create a promotional message
   */
  static promotionalMessage(
    customerName: string,
    promoDetails: string
  ): string {
    return `🎁 *Promo Spesial Untuk Anda!*

Halo ${customerName}! ✨

${promoDetails}

Jangan lewatkan kesempatan ini! 🚀

_Pesan dari Smart Laundry POS_`;
  }
}
