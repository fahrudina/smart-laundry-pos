"""Tests for WhatsAppAgent - 100% coverage."""

import pytest
from datetime import datetime
from unittest.mock import Mock, patch, MagicMock, AsyncMock

from src.agents.whatsapp_agent import WhatsAppAgent
from src.tools import CustomerTools, OrderTools, NotificationTools


class TestWhatsAppAgentInit:
    """Test WhatsAppAgent initialization."""
    
    def test_init_with_tools(self, mock_supabase):
        """Test initialization with provided tools."""
        customer_tools = CustomerTools(supabase_client=mock_supabase)
        order_tools = OrderTools(supabase_client=mock_supabase)
        notification_tools = NotificationTools()
        
        agent = WhatsAppAgent(
            customer_tools=customer_tools,
            order_tools=order_tools,
            notification_tools=notification_tools
        )
        
        assert agent._customer_tools == customer_tools
        assert agent._order_tools == order_tools
        assert agent._notification_tools == notification_tools
    
    def test_init_without_tools(self):
        """Test initialization without tools."""
        agent = WhatsAppAgent()
        
        assert agent._customer_tools is None
        assert agent._order_tools is None
        assert agent._notification_tools is None
    
    def test_tools_lazy_loading(self, mock_supabase):
        """Test tools are loaded lazily."""
        customer_tools = CustomerTools(supabase_client=mock_supabase)
        order_tools = OrderTools(supabase_client=mock_supabase)
        notification_tools = NotificationTools()
        
        agent = WhatsAppAgent(
            customer_tools=customer_tools,
            order_tools=order_tools,
            notification_tools=notification_tools
        )
        
        assert agent.customer_tools == customer_tools
        assert agent.order_tools == order_tools
        assert agent.notification_tools == notification_tools


class TestProcessMessage:
    """Test process_message method."""
    
    def test_process_empty_message(self, mock_supabase):
        """Test processing empty message."""
        agent = WhatsAppAgent(
            customer_tools=CustomerTools(supabase_client=mock_supabase),
            order_tools=OrderTools(supabase_client=mock_supabase),
            notification_tools=NotificationTools()
        )
        
        result = agent.process_message("", "081234567890")
        
        assert result['success'] == False
        assert 'kosong' in result.get('response', '').lower() or result.get('error')
    
    def test_process_greeting(self, mock_supabase):
        """Test processing greeting message."""
        agent = WhatsAppAgent(
            customer_tools=CustomerTools(supabase_client=mock_supabase),
            order_tools=OrderTools(supabase_client=mock_supabase),
            notification_tools=NotificationTools()
        )
        
        result = agent.process_message("Halo", "081234567890")
        
        assert result['success'] == True
        assert 'response' in result
    
    def test_process_status_check(self, mock_supabase):
        """Test processing status check."""
        agent = WhatsAppAgent(
            customer_tools=CustomerTools(supabase_client=mock_supabase),
            order_tools=OrderTools(supabase_client=mock_supabase),
            notification_tools=NotificationTools()
        )
        
        result = agent.process_message("cek status pesanan", "081234567890")
        
        assert result['success'] == True
    
    def test_process_order_intent(self, mock_supabase):
        """Test processing order intent."""
        agent = WhatsAppAgent(
            customer_tools=CustomerTools(supabase_client=mock_supabase),
            order_tools=OrderTools(supabase_client=mock_supabase),
            notification_tools=NotificationTools()
        )
        
        result = agent.process_message("saya mau laundry", "081234567890")
        
        assert result['success'] == True
    
    def test_process_price_inquiry(self, mock_supabase):
        """Test processing price inquiry."""
        agent = WhatsAppAgent(
            customer_tools=CustomerTools(supabase_client=mock_supabase),
            order_tools=OrderTools(supabase_client=mock_supabase),
            notification_tools=NotificationTools()
        )
        
        result = agent.process_message("berapa harga laundry?", "081234567890")
        
        assert result['success'] == True
    
    def test_process_help_request(self, mock_supabase):
        """Test processing help request."""
        agent = WhatsAppAgent(
            customer_tools=CustomerTools(supabase_client=mock_supabase),
            order_tools=OrderTools(supabase_client=mock_supabase),
            notification_tools=NotificationTools()
        )
        
        result = agent.process_message("bantuan", "081234567890")
        
        assert result['success'] == True


