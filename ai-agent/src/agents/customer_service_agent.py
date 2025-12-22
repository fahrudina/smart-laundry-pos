"""Customer Service Agent for Smart Laundry POS."""

from typing import Optional, Dict, Any, List
from ..tools import CustomerTools, OrderTools
from ..config import config


class CustomerServiceAgent:
    """
    AI Agent for handling customer service inquiries.
    
    This agent can:
    - Check order status
    - Search customer information
    - Provide service pricing
    - Estimate pickup times
    - Check loyalty points
    """
    
    SYSTEM_PROMPT = """Anda adalah asisten layanan pelanggan Smart Laundry yang ramah dan membantu.
Gunakan bahasa Indonesia yang sopan dan profesional.
Berikan informasi yang akurat dan jelas.
Gunakan emoji secukupnya untuk membuat percakapan lebih menarik.
Selalu tawarkan bantuan lebih lanjut di akhir respons."""
    
    def __init__(
        self,
        customer_tools: Optional[CustomerTools] = None,
        order_tools: Optional[OrderTools] = None,
        gemini_client=None
    ):
        """
        Initialize CustomerServiceAgent.
        
        Args:
            customer_tools: Optional CustomerTools instance
            order_tools: Optional OrderTools instance
            gemini_client: Optional Gemini client for testing
        """
        self._customer_tools = customer_tools
        self._order_tools = order_tools
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
    
    def handle_inquiry(
        self,
        message: str,
        customer_phone: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Handle a customer inquiry.
        
        Args:
            message: Customer's message
            customer_phone: Optional phone number for context
            context: Optional additional context
            
        Returns:
            Response with answer and any retrieved data
        """
        if not message or not message.strip():
            return {
                "success": False,
                "response": "Maaf, pesan Anda kosong. Ada yang bisa saya bantu?",
                "data": None
            }
        
        message_lower = message.lower()
        
        # Intent detection and handling
        if self._is_status_inquiry(message_lower):
            return self._handle_status_inquiry(message, customer_phone)
        
        if self._is_price_inquiry(message_lower):
            return self._handle_price_inquiry(message)
        
        if self._is_points_inquiry(message_lower):
            return self._handle_points_inquiry(customer_phone)
        
        if self._is_pickup_inquiry(message_lower):
            return self._handle_pickup_inquiry(message, customer_phone)
        
        if self._is_greeting(message_lower):
            return self._handle_greeting()
        
        # Default: Use AI for general inquiries
        return self._handle_general_inquiry(message, customer_phone, context)
    
    def check_order_status(self, phone: str) -> Dict[str, Any]:
        """
        Check order status for a customer.
        
        Args:
            phone: Customer phone number
            
        Returns:
            Order status information
        """
        orders = self.order_tools.check_order_status(phone, limit=3)
        
        if not orders:
            return {
                "success": True,
                "response": "Tidak ditemukan pesanan untuk nomor ini. Pastikan nomor telepon sudah benar.",
                "orders": []
            }
        
        response_parts = ["📋 *Status Pesanan Anda:*\n"]
        
        for i, order in enumerate(orders, 1):
            response_parts.append(
                f"\n{i}. Pesanan #{order['id'][:8]}\n"
                f"   Status: {order['status_label']}\n"
                f"   Pembayaran: {order['payment_label']}\n"
                f"   Total: {order['formatted_total']}"
            )
        
        return {
            "success": True,
            "response": "".join(response_parts),
            "orders": orders
        }
    
    def get_service_prices(self, store_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Get available services and prices.
        
        Args:
            store_id: Optional store filter
            
        Returns:
            Service list with prices
        """
        services = self.order_tools.get_services(store_id)
        
        if not services:
            return {
                "success": True,
                "response": "Maaf, daftar layanan belum tersedia.",
                "services": []
            }
        
        response_parts = ["🧺 *Daftar Layanan & Harga:*\n"]
        
        current_category = None
        for service in services:
            category = service.get('category', 'Lainnya')
            if category != current_category:
                current_category = category
                response_parts.append(f"\n*{category}*")
            
            response_parts.append(
                f"\n• {service['name']}: {service['formatted_price']}/{service.get('unit', 'kg')}"
            )
        
        return {
            "success": True,
            "response": "".join(response_parts),
            "services": services
        }
    
    def check_points(self, phone: str) -> Dict[str, Any]:
        """
        Check customer loyalty points.
        
        Args:
            phone: Customer phone number
            
        Returns:
            Points information
        """
        if not phone:
            return {
                "success": False,
                "response": "Mohon berikan nomor telepon untuk cek poin.",
                "points": None
            }
        
        points = self.customer_tools.get_customer_points(phone)
        
        return {
            "success": True,
            "response": (
                f"⭐ *Poin Loyalitas Anda:*\n\n"
                f"Saldo Poin: {points['points_balance']} poin\n"
                f"Total Poin Diperoleh: {points['total_points_earned']} poin\n"
                f"Total Poin Ditukar: {points['total_points_redeemed']} poin"
            ),
            "points": points
        }
    
    def estimate_pickup(
        self,
        order_id: Optional[str] = None,
        phone: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Estimate pickup time for an order.
        
        Args:
            order_id: Specific order ID
            phone: Customer phone to find latest order
            
        Returns:
            Pickup estimation
        """
        if order_id:
            estimation = self.order_tools.estimate_pickup_time(order_id)
        elif phone:
            orders = self.order_tools.check_order_status(phone, limit=1)
            if orders:
                estimation = self.order_tools.estimate_pickup_time(orders[0]['id'])
            else:
                return {
                    "success": False,
                    "response": "Tidak ditemukan pesanan aktif.",
                    "estimation": None
                }
        else:
            return {
                "success": False,
                "response": "Mohon berikan nomor pesanan atau nomor telepon.",
                "estimation": None
            }
        
        return {
            "success": True,
            "response": (
                f"⏰ *Estimasi Pengambilan:*\n\n"
                f"Status: {estimation.get('status_label', estimation.get('current_status'))}\n"
                f"{estimation.get('message')}"
            ),
            "estimation": estimation
        }
    
    def _is_status_inquiry(self, message: str) -> bool:
        """Check if message is asking about order status."""
        keywords = ['status', 'pesanan', 'order', 'cek', 'check', 'lacak', 'track', 'dimana', 'mana']
        return any(kw in message for kw in keywords)
    
    def _is_price_inquiry(self, message: str) -> bool:
        """Check if message is asking about prices."""
        keywords = ['harga', 'price', 'biaya', 'tarif', 'berapa', 'cost', 'layanan', 'service']
        return any(kw in message for kw in keywords)
    
    def _is_points_inquiry(self, message: str) -> bool:
        """Check if message is asking about points."""
        keywords = ['poin', 'point', 'loyalti', 'loyalty', 'reward']
        return any(kw in message for kw in keywords)
    
    def _is_pickup_inquiry(self, message: str) -> bool:
        """Check if message is asking about pickup time."""
        keywords = ['kapan', 'selesai', 'ambil', 'pickup', 'ready', 'siap', 'jadi']
        return any(kw in message for kw in keywords)
    
    def _is_greeting(self, message: str) -> bool:
        """Check if message is a greeting."""
        keywords = ['halo', 'hello', 'hi', 'hai', 'selamat', 'pagi', 'siang', 'sore', 'malam', 'assalam']
        return any(kw in message for kw in keywords)
    
    def _handle_status_inquiry(
        self,
        message: str,
        phone: Optional[str]
    ) -> Dict[str, Any]:
        """Handle order status inquiry."""
        # Try to extract phone from message if not provided
        if not phone:
            phone = self._extract_phone(message)
        
        if not phone:
            return {
                "success": True,
                "response": (
                    "Untuk cek status pesanan, mohon berikan nomor telepon Anda.\n"
                    "Contoh: 081234567890"
                ),
                "data": None
            }
        
        return self.check_order_status(phone)
    
    def _handle_price_inquiry(self, message: str) -> Dict[str, Any]:
        """Handle price inquiry."""
        return self.get_service_prices()
    
    def _handle_points_inquiry(self, phone: Optional[str]) -> Dict[str, Any]:
        """Handle points inquiry."""
        if not phone:
            return {
                "success": True,
                "response": (
                    "Untuk cek poin, mohon berikan nomor telepon Anda.\n"
                    "Contoh: 081234567890"
                ),
                "data": None
            }
        
        return self.check_points(phone)
    
    def _handle_pickup_inquiry(
        self,
        message: str,
        phone: Optional[str]
    ) -> Dict[str, Any]:
        """Handle pickup time inquiry."""
        # Try to extract order ID from message
        order_id = self._extract_order_id(message)
        
        return self.estimate_pickup(order_id=order_id, phone=phone)
    
    def _handle_greeting(self) -> Dict[str, Any]:
        """Handle greeting message."""
        return {
            "success": True,
            "response": (
                "Halo! Selamat datang di Smart Laundry! 👋\n\n"
                "Saya siap membantu Anda. Silakan pilih:\n"
                "1. Cek status pesanan\n"
                "2. Lihat daftar harga\n"
                "3. Cek poin loyalitas\n"
                "4. Estimasi waktu selesai\n\n"
                "Atau ketik pertanyaan Anda langsung 😊"
            ),
            "data": None
        }
    
    def _handle_general_inquiry(
        self,
        message: str,
        phone: Optional[str],
        context: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Handle general inquiry using AI."""
        if not self.gemini_client:
            return {
                "success": True,
                "response": (
                    "Terima kasih atas pertanyaan Anda! 🙏\n\n"
                    "Untuk pertanyaan lebih lanjut, silakan hubungi kami:\n"
                    "📞 WhatsApp: 081234567890\n"
                    "🕐 Jam operasional: 07:00 - 21:00"
                ),
                "data": None
            }
        
        try:
            # Build context for AI
            ai_context = f"Customer phone: {phone}\n" if phone else ""
            if context:
                ai_context += f"Additional context: {context}\n"
            
            prompt = f"{self.SYSTEM_PROMPT}\n\n{ai_context}\nPertanyaan pelanggan: {message}"
            
            response = self.gemini_client.generate_content(prompt)
            
            return {
                "success": True,
                "response": response.text,
                "data": None,
                "ai_generated": True
            }
        except Exception as e:
            return {
                "success": False,
                "response": (
                    "Maaf, saya tidak dapat memproses pertanyaan Anda saat ini.\n"
                    "Silakan coba lagi atau hubungi customer service kami."
                ),
                "error": str(e)
            }
    
    def _extract_phone(self, message: str) -> Optional[str]:
        """Extract phone number from message."""
        import re
        # Match Indonesian phone patterns
        patterns = [
            r'08\d{8,11}',  # 08xxx
            r'\+62\d{9,12}',  # +62xxx
            r'62\d{9,12}',  # 62xxx
        ]
        
        for pattern in patterns:
            match = re.search(pattern, message)
            if match:
                return match.group()
        
        return None
    
    def _extract_order_id(self, message: str) -> Optional[str]:
        """Extract order ID from message."""
        import re
        # Match UUID pattern
        uuid_pattern = r'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
        match = re.search(uuid_pattern, message, re.IGNORECASE)
        if match:
            return match.group()
        
        # Match short ID (first 8 chars)
        short_pattern = r'#?([0-9a-f]{8})'
        match = re.search(short_pattern, message, re.IGNORECASE)
        if match:
            return match.group(1)
        
        return None
