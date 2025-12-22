"""Tests for NotificationTools - 100% coverage."""

import pytest
from unittest.mock import Mock, patch, MagicMock
import httpx

from src.tools.notification_tools import NotificationTools


class TestNotificationToolsInit:
    """Test NotificationTools initialization."""
    
    def test_init_with_client(self, mock_http_client):
        """Test initialization with provided client."""
        tools = NotificationTools(http_client=mock_http_client)
        assert tools._http_client == mock_http_client
    
    def test_init_without_client(self):
        """Test initialization without client."""
        tools = NotificationTools()
        assert tools._http_client is None
    
    def test_http_client_lazy_loading(self, mock_http_client):
        """Test HTTP client is loaded lazily."""
        tools = NotificationTools(http_client=mock_http_client)
        client = tools.http_client
        assert client == mock_http_client


class TestSendWhatsAppMessage:
    """Test send_whatsapp_message method."""
    
    def test_send_message_disabled(self, mock_http_client):
        """Test sending when WhatsApp is disabled."""
        tools = NotificationTools(http_client=mock_http_client)
        
        with patch('src.tools.notification_tools.config') as mock_config:
            mock_config.WHATSAPP_ENABLED = False
            
            result = tools.send_whatsapp_message("08123", "Hello")
            
            assert result['success'] == False
            assert result['simulated'] == True
    
    def test_send_message_no_api_url(self, mock_http_client):
        """Test sending when API URL not configured."""
        tools = NotificationTools(http_client=mock_http_client)
        
        with patch('src.tools.notification_tools.config') as mock_config:
            mock_config.WHATSAPP_ENABLED = True
            mock_config.WHATSAPP_API_URL = ""
            
            result = tools.send_whatsapp_message("08123", "Hello")
            
            assert result['success'] == False
            assert 'API URL' in result['error']
    
    def test_send_message_success(self, mock_http_client):
        """Test successful message send."""
        tools = NotificationTools(http_client=mock_http_client)
        
        with patch('src.tools.notification_tools.config') as mock_config:
            mock_config.WHATSAPP_ENABLED = True
            mock_config.WHATSAPP_API_URL = "https://api.example.com/send"
            mock_config.WHATSAPP_API_KEY = "test-key"
            
            result = tools.send_whatsapp_message("08123", "Hello")
            
            assert result['success'] == True
    
    def test_send_message_api_error(self, mock_http_client):
        """Test handling API error response."""
        mock_http_client.post.return_value.status_code = 500
        mock_http_client.post.return_value.text = "Server error"
        
        tools = NotificationTools(http_client=mock_http_client)
        
        with patch('src.tools.notification_tools.config') as mock_config:
            mock_config.WHATSAPP_ENABLED = True
            mock_config.WHATSAPP_API_URL = "https://api.example.com/send"
            mock_config.WHATSAPP_API_KEY = "test-key"
            
            result = tools.send_whatsapp_message("08123", "Hello")
            
            assert result['success'] == False
    
    def test_send_message_request_error(self, mock_http_client):
        """Test handling request exception."""
        mock_http_client.post.side_effect = httpx.RequestError("Connection failed")
        
        tools = NotificationTools(http_client=mock_http_client)
        
        with patch('src.tools.notification_tools.config') as mock_config:
            mock_config.WHATSAPP_ENABLED = True
            mock_config.WHATSAPP_API_URL = "https://api.example.com/send"
            mock_config.WHATSAPP_API_KEY = "test-key"
            
            result = tools.send_whatsapp_message("08123", "Hello")
            
            assert result['success'] == False
            assert 'Request failed' in result['error']
    
    def test_send_message_empty_phone(self, mock_http_client):
        """Test with empty phone number."""
        tools = NotificationTools(http_client=mock_http_client)
        
        result = tools.send_whatsapp_message("", "Hello")
        
        assert result['success'] == False
        assert 'Phone number' in result['error']
    
    def test_send_message_empty_message(self, mock_http_client):
        """Test with empty message."""
        tools = NotificationTools(http_client=mock_http_client)
        
        result = tools.send_whatsapp_message("08123", "")
        
        assert result['success'] == False
        assert 'Message' in result['error']