class TestIntentDetection:
    """Test intent detection methods."""
    
    def test_is_greeting(self, mock_supabase):
        """Test greeting detection."""
        agent = WhatsAppAgent(
            customer_tools=CustomerTools(supabase_client=mock_supabase),
            order_tools=OrderTools(supabase_client=mock_supabase)
        )
        
        assert agent._is_greeting("halo") == True
        assert agent._is_greeting("hai") == True
        assert agent._is_greeting("selamat pagi") == True
        assert agent._is_greeting("cek pesanan") == False
    
    def test_is_status_check(self, mock_supabase):
        """Test status check detection."""
        agent = WhatsAppAgent(
            customer_tools=CustomerTools(supabase_client=mock_supabase),
            order_tools=OrderTools(supabase_client=mock_supabase)
        )
        
        assert agent._is_status_check("cek status") == True
        assert agent._is_status_check("pesanan saya gimana") == True
        assert agent._is_status_check("halo") == False
    
    def test_is_order_intent(self, mock_supabase):
        """Test order intent detection."""
        agent = WhatsAppAgent(
            customer_tools=CustomerTools(supabase_client=mock_supabase),
            order_tools=OrderTools(supabase_client=mock_supabase)
        )
        
        assert agent._is_order_intent("mau laundry") == True
        assert agent._is_order_intent("pesan cuci") == True
        assert agent._is_order_intent("halo") == False
    
    def test_is_price_inquiry(self, mock_supabase):
        """Test price inquiry detection."""
        agent = WhatsAppAgent(
            customer_tools=CustomerTools(supabase_client=mock_supabase),
            order_tools=OrderTools(supabase_client=mock_supabase)
        )
        
        assert agent._is_price_inquiry("berapa harga") == True
        assert agent._is_price_inquiry("tarif laundry") == True
        assert agent._is_price_inquiry("cek pesanan") == False
    
    def test_is_help_request(self, mock_supabase):
        """Test help request detection."""
        agent = WhatsAppAgent(
            customer_tools=CustomerTools(supabase_client=mock_supabase),
            order_tools=OrderTools(supabase_client=mock_supabase)
        )
        
        assert agent._is_help_request("bantuan") == True
        assert agent._is_help_request("help") == True
        assert agent._is_help_request("menu") == True
        assert agent._is_help_request("halo") == False


class TestHandleGreeting:
    """Test _handle_greeting method."""
    
    def test_greeting_existing_customer(self, mock_supabase):
        """Test greeting for existing customer."""
        agent = WhatsAppAgent(
            customer_tools=CustomerTools(supabase_client=mock_supabase),
            order_tools=OrderTools(supabase_client=mock_supabase)
        )
        
        result = agent._handle_greeting("081234567890")
        
        assert result['success'] == True
        assert 'response' in result
    
    def test_greeting_new_customer(self, mock_supabase):
        """Test greeting for new customer."""
        agent = WhatsAppAgent(
            customer_tools=CustomerTools(supabase_client=mock_supabase),
            order_tools=OrderTools(supabase_client=mock_supabase)
        )
        
        result = agent._handle_greeting("000000000000")
        
        assert result['success'] == True


class TestHandleStatusCheck:
    """Test _handle_status_check method."""
    
    def test_status_with_orders(self, mock_supabase):
        """Test status check with existing orders."""
        agent = WhatsAppAgent(
            customer_tools=CustomerTools(supabase_client=mock_supabase),
            order_tools=OrderTools(supabase_client=mock_supabase)
        )
        
        result = agent._handle_status_check("081234567890")
        
        assert result['success'] == True
    
    def test_status_no_orders(self, mock_supabase):
        """Test status check with no orders."""
        agent = WhatsAppAgent(
            customer_tools=CustomerTools(supabase_client=mock_supabase),
            order_tools=OrderTools(supabase_client=mock_supabase)
        )
        
        result = agent._handle_status_check("000000000000")
        
        assert result['success'] == True
        assert 'tidak ada' in result.get('response', '').lower()


class TestHandleOrderIntent:
    """Test _handle_order_intent method."""
    
    def test_order_intent_response(self, mock_supabase):
        """Test handling order intent."""
        agent = WhatsAppAgent(
            customer_tools=CustomerTools(supabase_client=mock_supabase),
            order_tools=OrderTools(supabase_client=mock_supabase)
        )
        
        result = agent._handle_order_intent("081234567890", "mau laundry 3 kg")
        
        assert result['success'] == True
        assert 'response' in result


class TestHandlePriceInquiry:
    """Test _handle_price_inquiry method."""
    
    def test_price_inquiry_response(self, mock_supabase):
        """Test handling price inquiry."""
        agent = WhatsAppAgent(
            customer_tools=CustomerTools(supabase_client=mock_supabase),
            order_tools=OrderTools(supabase_client=mock_supabase)
        )
        
        result = agent._handle_price_inquiry()
        
        assert result['success'] == True
        assert 'response' in result


