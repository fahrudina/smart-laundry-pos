"""Notification tools for AI Agent."""

from typing import Optional, List, Dict, Any
import httpx
from ..config import config


class NotificationTools:
    """Tools for sending notifications via WhatsApp and other channels."""
    
    # Message templates in Indonesian
    TEMPLATES = {
        'order_created': (
            "Halo {customer_name}! 👋\n\n"
            "Pesanan laundry Anda telah diterima.\n"
            "📋 No. Pesanan: {order_id}\n"
            "💰 Total: {total}\n\n"
            "Kami akan memberitahu saat pesanan siap. Terima kasih! 🙏"
        ),
        'order_ready': (
            "Halo {customer_name}! 🎉\n\n"
            "Kabar baik! Laundry Anda sudah SIAP DIAMBIL!\n"
            "📋 No. Pesanan: {order_id}\n"
            "💰 Total: {total}\n\n"
            "Silakan ambil di outlet kami. Ditunggu ya! 😊"
        ),
        'order_completed': (
            "Halo {customer_name}! ⭐\n\n"
            "Terima kasih sudah menggunakan layanan kami!\n"
            "Kami senang bisa melayani Anda.\n\n"
            "Sampai jumpa di pesanan berikutnya! 👋"
        ),
        'payment_reminder': (
            "Halo {customer_name}! 📢\n\n"
            "Ini pengingat untuk pembayaran pesanan:\n"
            "📋 No. Pesanan: {order_id}\n"
            "💰 Total: {total}\n\n"
            "Silakan selesaikan pembayaran. Terima kasih! 🙏"
        ),
        'promo': (
            "Halo {customer_name}! 🎁\n\n"
            "Sudah lama tidak ke Smart Laundry nih!\n"
            "Kami kangen melayani Anda! 😊\n\n"
            "🎁 PROMO KHUSUS untuk Anda:\n"
            "{promo_message}\n\n"
            "Berlaku sampai {expiry_date}.\n"
            "Yuk, laundry lagi! 🧺✨"
        ),
        'custom': "{message}"
    }
    
    def __init__(self, http_client=None):
        """
        Initialize NotificationTools.
        
        Args:
            http_client: Optional HTTP client for testing
        """
        self._http_client = http_client
    
    @property
    def http_client(self):
        """Get HTTP client lazily."""
        if self._http_client is None:
            self._http_client = httpx.Client(timeout=30.0)
        return self._http_client
    
    def send_whatsapp_message(
        self,
        phone: str,
        message: str
    ) -> Dict[str, Any]:
        """
        Send a WhatsApp message.
        
        Args:
            phone: Recipient phone number
            message: Message content
            
        Returns:
            Send result with success status
        """
        if not phone:
            return {
                "success": False,
                "error": "Phone number is required"
            }
        
        if not message:
            return {
                "success": False,
                "error": "Message is required"
            }
        
        phone = self._clean_phone(phone)
        
        if not config.WHATSAPP_ENABLED:
            return {
                "success": False,
                "error": "WhatsApp integration is disabled",
                "simulated": True,
                "phone": phone,
                "message": message
            }
        
        if not config.WHATSAPP_API_URL:
            return {
                "success": False,
                "error": "WhatsApp API URL not configured"
            }
        
        try:
            # Build headers - support both Basic Auth and Bearer token
            headers = {"Content-Type": "application/json"}
            auth = None
            
            if config.WHATSAPP_API_KEY:
                # Check if it's Basic Auth format (username:password)
                if ':' in config.WHATSAPP_API_KEY:
                    # Basic Auth for WhatsPoints
                    username, password = config.WHATSAPP_API_KEY.split(':', 1)
                    auth = (username, password)
                else:
                    # Bearer token for other services
                    headers["Authorization"] = f"Bearer {config.WHATSAPP_API_KEY}"
            
            # Format phone for WhatsPoints (expects +country code)
            formatted_phone = phone
            if not phone.startswith('+'):
                # Assume Indonesian number if no country code
                if phone.startswith('0'):
                    formatted_phone = '+62' + phone[1:]
                else:
                    formatted_phone = '+' + phone
            
            response = self.http_client.post(
                config.WHATSAPP_API_URL,
                json={
                    "to": formatted_phone,  # WhatsPoints uses "to" field
                    "message": message
                },
                headers=headers,
                auth=auth
            )
            
            if response.status_code == 200:
                return {
                    "success": True,
                    "phone": phone,
                    "message_length": len(message)
                }
            else:
                return {
                    "success": False,
                    "error": f"API returned status {response.status_code}",
                    "details": response.text
                }
        
        except httpx.RequestError as e:
            return {
                "success": False,
                "error": f"Request failed: {str(e)}"
            }
    
    def send_order_notification(
        self,
        order_id: str,
        notification_type: str,
        customer_name: str,
        customer_phone: str,
        total_amount: float = 0
    ) -> Dict[str, Any]:
        """
        Send order-related notification.
        
        Args:
            order_id: Order UUID
            notification_type: 'created', 'ready', 'completed', 'payment_reminder'
            customer_name: Customer name
            customer_phone: Customer phone number
            total_amount: Order total
            
        Returns:
            Send result
        """
        valid_types = ['created', 'ready', 'completed', 'payment_reminder']
        
        if notification_type not in valid_types:
            return {
                "success": False,
                "error": f"Invalid notification type. Must be one of: {valid_types}"
            }
        
        template_key = f"order_{notification_type}"
        template = self.TEMPLATES.get(template_key, self.TEMPLATES.get('custom'))
        
        # Format the message
        message = template.format(
            customer_name=customer_name,
            order_id=order_id[:8] if order_id else "N/A",  # Short ID
            total=config.format_currency(total_amount)
        )
        
        result = self.send_whatsapp_message(customer_phone, message)
        result['notification_type'] = notification_type
        result['order_id'] = order_id
        
        return result
    
    def send_promo_message(
        self,
        customer_name: str,
        customer_phone: str,
        promo_message: str,
        expiry_date: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Send promotional message.
        
        Args:
            customer_name: Customer name
            customer_phone: Customer phone
            promo_message: Promo details
            expiry_date: Optional expiry date string
            
        Returns:
            Send result
        """
        if not promo_message:
            return {
                "success": False,
                "error": "Promo message is required"
            }
        
        if not expiry_date:
            from datetime import datetime, timedelta
            expiry_date = (datetime.now() + timedelta(days=7)).strftime('%d %B %Y')
        
        message = self.TEMPLATES['promo'].format(
            customer_name=customer_name,
            promo_message=promo_message,
            expiry_date=expiry_date
        )
        
        result = self.send_whatsapp_message(customer_phone, message)
        result['notification_type'] = 'promo'
        
        return result
    
    def send_custom_message(
        self,
        phone: str,
        message: str
    ) -> Dict[str, Any]:
        """
        Send a custom message.
        
        Args:
            phone: Recipient phone
            message: Custom message content
            
        Returns:
            Send result
        """
        return self.send_whatsapp_message(phone, message)
    
    def send_bulk_notifications(
        self,
        recipients: List[Dict[str, Any]],
        notification_type: str = 'custom'
    ) -> Dict[str, Any]:
        """
        Send notifications to multiple recipients.
        
        Args:
            recipients: List of {phone, name, message} or {phone, name, order_id, total}
            notification_type: Type of notification
            
        Returns:
            Bulk send results
        """
        if not recipients:
            return {
                "success": False,
                "error": "No recipients provided",
                "sent": 0,
                "failed": 0
            }
        
        results = []
        sent = 0
        failed = 0
        
        for recipient in recipients:
            phone = recipient.get('phone')
            name = recipient.get('name', 'Pelanggan')
            
            if notification_type == 'custom':
                message = recipient.get('message', '')
                result = self.send_custom_message(phone, message)
            elif notification_type == 'promo':
                promo_msg = recipient.get('promo_message', 'Diskon spesial untuk Anda!')
                result = self.send_promo_message(name, phone, promo_msg)
            else:
                order_id = recipient.get('order_id', '')
                total = recipient.get('total', 0)
                result = self.send_order_notification(
                    order_id, notification_type, name, phone, total
                )
            
            results.append({
                "phone": phone,
                "success": result.get('success', False),
                "error": result.get('error')
            })
            
            if result.get('success'):
                sent += 1
            else:
                failed += 1
        
        return {
            "success": failed == 0,
            "sent": sent,
            "failed": failed,
            "total": len(recipients),
            "results": results
        }
    
    def generate_message(
        self,
        template_name: str,
        **kwargs
    ) -> str:
        """
        Generate a message from template without sending.
        
        Args:
            template_name: Template key
            **kwargs: Template variables
            
        Returns:
            Formatted message string
        """
        template = self.TEMPLATES.get(template_name, self.TEMPLATES.get('custom'))
        
        try:
            return template.format(**kwargs)
        except KeyError as e:
            return f"Template error: missing variable {e}"
    
    def get_available_templates(self) -> List[Dict[str, Any]]:
        """
        Get list of available message templates.
        
        Returns:
            List of template info
        """
        return [
            {
                "name": name,
                "preview": template[:100] + "..." if len(template) > 100 else template
            }
            for name, template in self.TEMPLATES.items()
        ]
    
    def _clean_phone(self, phone: str) -> str:
        """Clean and format phone number."""
        phone = phone.strip().replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
        
        # Convert to international format for Indonesia
        if phone.startswith('0'):
            phone = '62' + phone[1:]
        elif not phone.startswith('62') and not phone.startswith('+62'):
            phone = '62' + phone
        
        # Remove + prefix if present
        phone = phone.lstrip('+')
        
        return phone