class TestSendOrderNotification:
    """Test send_order_notification method."""
    
    def test_send_order_created(self, mock_http_client):
        """Test sending order created notification."""
        tools = NotificationTools(http_client=mock_http_client)
        
        with patch.object(tools, 'send_whatsapp_message') as mock_send:
            mock_send.return_value = {"success": True}
            
            result = tools.send_order_notification(
                order_id="order-001",
                notification_type="created",
                customer_name="Budi",
                customer_phone="08123",
                total_amount=50000
            )
            
            assert result['notification_type'] == 'created'
            mock_send.assert_called_once()
    
    def test_send_order_ready(self, mock_http_client):
        """Test sending order ready notification."""
        tools = NotificationTools(http_client=mock_http_client)
        
        with patch.object(tools, 'send_whatsapp_message') as mock_send:
            mock_send.return_value = {"success": True}
            
            result = tools.send_order_notification(
                order_id="order-001",
                notification_type="ready",
                customer_name="Budi",
                customer_phone="08123",
                total_amount=50000
            )
            
            assert result['notification_type'] == 'ready'
    
    def test_send_order_completed(self, mock_http_client):
        """Test sending order completed notification."""
        tools = NotificationTools(http_client=mock_http_client)
        
        with patch.object(tools, 'send_whatsapp_message') as mock_send:
            mock_send.return_value = {"success": True}
            
            result = tools.send_order_notification(
                order_id="order-001",
                notification_type="completed",
                customer_name="Budi",
                customer_phone="08123",
                total_amount=50000
            )
            
            assert result['notification_type'] == 'completed'
    
    def test_send_payment_reminder(self, mock_http_client):
        """Test sending payment reminder notification."""
        tools = NotificationTools(http_client=mock_http_client)
        
        with patch.object(tools, 'send_whatsapp_message') as mock_send:
            mock_send.return_value = {"success": True}
            
            result = tools.send_order_notification(
                order_id="order-001",
                notification_type="payment_reminder",
                customer_name="Budi",
                customer_phone="08123",
                total_amount=50000
            )
            
            assert result['notification_type'] == 'payment_reminder'
    
    def test_send_invalid_notification_type(self, mock_http_client):
        """Test with invalid notification type."""
        tools = NotificationTools(http_client=mock_http_client)
        
        result = tools.send_order_notification(
            order_id="order-001",
            notification_type="invalid",
            customer_name="Budi",
            customer_phone="08123"
        )
        
        assert result['success'] == False
        assert 'Invalid notification type' in result['error']


class TestSendPromoMessage:
    """Test send_promo_message method."""
    
    def test_send_promo_success(self, mock_http_client):
        """Test sending promo message."""
        tools = NotificationTools(http_client=mock_http_client)
        
        with patch.object(tools, 'send_whatsapp_message') as mock_send:
            mock_send.return_value = {"success": True}
            
            result = tools.send_promo_message(
                customer_name="Budi",
                customer_phone="08123",
                promo_message="Diskon 20%!"
            )
            
            assert result['notification_type'] == 'promo'
    
    def test_send_promo_with_expiry(self, mock_http_client):
        """Test sending promo with custom expiry."""
        tools = NotificationTools(http_client=mock_http_client)
        
        with patch.object(tools, 'send_whatsapp_message') as mock_send:
            mock_send.return_value = {"success": True}
            
            result = tools.send_promo_message(
                customer_name="Budi",
                customer_phone="08123",
                promo_message="Diskon 20%!",
                expiry_date="31 Desember 2024"
            )
            
            assert result['notification_type'] == 'promo'
    
    def test_send_promo_empty_message(self, mock_http_client):
        """Test with empty promo message."""
        tools = NotificationTools(http_client=mock_http_client)
        
        result = tools.send_promo_message(
            customer_name="Budi",
            customer_phone="08123",
            promo_message=""
        )
        
        assert result['success'] == False


class TestSendCustomMessage:
    """Test send_custom_message method."""
    
    def test_send_custom_success(self, mock_http_client):
        """Test sending custom message."""
        tools = NotificationTools(http_client=mock_http_client)
        
        with patch.object(tools, 'send_whatsapp_message') as mock_send:
            mock_send.return_value = {"success": True}
            
            result = tools.send_custom_message("08123", "Custom message")
            
            assert result['success'] == True


class TestSendBulkNotifications:
    """Test send_bulk_notifications method."""
    
    def test_send_bulk_empty_recipients(self, mock_http_client):
        """Test with empty recipients list."""
        tools = NotificationTools(http_client=mock_http_client)
        
        result = tools.send_bulk_notifications([])
        
        assert result['success'] == False
        assert result['sent'] == 0
    
    def test_send_bulk_custom(self, mock_http_client):
        """Test sending bulk custom messages."""
        tools = NotificationTools(http_client=mock_http_client)
        
        with patch.object(tools, 'send_custom_message') as mock_send:
            mock_send.return_value = {"success": True}
            
            recipients = [
                {"phone": "08123", "name": "Budi", "message": "Hello"},
                {"phone": "08124", "name": "Siti", "message": "Hi"}
            ]
            
            result = tools.send_bulk_notifications(recipients, notification_type='custom')
            
            assert result['total'] == 2
    
    def test_send_bulk_promo(self, mock_http_client):
        """Test sending bulk promo messages."""
        tools = NotificationTools(http_client=mock_http_client)
        
        with patch.object(tools, 'send_promo_message') as mock_send:
            mock_send.return_value = {"success": True}
            
            recipients = [
                {"phone": "08123", "name": "Budi", "promo_message": "Diskon!"}
            ]
            
            result = tools.send_bulk_notifications(recipients, notification_type='promo')
            
            assert result['total'] == 1
    
    def test_send_bulk_order_notification(self, mock_http_client):
        """Test sending bulk order notifications."""
        tools = NotificationTools(http_client=mock_http_client)
        
        with patch.object(tools, 'send_order_notification') as mock_send:
            mock_send.return_value = {"success": True}
            
            recipients = [
                {"phone": "08123", "name": "Budi", "order_id": "order-001", "total": 50000}
            ]
            
            result = tools.send_bulk_notifications(recipients, notification_type='created')
            
            assert result['total'] == 1
    
    def test_send_bulk_mixed_results(self, mock_http_client):
        """Test bulk send with mixed success/failure."""
        tools = NotificationTools(http_client=mock_http_client)
        
        call_count = [0]
        
        def mock_send(*args, **kwargs):
            call_count[0] += 1
            if call_count[0] == 1:
                return {"success": True}
            return {"success": False, "error": "Failed"}
        
        with patch.object(tools, 'send_custom_message', side_effect=mock_send):
            recipients = [
                {"phone": "08123", "name": "Budi", "message": "Hello"},
                {"phone": "08124", "name": "Siti", "message": "Hi"}
            ]
            
            result = tools.send_bulk_notifications(recipients)
            
            assert result['sent'] == 1
            assert result['failed'] == 1


