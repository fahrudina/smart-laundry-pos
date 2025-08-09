import { MessageTemplate, OrderCreatedData, OrderCompletedData } from './types';

/**
 * WhatsApp Message Templates
 * Contains pre-defined message templates for different scenarios
 */
export const messageTemplates: MessageTemplate = {
  /**
   * Template for order creation notification
   */
  orderCreated: (data: OrderCreatedData): string => {
    const servicesList = data.services.length > 0 
      ? data.services.join(', ')
      : 'Various services';

    return `🧺 *Pesanan Laundry Berhasil Dibuat*

Halo ${data.customerName}! ✨

Pesanan Anda telah diterima dengan detail:
📋 *ID Pesanan:* ${data.orderId}
💰 *Total:* Rp${data.totalAmount.toLocaleString('id-ID')}
🧼 *Layanan:* ${servicesList}
⏰ *Estimasi Selesai:* ${data.estimatedCompletion}

Terima kasih telah mempercayakan laundry Anda kepada kami! 🙏

_Pesan otomatis dari Smart Laundry POS_`;
  },

  /**
   * Template for order completion notification
   */
  orderCompleted: (data: OrderCompletedData): string => {
    const servicesList = data.services.length > 0 
      ? data.services.join(', ')
      : 'Various services';

    return `🎉 *Laundry Anda Sudah Selesai!*

Halo ${data.customerName}! ✨

Kabar baik! Pesanan laundry Anda sudah selesai:
📋 *ID Pesanan:* ${data.orderId}
💰 *Total:* Rp${data.totalAmount.toLocaleString('id-ID')}
🧼 *Layanan:* ${servicesList}
✅ *Selesai pada:* ${data.completedAt}

Silakan datang untuk mengambil laundry Anda. Terima kasih! 🙏

_Pesan otomatis dari Smart Laundry POS_`;
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
