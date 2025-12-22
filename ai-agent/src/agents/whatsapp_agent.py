"""WhatsApp Agent for Smart Laundry POS."""

from typing import Optional, Dict, Any, List
from ..tools import CustomerTools, OrderTools, NotificationTools
from ..config import config


class WhatsAppAgent:
    """
    AI Agent for handling WhatsApp interactions.
    
    This agent can:
    - Process orders via WhatsApp
    - Send notifications
    - Handle customer inquiries
    - Automate re-engagement campaigns
    """
    
    SYSTEM_PROMPT = """Anda adalah asisten WhatsApp Smart Laundry.
Gunakan bahasa Indonesia yang santai namun profesional.
Gunakan emoji untuk membuat percakapan lebih menarik.
Jaga respons tetap singkat dan jelas.
Selalu konfirmasi pemahaman sebelum melakukan aksi."""
    
    def __init__(
        self,
        customer_tools: Optional[CustomerTools] = None,
        order_tools: Optional[OrderTools] = None,
        notification_tools: Optional[NotificationTools] = None,
        gemini_client=None
    ):
        """
        Initialize WhatsAppAgent.
        
        Args:
            customer_tools: Optional CustomerTools instance
            order_tools: Optional OrderTools instance
            notification_tools: Optional NotificationTools instance
            gemini_client: Optional Gemini client for testing
        """
        self._customer_tools = customer_tools
        self._order_tools = order_tools
        self._notification_tools = notification_tools
        self._gemini_client = gemini_client
    
    @property
    def customer_tools(self) -> CustomerTools:
        """Get CustomerTools instance."""
        if self._customer_tools is None:
            self._customer_tools = CustomerTools()
        return self._customer_tools
    
    @property
    def order_tools(self) -> OrderTools:
        """Get OrderTools instance."""
        if self._order_tools is None:
            self._order_tools = OrderTools()
        return self._order_tools
    
    @property
    def notification_tools(self) -> NotificationTools:
        """Get NotificationTools instance."""
        if self._notification_tools is None:
            self._notification_tools = NotificationTools()
        return self._notification_tools
    
    @property
    def gemini_client(self):
        """Get Gemini client lazily."""
        if self._gemini_client is None:
            try:
                import google.generativeai as genai
                genai.configure(api_key=config.GOOGLE_API_KEY)
                self._gemini_client = genai.GenerativeModel(config.GEMINI_MODEL)
            except ImportError:
                self._gemini_client = None
        return self._gemini_client
    
    def handle_message(
        self,
        phone: str,
        message: str,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Handle incoming WhatsApp message.
        
        Args:
            phone: Sender's phone number
            message: Message content
            context: Optional conversation context
            
        Returns:
            Response to send back
        """
        if not phone:
            return {
                "success": False,
                "response": "Phone number is required",
                "action": None
            }
        
        if not message or not message.strip():
            return {
                "success": True,
                "response": "Halo! Ada yang bisa saya bantu? 😊",
                "action": None
            }
        
        message_lower = message.lower().strip()
        
        # Intent detection
        if self._is_order_intent(message_lower):
            return self._handle_order_intent(phone, message, context)
        
        if self._is_status_intent(message_lower):
            return self._handle_status_intent(phone)
        
        if self._is_price_intent(message_lower):
            return self._handle_price_intent()
        
        if self._is_points_intent(message_lower):
            return self._handle_points_intent(phone)
        
        if self._is_help_intent(message_lower):
            return self._handle_help_intent()
        
        if self._is_greeting(message_lower):
            return self._handle_greeting(phone)
        
        # Default: AI-powered response
        return self._handle_general_message(phone, message, context)
    
    def send_order_created_notification(
        self,
        order_id: str,
        customer_name: str,
        customer_phone: str,
        total_amount: float
    ) -> Dict[str, Any]:
        """
        Send order created notification.
        
        Args:
            order_id: Order UUID
            customer_name: Customer name
            customer_phone: Customer phone
            total_amount: Order total
            
        Returns:
            Send result
        """
        return self.notification_tools.send_order_notification(
            order_id=order_id,
            notification_type='created',
            customer_name=customer_name,
            customer_phone=customer_phone,
            total_amount=total_amount
        )
    
    def send_order_ready_notification(
        self,
        order_id: str,
        customer_name: str,
        customer_phone: str,
        total_amount: float
    ) -> Dict[str, Any]:
        """
        Send order ready for pickup notification.
        
        Args:
            order_id: Order UUID
            customer_name: Customer name
            customer_phone: Customer phone
            total_amount: Order total
            
        Returns:
            Send result
        """
        return self.notification_tools.send_order_notification(
            order_id=order_id,
            notification_type='ready',
            customer_name=customer_name,
            customer_phone=customer_phone,
            total_amount=total_amount
        )
    
    def send_payment_reminder(
        self,
        order_id: str,
        customer_name: str,
        customer_phone: str,
        total_amount: float
    ) -> Dict[str, Any]:
        """
        Send payment reminder notification.
        
        Args:
            order_id: Order UUID
            customer_name: Customer name
            customer_phone: Customer phone
            total_amount: Order total
            
        Returns:
            Send result
        """
        return self.notification_tools.send_order_notification(
            order_id=order_id,
            notification_type='payment_reminder',
            customer_name=customer_name,
            customer_phone=customer_phone,
            total_amount=total_amount
        )
    
    def send_reengagement_campaign(
        self,
        customers: List[Dict[str, Any]],
        promo_message: str
    ) -> Dict[str, Any]:
        """
        Send re-engagement campaign to inactive customers.
        
        Args:
            customers: List of customer dicts with name and phone
            promo_message: Promotional message
            
        Returns:
            Campaign results
        """
        if not customers:
            return {
                "success": False,
                "error": "No customers provided",
                "sent": 0,
                "failed": 0
            }
        
        recipients = []
        for customer in customers:
            recipients.append({
                "name": customer.get('name', 'Pelanggan'),
                "phone": customer.get('phone'),
                "promo_message": promo_message
            })
        
        return self.notification_tools.send_bulk_notifications(
            recipients=recipients,
            notification_type='promo'
        )
    
    def notify_ready_orders(
        self,
        store_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Send notifications for all orders ready for pickup.
        
        Args:
            store_id: Optional store filter
            
        Returns:
            Notification results
        """
        ready_orders = self.order_tools.get_orders_ready_for_pickup(store_id)
        
        if not ready_orders:
            return {
                "success": True,
                "message": "No orders ready for pickup",
                "sent": 0,
                "failed": 0
            }
        
        results = []
        sent = 0
        failed = 0
        
        for order in ready_orders:
            result = self.send_order_ready_notification(
                order_id=order['id'],
                customer_name=order.get('customer_name', 'Pelanggan'),
                customer_phone=order.get('customer_phone', ''),
                total_amount=order.get('total_amount', 0)
            )
            
            results.append({
                "order_id": order['id'],
                "success": result.get('success', False)
            })
            
            if result.get('success'):
                sent += 1
            else:
                failed += 1
        
        return {
            "success": True,
            "sent": sent,
            "failed": failed,
            "total": len(ready_orders),
            "results": results
        }
    
    def notify_pending_payments(
        self,
        hours_old: int = 24,
        store_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Send payment reminders for pending payments.
        
        Args:
            hours_old: Minimum hours since order
            store_id: Optional store filter
            
        Returns:
            Notification results
        """
        pending_orders = self.order_tools.get_pending_payments(hours_old, store_id)
        
        if not pending_orders:
            return {
                "success": True,
                "message": "No pending payments to remind",
                "sent": 0,
                "failed": 0
            }
        
        results = []
        sent = 0
        failed = 0
        
        for order in pending_orders:
            result = self.send_payment_reminder(
                order_id=order['id'],
                customer_name=order.get('customer_name', 'Pelanggan'),
                customer_phone=order.get('customer_phone', ''),
                total_amount=order.get('total_amount', 0)
            )
            
            results.append({
                "order_id": order['id'],
                "success": result.get('success', False)
            })
            
            if result.get('success'):
                sent += 1
            else:
                failed += 1
        
        return {
            "success": True,
            "sent": sent,
            "failed": failed,
            "total": len(pending_orders),
            "results": results
        }
    
    def _is_order_intent(self, message: str) -> bool:
        """Check if message is an order intent."""
        keywords = ['order', 'pesan', 'laundry', 'cuci', 'kg', 'kilogram', 'baju', 'selimut']
        return any(kw in message for kw in keywords)
    
    def _is_status_intent(self, message: str) -> bool:
        """Check if message is a status check intent."""
        keywords = ['status', 'cek', 'check', 'pesanan', 'lacak', 'track', 'dimana', 'sudah']
        return any(kw in message for kw in keywords)
    
    def _is_price_intent(self, message: str) -> bool:
        """Check if message is asking about prices."""
        keywords = ['harga', 'price', 'biaya', 'tarif', 'berapa', 'daftar']
        return any(kw in message for kw in keywords)
    
    def _is_points_intent(self, message: str) -> bool:
        """Check if message is about points."""
        keywords = ['poin', 'point', 'reward', 'loyalti']
        return any(kw in message for kw in keywords)
    
    def _is_help_intent(self, message: str) -> bool:
        """Check if message is asking for help."""
        keywords = ['help', 'bantuan', 'bantu', 'menu', 'cara', 'how']
        return any(kw in message for kw in keywords)
    
    def _is_greeting(self, message: str) -> bool:
        """Check if message is a greeting."""
        keywords = ['halo', 'hello', 'hi', 'hai', 'selamat', 'pagi', 'siang', 'sore', 'malam']
        return any(kw in message for kw in keywords)
    
    def _handle_order_intent(
        self,
        phone: str,
        message: str,
        context: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Handle order creation intent."""
        # For now, guide to manual ordering
        # In production, could parse order details from message
        services = self.order_tools.get_services()
        
        response = (
            "📝 *Mau laundry?*\n\n"
            "Silakan kirim detail pesanan:\n"
            "• Nama Anda\n"
            "• Jenis layanan\n"
            "• Perkiraan berat (kg)\n\n"
            "Contoh:\n"
            "_Andi, cuci kering, 3kg_\n\n"
            "Atau datang langsung ke outlet kami! 🏪"
        )
        
        return {
            "success": True,
            "response": response,
            "action": "order_intent",
            "services": services[:5] if services else []
        }
    
    def _handle_status_intent(self, phone: str) -> Dict[str, Any]:
        """Handle order status check."""
        orders = self.order_tools.check_order_status(phone, limit=3)
        
        if not orders:
            return {
                "success": True,
                "response": (
                    "🔍 Tidak ditemukan pesanan untuk nomor ini.\n\n"
                    "Pastikan nomor telepon sudah terdaftar.\n"
                    "Atau hubungi kami untuk bantuan lebih lanjut!"
                ),
                "action": "status_check",
                "orders": []
            }
        
        response = "📋 *Pesanan Anda:*\n\n"
        
        for order in orders:
            status_emoji = {
                'pending': '⏳',
                'in_progress': '🔄',
                'ready_for_pickup': '✅',
                'completed': '🎉',
                'cancelled': '❌'
            }.get(order.get('status'), '❓')
            
            response += (
                f"{status_emoji} #{order['id'][:8]}\n"
                f"   Status: {order['status_label']}\n"
                f"   Total: {order['formatted_total']}\n\n"
            )
        
        return {
            "success": True,
            "response": response,
            "action": "status_check",
            "orders": orders
        }
    
    def _handle_price_intent(self) -> Dict[str, Any]:
        """Handle price inquiry."""
        services = self.order_tools.get_services()
        
        if not services:
            return {
                "success": True,
                "response": "Maaf, daftar harga belum tersedia. Silakan hubungi kami! 📞",
                "action": "price_inquiry",
                "services": []
            }
        
        response = "💰 *Daftar Harga:*\n\n"
        
        for service in services[:8]:
            response += f"• {service['name']}: {service['formatted_price']}/{service.get('unit', 'kg')}\n"
        
        if len(services) > 8:
            response += f"\n_...dan {len(services) - 8} layanan lainnya_"
        
        response += "\n\n📍 Kunjungi outlet kami untuk info lengkap!"
        
        return {
            "success": True,
            "response": response,
            "action": "price_inquiry",
            "services": services
        }
    
    def _handle_points_intent(self, phone: str) -> Dict[str, Any]:
        """Handle points inquiry."""
        points = self.customer_tools.get_customer_points(phone)
        
        return {
            "success": True,
            "response": (
                f"⭐ *Poin Anda:*\n\n"
                f"💎 Saldo: {points['points_balance']} poin\n"
                f"📈 Total Diperoleh: {points['total_points_earned']} poin\n"
                f"🎁 Total Ditukar: {points['total_points_redeemed']} poin\n\n"
                f"_Kumpulkan poin untuk diskon spesial!_"
            ),
            "action": "points_inquiry",
            "points": points
        }
    
    def _handle_help_intent(self) -> Dict[str, Any]:
        """Handle help request."""
        return {
            "success": True,
            "response": (
                "🤖 *Bantuan Smart Laundry*\n\n"
                "Saya bisa membantu:\n\n"
                "📋 *Cek Status*\n"
                "   Ketik: status / cek pesanan\n\n"
                "💰 *Lihat Harga*\n"
                "   Ketik: harga / daftar harga\n\n"
                "⭐ *Cek Poin*\n"
                "   Ketik: poin / cek poin\n\n"
                "📝 *Pesan Laundry*\n"
                "   Ketik: order / pesan\n\n"
                "Ada pertanyaan lain? Langsung ketik saja! 😊"
            ),
            "action": "help"
        }
    
    def _handle_greeting(self, phone: str) -> Dict[str, Any]:
        """Handle greeting message."""
        # Try to get customer name
        customer = self.customer_tools.get_customer_by_phone(phone)
        name = customer.get('name', 'Kak') if customer else 'Kak'
        
        return {
            "success": True,
            "response": (
                f"Halo {name}! 👋\n\n"
                f"Selamat datang di Smart Laundry! 🧺\n\n"
                f"Ada yang bisa saya bantu hari ini?\n"
                f"• Cek status pesanan\n"
                f"• Lihat daftar harga\n"
                f"• Cek poin loyalitas\n\n"
                f"Ketik saja ya! 😊"
            ),
            "action": "greeting",
            "customer": customer
        }
    
    def _handle_general_message(
        self,
        phone: str,
        message: str,
        context: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Handle general message with AI."""
        if not self.gemini_client:
            return {
                "success": True,
                "response": (
                    "Maaf, saya tidak mengerti maksud Anda. 😅\n\n"
                    "Coba ketik *help* untuk melihat apa yang bisa saya bantu!\n\n"
                    "Atau hubungi customer service kami:\n"
                    "📞 081234567890"
                ),
                "action": "unknown"
            }
        
        try:
            prompt = f"{self.SYSTEM_PROMPT}\n\nPesan dari pelanggan: {message}"
            response = self.gemini_client.generate_content(prompt)
            
            return {
                "success": True,
                "response": response.text,
                "action": "ai_response",
                "ai_generated": True
            }
        except Exception as e:
            return {
                "success": True,
                "response": (
                    "Maaf, ada kendala teknis. 🙏\n\n"
                    "Silakan coba lagi atau hubungi customer service kami."
                ),
                "action": "error",
                "error": str(e)
            }