class TestHandleHelpRequest:
    """Test _handle_help_request method."""
    
    def test_help_response(self, mock_supabase):
        """Test handling help request."""
        agent = WhatsAppAgent(
            customer_tools=CustomerTools(supabase_client=mock_supabase),
            order_tools=OrderTools(supabase_client=mock_supabase)
        )
        
        result = agent._handle_help_request()
        
        assert result['success'] == True
        assert 'response' in result
        # Should contain menu options


class TestHandleUnknown:
    """Test _handle_unknown method."""
    
    def test_unknown_response(self, mock_supabase):
        """Test handling unknown message."""
        agent = WhatsAppAgent(
            customer_tools=CustomerTools(supabase_client=mock_supabase),
            order_tools=OrderTools(supabase_client=mock_supabase)
        )
        
        result = agent._handle_unknown("081234567890", "xyz unknown message")
        
        assert result['success'] == True
        assert 'response' in result


class TestSendNotification:
    """Test send_notification method."""
    
    @pytest.mark.asyncio
    async def test_send_order_created(self, mock_supabase):
        """Test sending order created notification."""
        notification_tools = NotificationTools()
        agent = WhatsAppAgent(
            customer_tools=CustomerTools(supabase_client=mock_supabase),
            order_tools=OrderTools(supabase_client=mock_supabase),
            notification_tools=notification_tools
        )
        
        with patch.object(notification_tools, 'send_order_notification', new_callable=AsyncMock) as mock_send:
            mock_send.return_value = {'success': True}
            
            result = await agent.send_notification(
                phone="081234567890",
                notification_type="order_created",
                order_id="order-001"
            )
            
            assert result['success'] == True
    
    @pytest.mark.asyncio
    async def test_send_order_ready(self, mock_supabase):
        """Test sending order ready notification."""
        notification_tools = NotificationTools()
        agent = WhatsAppAgent(
            customer_tools=CustomerTools(supabase_client=mock_supabase),
            order_tools=OrderTools(supabase_client=mock_supabase),
            notification_tools=notification_tools
        )
        
        with patch.object(notification_tools, 'send_pickup_reminder', new_callable=AsyncMock) as mock_send:
            mock_send.return_value = {'success': True}
            
            result = await agent.send_notification(
                phone="081234567890",
                notification_type="order_ready",
                order_id="order-001"
            )
            
            assert result['success'] == True
    
    @pytest.mark.asyncio
    async def test_send_promo(self, mock_supabase):
        """Test sending promo notification."""
        notification_tools = NotificationTools()
        agent = WhatsAppAgent(
            customer_tools=CustomerTools(supabase_client=mock_supabase),
            order_tools=OrderTools(supabase_client=mock_supabase),
            notification_tools=notification_tools
        )
        
        with patch.object(notification_tools, 'send_promo_message', new_callable=AsyncMock) as mock_send:
            mock_send.return_value = {'success': True}
            
            result = await agent.send_notification(
                phone="081234567890",
                notification_type="promo",
                promo_text="Diskon 20% hari ini!"
            )
            
            assert result['success'] == True


class TestBroadcast:
    """Test broadcast_message method."""
    
    @pytest.mark.asyncio
    async def test_broadcast_to_phones(self, mock_supabase):
        """Test broadcasting to multiple phones."""
        notification_tools = NotificationTools()
        agent = WhatsAppAgent(
            customer_tools=CustomerTools(supabase_client=mock_supabase),
            order_tools=OrderTools(supabase_client=mock_supabase),
            notification_tools=notification_tools
        )
        
        phones = ["081234567890", "081234567891", "081234567892"]
        message = "Promo akhir tahun!"
        
        with patch.object(notification_tools, 'send_whatsapp', new_callable=AsyncMock) as mock_send:
            mock_send.return_value = {'success': True}
            
            result = await agent.broadcast_message(phones, message)
            
            assert result['success'] == True
            assert result['sent_count'] == 3
    
    @pytest.mark.asyncio
    async def test_broadcast_partial_failure(self, mock_supabase):
        """Test broadcast with partial failures."""
        notification_tools = NotificationTools()
        agent = WhatsAppAgent(
            customer_tools=CustomerTools(supabase_client=mock_supabase),
            order_tools=OrderTools(supabase_client=mock_supabase),
            notification_tools=notification_tools
        )
        
        phones = ["081234567890", "081234567891"]
        message = "Promo!"
        
        with patch.object(notification_tools, 'send_whatsapp', new_callable=AsyncMock) as mock_send:
            mock_send.side_effect = [
                {'success': True},
                {'success': False, 'error': 'Failed'}
            ]
            
            result = await agent.broadcast_message(phones, message)
            
            assert result['sent_count'] == 1
            assert result['failed_count'] == 1


