"""Customer Service Agent using MCP Toolbox for Smart Laundry POS."""

import re
from typing import Optional, Dict, Any, List
from ..toolbox_client import LaundryToolboxClient
from ..config import config


class CustomerServiceAgent:
    """
    AI Agent for handling customer service inquiries using MCP Toolbox.
    
    This agent uses tools from the Toolbox server to:
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
        toolbox_client: Optional[LaundryToolboxClient] = None,
        gemini_client=None
    ):
        """
        Initialize CustomerServiceAgent.
        
        Args:
            toolbox_client: Optional LaundryToolboxClient instance
            gemini_client: Optional Gemini client for AI responses
        """
        self._toolbox_client = toolbox_client
        self._gemini_client = gemini_client
        self._tools_loaded = False
    
    @property
    def toolbox_client(self) -> LaundryToolboxClient:
        """Get or create Toolbox client."""
        if self._toolbox_client is None:
            self._toolbox_client = LaundryToolboxClient()
        return self._toolbox_client
    
    @property
    def gemini_client(self):
        """Get Gemini client lazily."""
        if self._gemini_client is None:
            try:
                import google.generativeai as genai
                genai.configure(api_key=config.GOOGLE_API_KEY)
                self._gemini_client = genai.GenerativeModel(config.GEMINI_MODEL)
            except (ImportError, Exception):
                self._gemini_client = None
        return self._gemini_client
    
    async def _ensure_tools_loaded(self):
        """Ensure customer service tools are loaded."""
        if not self._tools_loaded:
            await self.toolbox_client.load_customer_service_tools()
            self._tools_loaded = True
    
    async def handle_inquiry(
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
        
        await self._ensure_tools_loaded()
        message_lower = message.lower()
        
        # Intent detection and handling
        if self._is_status_inquiry(message_lower):
            return await self._handle_status_inquiry(message, customer_phone)
        
        if self._is_price_inquiry(message_lower):
            return await self._handle_price_inquiry()
        
        if self._is_points_inquiry(message_lower):
            return await self._handle_points_inquiry(customer_phone)
        
        if self._is_pickup_inquiry(message_lower):
            return await self._handle_pickup_inquiry(message, customer_phone)
        
        if self._is_greeting(message_lower):
            return self._handle_greeting()
        
        # Default: Use AI for general inquiries
        return self._handle_general_inquiry(message, customer_phone, context)
    
    async def check_order_status(self, phone: str) -> Dict[str, Any]:
        """
        Check order status for a customer.
        
        Args:
            phone: Customer phone number
            
        Returns:
            Order status information
        """
        await self._ensure_tools_loaded()
        
        try:
            orders = await self.toolbox_client.check_order_status(phone, limit=3)
            
            if not orders:
                return {
                    "success": True,
                    "response": "Tidak ditemukan pesanan untuk nomor ini. Pastikan nomor telepon sudah benar.",
                    "orders": []
                }
            
            response_parts = ["📋 *Status Pesanan Anda:*\n"]
            
            for i, order in enumerate(orders, 1):
                order_id = order.get('id', '')[:8] if order.get('id') else 'N/A'
                status = self._get_status_label(order.get('status', ''))
                payment = self._get_payment_label(order.get('payment_status', ''))
                total = config.format_currency(order.get('total_amount', 0))
                
                response_parts.append(
                    f"\n{i}. Pesanan #{order_id}\n"
                    f"   Status: {status}\n"
                    f"   Pembayaran: {payment}\n"
                    f"   Total: {total}"
                )
            
            return {
                "success": True,
                "response": "".join(response_parts),
                "orders": orders
            }
        except Exception as e:
            return {
                "success": False,
                "response": f"Terjadi kesalahan saat mengecek status pesanan.",
                "error": str(e)
            }
    
    async def get_service_prices(self, store_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Get available services with pricing.
        
        Args:
            store_id: Optional store ID filter
            
        Returns:
            Service listing
        """
        await self._ensure_tools_loaded()
        
        try:
            services = await self.toolbox_client.get_all_services(store_id or "")
            
            if not services:
                return {
                    "success": True,
                    "response": "Maaf, tidak ada layanan yang tersedia saat ini.",
                    "services": []
                }
            
            response_parts = ["🧺 *Daftar Layanan & Harga:*\n"]
            
            for service in services:
                name = service.get('name', 'N/A')
                price = config.format_currency(service.get('price', 0))
                unit = service.get('unit', 'kg')
                
                response_parts.append(f"\n• {name}: {price}/{unit}")
            
            response_parts.append("\n\n💬 Hubungi kami untuk informasi lebih lanjut!")
            
            return {
                "success": True,
                "response": "".join(response_parts),
                "services": services
            }
        except Exception as e:
            return {
                "success": False,
                "response": "Terjadi kesalahan saat mengambil daftar layanan.",
                "error": str(e)
            }
    
    async def check_points(self, phone: str) -> Dict[str, Any]:
        """
        Check loyalty points for a customer.
        
        Args:
            phone: Customer phone number
            
        Returns:
            Points information
        """
        if not phone:
            return {
                "success": False,
                "response": "Mohon berikan nomor telepon untuk mengecek poin.",
                "points": 0
            }
        
        await self._ensure_tools_loaded()
        
        try:
            customer = await self.toolbox_client.get_customer_points(phone)
            
            if not customer:
                return {
                    "success": True,
                    "response": "Tidak ditemukan data pelanggan dengan nomor ini.",
                    "points": 0
                }
            
            points = customer.get('points', 0)
            name = customer.get('name', 'Pelanggan')
            
            return {
                "success": True,
                "response": f"🎁 Halo {name}!\n\nPoin loyalitas Anda: *{points:,} poin*\n\nTerus kumpulkan poin untuk mendapatkan diskon menarik!",
                "points": points,
                "customer": customer
            }
        except Exception as e:
            return {
                "success": False,
                "response": "Terjadi kesalahan saat mengecek poin.",
                "error": str(e)
            }
    
    async def estimate_pickup(
        self,
        order_id: Optional[str] = None,
        phone: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Estimate pickup time for an order.
        
        Args:
            order_id: Optional order ID
            phone: Optional customer phone
            
        Returns:
            Pickup estimation
        """
        if not order_id and not phone:
            return {
                "success": False,
                "response": "Mohon berikan nomor pesanan atau nomor telepon.",
                "estimation": None
            }
        
        await self._ensure_tools_loaded()
        
        try:
            if order_id:
                order = await self.toolbox_client.get_order_by_id(order_id)
                if order:
                    return self._format_pickup_response(order)
            
            if phone:
                orders = await self.toolbox_client.check_order_status(phone, limit=1)
                if orders:
                    return self._format_pickup_response(orders[0])
            
            return {
                "success": True,
                "response": "Tidak ditemukan pesanan aktif.",
                "estimation": None
            }
        except Exception as e:
            return {
                "success": False,
                "response": "Terjadi kesalahan saat mengecek estimasi.",
                "error": str(e)
            }
    
    def _format_pickup_response(self, order: Dict) -> Dict[str, Any]:
        """Format pickup estimation response."""
        status = order.get('status', '')
        estimated = order.get('estimated_completion')
        
        status_messages = {
            'pending': 'Pesanan sedang menunggu diproses.',
            'processing': 'Pesanan sedang diproses.',
            'washing': 'Pakaian sedang dicuci.',
            'drying': 'Pakaian sedang dikeringkan.',
            'folding': 'Pakaian sedang dilipat.',
            'completed': 'Pesanan sudah selesai dan siap diambil! 🎉',
            'delivered': 'Pesanan sudah dikirim/diambil.'
        }
        
        message = status_messages.get(status, 'Silakan hubungi kami untuk informasi lebih lanjut.')
        
        if estimated and status not in ['completed', 'delivered']:
            message += f"\n\n⏰ Estimasi selesai: {estimated}"
        
        return {
            "success": True,
            "response": message,
            "estimation": estimated,
            "status": status
        }
    
    # Intent detection methods
    def _is_status_inquiry(self, message: str) -> bool:
        """Check if message is about order status."""
        keywords = ['status', 'pesanan', 'order', 'cek', 'dimana', 'sampai mana', 'sudah', 'belum']
        return any(kw in message for kw in keywords)
    
    def _is_price_inquiry(self, message: str) -> bool:
        """Check if message is about pricing."""
        keywords = ['harga', 'biaya', 'tarif', 'berapa', 'price', 'ongkos', 'bayar']
        return any(kw in message for kw in keywords)
    
    def _is_points_inquiry(self, message: str) -> bool:
        """Check if message is about loyalty points."""
        keywords = ['poin', 'point', 'points', 'loyalti', 'loyalty', 'reward']
        return any(kw in message for kw in keywords)
    
    def _is_pickup_inquiry(self, message: str) -> bool:
        """Check if message is about pickup time."""
        keywords = ['kapan', 'selesai', 'ambil', 'pickup', 'jadi', 'estimasi', 'waktu']
        return any(kw in message for kw in keywords)
    
    def _is_greeting(self, message: str) -> bool:
        """Check if message is a greeting."""
        keywords = ['halo', 'hello', 'hi', 'hai', 'selamat', 'pagi', 'siang', 'sore', 'malam', 'assalam']
        return any(kw in message for kw in keywords)
    
    # Handler methods
    async def _handle_status_inquiry(
        self,
        message: str,
        phone: Optional[str]
    ) -> Dict[str, Any]:
        """Handle order status inquiry."""
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
        
        return await self.check_order_status(phone)
    
    async def _handle_price_inquiry(self) -> Dict[str, Any]:
        """Handle price inquiry."""
        return await self.get_service_prices()
    
    async def _handle_points_inquiry(self, phone: Optional[str]) -> Dict[str, Any]:
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
        
        return await self.check_points(phone)
    
    async def _handle_pickup_inquiry(
        self,
        message: str,
        phone: Optional[str]
    ) -> Dict[str, Any]:
        """Handle pickup time inquiry."""
        order_id = self._extract_order_id(message)
        return await self.estimate_pickup(order_id=order_id, phone=phone)
    
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
            prompt = f"{self.SYSTEM_PROMPT}\n\nPertanyaan pelanggan: {message}"
            response = self.gemini_client.generate_content(prompt)
            
            return {
                "success": True,
                "response": response.text,
                "ai_generated": True
            }
        except Exception as e:
            return {
                "success": False,
                "response": "Maaf, terjadi kesalahan. Silakan coba lagi.",
                "error": str(e)
            }
    
    # Helper methods
    def _extract_phone(self, message: str) -> Optional[str]:
        """Extract phone number from message."""
        patterns = [
            r'(?:\+62|62|0)8[1-9][0-9]{7,10}',
            r'\b08[0-9]{8,11}\b'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, message)
            if match:
                return match.group()
        return None
    
    def _extract_order_id(self, message: str) -> Optional[str]:
        """Extract order ID from message."""
        # UUID pattern
        uuid_pattern = r'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
        match = re.search(uuid_pattern, message, re.IGNORECASE)
        if match:
            return match.group()
        
        # Short ID pattern (e.g., #12345678)
        short_pattern = r'#?([0-9a-f]{8})'
        match = re.search(short_pattern, message, re.IGNORECASE)
        if match:
            return match.group(1)
        
        return None
    
    def _get_status_label(self, status: str) -> str:
        """Get human-readable status label."""
        labels = {
            'pending': '⏳ Menunggu',
            'processing': '🔄 Diproses',
            'washing': '🧼 Dicuci',
            'drying': '💨 Dikeringkan',
            'folding': '👕 Dilipat',
            'completed': '✅ Selesai',
            'delivered': '📦 Dikirim',
            'cancelled': '❌ Dibatalkan'
        }
        return labels.get(status, status)
    
    def _get_payment_label(self, status: str) -> str:
        """Get human-readable payment label."""
        labels = {
            'unpaid': '⚠️ Belum Bayar',
            'paid': '✅ Lunas',
            'partial': '💳 Sebagian'
        }
        return labels.get(status, status)