class TestGenerateMessage:
    """Test generate_message method."""
    
    def test_generate_order_created(self, mock_http_client):
        """Test generating order created message."""
        tools = NotificationTools(http_client=mock_http_client)
        
        with patch('src.tools.notification_tools.config') as mock_config:
            mock_config.format_currency = lambda x: f"Rp {x:,.0f}"
            
            message = tools.generate_message(
                'order_created',
                customer_name="Budi",
                order_id="order-001",
                total="Rp 50,000"
            )
            
            assert "Budi" in message
            assert "order-00" in message
    
    def test_generate_custom(self, mock_http_client):
        """Test generating custom message."""
        tools = NotificationTools(http_client=mock_http_client)
        
        message = tools.generate_message('custom', message="Hello World")
        
        assert message == "Hello World"
    
    def test_generate_missing_variable(self, mock_http_client):
        """Test generating with missing variable."""
        tools = NotificationTools(http_client=mock_http_client)
        
        message = tools.generate_message('order_created')  # Missing variables
        
        assert "Template error" in message


class TestGetAvailableTemplates:
    """Test get_available_templates method."""
    
    def test_get_templates(self, mock_http_client):
        """Test getting available templates."""
        tools = NotificationTools(http_client=mock_http_client)
        
        templates = tools.get_available_templates()
        
        assert isinstance(templates, list)
        assert len(templates) > 0
    
    def test_templates_have_name_and_preview(self, mock_http_client):
        """Test templates have required fields."""
        tools = NotificationTools(http_client=mock_http_client)
        
        templates = tools.get_available_templates()
        
        for template in templates:
            assert 'name' in template
            assert 'preview' in template


class TestCleanPhone:
    """Test _clean_phone method."""
    
    def test_clean_phone_spaces(self, mock_http_client):
        """Test cleaning phone with spaces."""
        tools = NotificationTools(http_client=mock_http_client)
        
        result = tools._clean_phone("0812 3456 7890")
        
        assert " " not in result
    
    def test_clean_phone_dashes(self, mock_http_client):
        """Test cleaning phone with dashes."""
        tools = NotificationTools(http_client=mock_http_client)
        
        result = tools._clean_phone("0812-3456-7890")
        
        assert "-" not in result
    
    def test_clean_phone_convert_to_international(self, mock_http_client):
        """Test converting 0 prefix to 62."""
        tools = NotificationTools(http_client=mock_http_client)
        
        result = tools._clean_phone("081234567890")
        
        assert result.startswith("62")
    
    def test_clean_phone_already_international(self, mock_http_client):
        """Test phone already in international format."""
        tools = NotificationTools(http_client=mock_http_client)
        
        result = tools._clean_phone("6281234567890")
        
        assert result == "6281234567890"
    
    def test_clean_phone_plus_prefix(self, mock_http_client):
        """Test removing + prefix."""
        tools = NotificationTools(http_client=mock_http_client)
        
        result = tools._clean_phone("+6281234567890")
        
        assert result == "6281234567890"


class TestTemplates:
    """Test message templates."""
    
    def test_all_templates_exist(self, mock_http_client):
        """Test all expected templates exist."""
        tools = NotificationTools(http_client=mock_http_client)
        
        assert 'order_created' in tools.TEMPLATES
        assert 'order_ready' in tools.TEMPLATES
        assert 'order_completed' in tools.TEMPLATES
        assert 'payment_reminder' in tools.TEMPLATES
        assert 'promo' in tools.TEMPLATES
        assert 'custom' in tools.TEMPLATES
    
    def test_templates_are_strings(self, mock_http_client):
        """Test all templates are strings."""
        tools = NotificationTools(http_client=mock_http_client)
        
        for name, template in tools.TEMPLATES.items():
            assert isinstance(template, str)