class TestExtractInfo:
    """Test information extraction methods."""
    
    def test_extract_phone_from_message(self, mock_supabase):
        """Test extracting phone from message."""
        agent = WhatsAppAgent(
            customer_tools=CustomerTools(supabase_client=mock_supabase),
            order_tools=OrderTools(supabase_client=mock_supabase)
        )
        
        assert agent._extract_phone("nomor 081234567890") == "081234567890"
        assert agent._extract_phone("+6281234567890") == "+6281234567890"
        assert agent._extract_phone("tidak ada") is None
    
    def test_extract_order_id(self, mock_supabase):
        """Test extracting order ID from message."""
        agent = WhatsAppAgent(
            customer_tools=CustomerTools(supabase_client=mock_supabase),
            order_tools=OrderTools(supabase_client=mock_supabase)
        )
        
        uuid_msg = "pesanan 12345678-1234-1234-1234-123456789012"
        result = agent._extract_order_id(uuid_msg)
        assert result is not None
        
        no_id = "tidak ada id"
        result = agent._extract_order_id(no_id)
        assert result is None


class TestFormatOrderStatus:
    """Test _format_order_status method."""
    
    def test_format_processing_status(self, mock_supabase):
        """Test formatting processing status."""
        agent = WhatsAppAgent(
            customer_tools=CustomerTools(supabase_client=mock_supabase),
            order_tools=OrderTools(supabase_client=mock_supabase)
        )
        
        order = {
            'id': 'order-001',
            'status': 'processing',
            'estimated_completion': '2024-01-15T10:00:00Z'
        }
        
        formatted = agent._format_order_status(order)
        
        assert 'processing' in formatted.lower() or 'diproses' in formatted.lower()
    
    def test_format_completed_status(self, mock_supabase):
        """Test formatting completed status."""
        agent = WhatsAppAgent(
            customer_tools=CustomerTools(supabase_client=mock_supabase),
            order_tools=OrderTools(supabase_client=mock_supabase)
        )
        
        order = {
            'id': 'order-001',
            'status': 'completed',
            'completed_at': '2024-01-15T10:00:00Z'
        }
        
        formatted = agent._format_order_status(order)
        
        assert 'selesai' in formatted.lower() or 'completed' in formatted.lower()


class TestWithGemini:
    """Test Gemini integration."""
    
    def test_with_gemini_client(self, mock_supabase, mock_gemini_client):
        """Test agent with Gemini client."""
        agent = WhatsAppAgent(
            customer_tools=CustomerTools(supabase_client=mock_supabase),
            order_tools=OrderTools(supabase_client=mock_supabase),
            gemini_client=mock_gemini_client
        )
        
        result = agent.process_message("pertanyaan kompleks", "081234567890")
        
        assert result['success'] == True
    
    def test_gemini_fallback_on_error(self, mock_supabase, mock_gemini_client):
        """Test fallback when Gemini fails."""
        mock_gemini_client.generate_content.side_effect = Exception("API Error")
        
        agent = WhatsAppAgent(
            customer_tools=CustomerTools(supabase_client=mock_supabase),
            order_tools=OrderTools(supabase_client=mock_supabase),
            gemini_client=mock_gemini_client
        )
        
        result = agent.process_message("halo", "081234567890")
        
        assert result['success'] == True


class TestConversationContext:
    """Test conversation context management."""
    
    def test_store_context(self, mock_supabase):
        """Test storing conversation context."""
        agent = WhatsAppAgent(
            customer_tools=CustomerTools(supabase_client=mock_supabase),
            order_tools=OrderTools(supabase_client=mock_supabase)
        )
        
        agent._store_context("081234567890", "greeting", {"name": "John"})
        
        context = agent._get_context("081234567890")
        assert context is not None
    
    def test_get_context_not_found(self, mock_supabase):
        """Test getting context that doesn't exist."""
        agent = WhatsAppAgent(
            customer_tools=CustomerTools(supabase_client=mock_supabase),
            order_tools=OrderTools(supabase_client=mock_supabase)
        )
        
        context = agent._get_context("000000000000")
        
        assert context is None or context == {}
    
    def test_clear_context(self, mock_supabase):
        """Test clearing conversation context."""
        agent = WhatsAppAgent(
            customer_tools=CustomerTools(supabase_client=mock_supabase),
            order_tools=OrderTools(supabase_client=mock_supabase)
        )
        
        agent._store_context("081234567890", "greeting", {"name": "John"})
        agent._clear_context("081234567890")
        
        context = agent._get_context("081234567890")
        assert context is None or context == {}


class TestSystemPrompt:
    """Test system prompt constant."""
    
    def test_system_prompt_exists(self, mock_supabase):
        """Test system prompt is defined."""
        assert WhatsAppAgent.SYSTEM_PROMPT is not None
        assert len(WhatsAppAgent.SYSTEM_PROMPT) > 0
