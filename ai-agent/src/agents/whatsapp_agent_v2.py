"""WhatsApp Agent using MCP Toolbox for Smart Laundry POS."""

import re
from typing import Optional, Dict, Any
from ..toolbox_client import LaundryToolboxClient
from ..config import config


class WhatsAppAgent:
    """
    AI Agent for handling WhatsApp messages using MCP Toolbox.
    
    This agent processes incoming WhatsApp messages and provides:
    - Quick order status checks
    - Service information
    - Points balance
    - Automated responses
    """
    
    WELCOME_MESSAGE = """Halo! Selamat datang di Smart Laundry! 👋

Ketik salah satu:
1️⃣ CEK - Cek status pesanan
2️⃣ HARGA - Lihat daftar harga
3️⃣ POIN - Cek poin loyalitas
4️⃣ HELP - Bantuan lainnya"""
    
    def __init__(
        self,
        toolbox_client: Optional[LaundryToolboxClient] = None
    ):
        """
        Initialize WhatsAppAgent.
        
        Args:
            toolbox_client: Optional LaundryToolboxClient instance
        """
        self._toolbox_client = toolbox_client
        self._tools_loaded = False
    
    @property
    def toolbox_client(self) -> LaundryToolboxClient:
        """Get or create Toolbox client."""
        if self._toolbox_client is None:
            self._toolbox_client = LaundryToolboxClient()
        return self._toolbox_client
    
    async def _ensure_tools_loaded(self):
        """Ensure WhatsApp tools are loaded."""
        if not self._tools_loaded:
            await self.toolbox_client.load_whatsapp_tools()
            self._tools_loaded = True
    
    async def process_message(
        self,
        message: str,
        sender_phone: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Process incoming WhatsApp message.
        
        Args:
            message: Message content
            sender_phone: Sender's phone number
            metadata: Optional message metadata
            
        Returns:
            Response to send back
        """
        if not message or not message.strip():
            return {
                "success": True,
                "response": self.WELCOME_MESSAGE,
                "action": "welcome"
            }
        
        await self._ensure_tools_loaded()
        message_clean = message.strip().upper()
        
        # Command handling
        if message_clean in ['CEK', 'STATUS', '1']:
            return await self._handle_check_status(sender_phone)
        
        if message_clean in ['HARGA', 'PRICE', '2']:
            return await self._handle_price_inquiry()
        
        if message_clean in ['POIN', 'POINTS', '3']:
            return await self._handle_points_inquiry(sender_phone)
        
        if message_clean in ['HELP', 'BANTUAN', '4']:
            return self._handle_help()
        
        if self._is_greeting(message.lower()):
            return {
                "success": True,
                "response": self.WELCOME_MESSAGE,
                "action": "greeting"
            }
        
        # Check if message contains order ID
        order_id = self._extract_order_id(message)
        if order_id:
            return await self._handle_order_lookup(order_id)
        
        # Default response
        return {
            "success": True,
            "response": (
                "Maaf, saya tidak mengerti pesan Anda.\n\n" +
                self.WELCOME_MESSAGE
            ),
            "action": "unknown"
        }
    
    async def _handle_check_status(self, phone: str) -> Dict[str, Any]:
        """Handle order status check."""
        try:
            orders = await self.toolbox_client.check_order_status(phone, limit=3)
            
            if not orders:
                return {
                    "success": True,
                    "response": (
                        "Tidak ditemukan pesanan aktif untuk nomor Anda.\n\n"
                        "Jika Anda memiliki pesanan, pastikan nomor telepon yang "
                        "terdaftar sudah benar."
                    ),
                    "action": "status_not_found"
                }
            
            response = "📋 *Status Pesanan Anda:*\n"
            
            for i, order in enumerate(orders, 1):
                order_id = order.get('id', '')[:8]
                status = self._get_status_label(order.get('status', ''))
                payment = self._get_payment_label(order.get('payment_status', ''))
                total = config.format_currency(order.get('total_amount', 0))
                
                response += f"""
{i}. #{order_id}
   Status: {status}
   Bayar: {payment}
   Total: {total}
"""
            
            return {
                "success": True,
                "response": response,
                "action": "status_found",
                "data": orders
            }
        except Exception as e:
            return {
                "success": False,
                "response": "Maaf, terjadi kesalahan. Silakan coba lagi nanti.",
                "error": str(e)
            }
    
    async def _handle_price_inquiry(self) -> Dict[str, Any]:
        """Handle service price inquiry."""
        try:
            services = await self.toolbox_client.get_all_services("")
            
            if not services:
                return {
                    "success": True,
                    "response": "Maaf, daftar layanan sedang tidak tersedia.",
                    "action": "prices_unavailable"
                }
            
            response = "🧺 *Daftar Layanan & Harga:*\n"
            
            for svc in services:
                name = svc.get('name', 'N/A')
                price = config.format_currency(svc.get('price', 0))
                unit = svc.get('unit', 'kg')
                response += f"\n• {name}: {price}/{unit}"
            
            response += "\n\n📍 Kunjungi outlet kami atau order via WhatsApp!"
            
            return {
                "success": True,
                "response": response,
                "action": "prices",
                "data": services
            }
        except Exception as e:
            return {
                "success": False,
                "response": "Maaf, gagal mengambil daftar harga.",
                "error": str(e)
            }
    
    async def _handle_points_inquiry(self, phone: str) -> Dict[str, Any]:
        """Handle loyalty points inquiry."""
        try:
            customer = await self.toolbox_client.get_customer_points(phone)
            
            if not customer:
                return {
                    "success": True,
                    "response": (
                        "Anda belum terdaftar sebagai member.\n\n"
                        "Kunjungi outlet kami untuk mendaftar dan mulai "
                        "kumpulkan poin! 🎁"
                    ),
                    "action": "not_member"
                }
            
            name = customer.get('name', 'Pelanggan')
            points = customer.get('points', 0)
            
            return {
                "success": True,
                "response": f"""🎁 *Poin Loyalitas*

Halo {name}!
Poin Anda: *{points:,} poin*

Terus kumpulkan poin untuk tukar reward menarik!""",
                "action": "points",
                "data": customer
            }
        except Exception as e:
            return {
                "success": False,
                "response": "Maaf, gagal mengecek poin Anda.",
                "error": str(e)
            }
    
    def _handle_help(self) -> Dict[str, Any]:
        """Handle help request."""
        return {
            "success": True,
            "response": """ℹ️ *Bantuan Smart Laundry*

📱 *Perintah yang tersedia:*
• CEK - Cek status pesanan
• HARGA - Lihat daftar harga
• POIN - Cek poin loyalitas

📞 *Hubungi Kami:*
• WhatsApp: 081234567890
• Jam Operasional: 07:00 - 21:00

🏪 *Layanan Kami:*
• Cuci Kering Setrika
• Cuci Kiloan
• Dry Cleaning
• Express (Same Day)
• Delivery

Ketik perintah atau pertanyaan Anda!""",
            "action": "help"
        }
    
    async def _handle_order_lookup(self, order_id: str) -> Dict[str, Any]:
        """Handle order lookup by ID."""
        try:
            order = await self.toolbox_client.get_order_by_id(order_id)
            
            if not order:
                return {
                    "success": True,
                    "response": f"Pesanan #{order_id[:8]} tidak ditemukan.",
                    "action": "order_not_found"
                }
            
            status = self._get_status_label(order.get('status', ''))
            payment = self._get_payment_label(order.get('payment_status', ''))
            total = config.format_currency(order.get('total_amount', 0))
            customer = order.get('customer_name', 'N/A')
            
            return {
                "success": True,
                "response": f"""📋 *Detail Pesanan #{order_id[:8]}*

👤 Pelanggan: {customer}
📊 Status: {status}
💳 Pembayaran: {payment}
💰 Total: {total}""",
                "action": "order_found",
                "data": order
            }
        except Exception as e:
            return {
                "success": False,
                "response": "Maaf, gagal mencari pesanan.",
                "error": str(e)
            }
    
    def _is_greeting(self, message: str) -> bool:
        """Check if message is a greeting."""
        greetings = ['halo', 'hello', 'hi', 'hai', 'hey', 'assalam', 'pagi', 'siang', 'sore', 'malam']
        return any(g in message for g in greetings)
    
    def _extract_order_id(self, message: str) -> Optional[str]:
        """Extract order ID from message."""
        # UUID pattern
        uuid_pattern = r'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
        match = re.search(uuid_pattern, message, re.IGNORECASE)
        if match:
            return match.group()
        
        # Short ID (8 chars)
        short_pattern = r'#?([0-9a-f]{8})\b'
        match = re.search(short_pattern, message, re.IGNORECASE)
        if match:
            return match.group(1)
        
        return None
    
    def _get_status_label(self, status: str) -> str:
        """Get emoji status label."""
        labels = {
            'pending': '⏳ Menunggu',
            'processing': '🔄 Diproses',
            'washing': '🧼 Dicuci',
            'drying': '💨 Kering',
            'folding': '👕 Lipat',
            'completed': '✅ Selesai',
            'delivered': '📦 Dikirim',
            'cancelled': '❌ Batal'
        }
        return labels.get(status, status)
    
    def _get_payment_label(self, status: str) -> str:
        """Get payment status label."""
        labels = {
            'unpaid': '⚠️ Belum Bayar',
            'paid': '✅ Lunas',
            'partial': '💳 DP'
        }
        return labels.get(status, status)


# Webhook handler for WhatsApp integration
async def handle_whatsapp_webhook(
    message: str,
    sender_phone: str,
    toolbox_url: Optional[str] = None
) -> str:
    """
    Handle incoming WhatsApp webhook.
    
    Args:
        message: Message content
        sender_phone: Sender's phone
        toolbox_url: Optional Toolbox URL
        
    Returns:
        Response message string
    """
    async with LaundryToolboxClient(toolbox_url) as client:
        agent = WhatsAppAgent(toolbox_client=client)
        result = await agent.process_message(message, sender_phone)
        return result.get('response', 'Maaf, terjadi kesalahan.')
