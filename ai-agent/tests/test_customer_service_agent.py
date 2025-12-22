"""Tests for CustomerServiceAgent - 100% coverage."""

import pytest
from unittest.mock import Mock, patch, MagicMock

from src.agents.customer_service_agent import CustomerServiceAgent
from src.tools import CustomerTools, OrderTools


class TestCustomerServiceAgentInit:
    """Test CustomerServiceAgent initialization."""
    
    def test_init_with_tools(self, mock_supabase):
        """Test initialization with provided tools."""
        customer_tools = CustomerTools(supabase_client=mock_supabase)
        order_tools = OrderTools(supabase_client=mock_supabase)
        
        agent = CustomerServiceAgent(
            customer_tools=customer_tools,
            order_tools=order_tools
        )
        
        assert agent._customer_tools == customer_tools
        assert agent._order_tools == order_tools
    
    def test_init_without_tools(self):
        """Test initialization without tools."""
        agent = CustomerServiceAgent()
        
        assert agent._customer_tools is None
        assert agent._order_tools is None
    
    def test_tools_lazy_loading(self, mock_supabase):
        """Test tools are loaded lazily."""
        customer_tools = CustomerTools(supabase_client=mock_supabase)
        order_tools = OrderTools(supabase_client=mock_supabase)
        
        agent = CustomerServiceAgent(
            customer_tools=customer_tools,
            order_tools=order_tools
        )
        
        assert agent.customer_tools == customer_tools
        assert agent.order_tools == order_tools


class TestHandleInquiry:
    """Test handle_inquiry method."""
    
    def test_handle_empty_message(self, mock_supabase):
        """Test handling empty message."""
        agent = CustomerServiceAgent(
            customer_tools=CustomerTools(supabase_client=mock_supabase),
            order_tools=OrderTools(supabase_client=mock_supabase)
        )
        
        result = agent.handle_inquiry("")
        
        assert result['success'] == False
        assert 'kosong' in result['response'].lower()
    
    def test_handle_whitespace_message(self, mock_supabase):
        """Test handling whitespace-only message."""
        agent = CustomerServiceAgent(
            customer_tools=CustomerTools(supabase_client=mock_supabase),
            order_tools=OrderTools(supabase_client=mock_supabase)
        )
        
        result = agent.handle_inquiry("   ")
        
        assert result['success'] == False
    
    def test_handle_greeting(self, mock_supabase):
        """Test handling greeting message."""
        agent = CustomerServiceAgent(
            customer_tools=CustomerTools(supabase_client=mock_supabase),
            order_tools=OrderTools(supabase_client=mock_supabase)
        )
        
        result = agent.handle_inquiry("Halo")
        
        assert result['success'] == True
        assert 'Halo' in result['response'] or 'halo' in result['response'].lower()
    
    def test_handle_status_inquiry(self, mock_supabase):
        """Test handling status inquiry."""
        agent = CustomerServiceAgent(
            customer_tools=CustomerTools(supabase_client=mock_supabase),
            order_tools=OrderTools(supabase_client=mock_supabase)
        )
        
        result = agent.handle_inquiry("cek status pesanan", customer_phone="081234567890")
        
        assert result['success'] == True
    
    def test_handle_price_inquiry(self, mock_supabase):
        """Test handling price inquiry."""
        agent = CustomerServiceAgent(
            customer_tools=CustomerTools(supabase_client=mock_supabase),
            order_tools=OrderTools(supabase_client=mock_supabase)
        )
        
        result = agent.handle_inquiry("berapa harga laundry?")
        
        assert result['success'] == True
    
    def test_handle_points_inquiry_with_phone(self, mock_supabase):
        """Test handling points inquiry with phone."""
        agent = CustomerServiceAgent(
            customer_tools=CustomerTools(supabase_client=mock_supabase),
            order_tools=OrderTools(supabase_client=mock_supabase)
        )
        
        result = agent.handle_inquiry("cek poin saya", customer_phone="081234567890")
        
        assert result['success'] == True
    
    def test_handle_points_inquiry_without_phone(self, mock_supabase):
        """Test handling points inquiry without phone."""
        agent = CustomerServiceAgent(
            customer_tools=CustomerTools(supabase_client=mock_supabase),
            order_tools=OrderTools(supabase_client=mock_supabase)
        )
        
        result = agent.handle_inquiry("cek poin saya")
        
        assert result['success'] == True
        assert 'nomor telepon' in result['response'].lower()
    
    def test_handle_pickup_inquiry(self, mock_supabase):
        """Test handling pickup inquiry."""
        agent = CustomerServiceAgent(
            customer_tools=CustomerTools(supabase_client=mock_supabase),
            order_tools=OrderTools(supabase_client=mock_supabase)
        )
        
        result = agent.handle_inquiry("kapan pesanan saya selesai?", customer_phone="081234567890")
        
        assert result['success'] == True


class TestCheckOrderStatus:
    """Test check_order_status method."""
    
    def test_check_status_found(self, mock_supabase):
        """Test checking status with orders found."""
        agent = CustomerServiceAgent(
            customer_tools=CustomerTools(supabase_client=mock_supabase),
            order_tools=OrderTools(supabase_client=mock_supabase)
        )
        
        result = agent.check_order_status("081234567890")
        
        assert result['success'] == True
        assert 'orders' in result
    
    def test_check_status_not_found(self, mock_supabase):
        """Test checking status with no orders."""
        agent = CustomerServiceAgent(
            customer_tools=CustomerTools(supabase_client=mock_supabase),
            order_tools=OrderTools(supabase_client=mock_supabase)
        )
        
        result = agent.check_order_status("000000000000")
        
        assert result['success'] == True
        assert 'tidak ditemukan' in result['response'].lower()


class TestGetServicePrices:
    """Test get_service_prices method."""
    
    def test_get_prices_success(self, mock_supabase):
        """Test getting service prices."""
        agent = CustomerServiceAgent(
            customer_tools=CustomerTools(supabase_client=mock_supabase),
            order_tools=OrderTools(supabase_client=mock_supabase)
        )
        
        result = agent.get_service_prices()
        
        assert result['success'] == True
        assert 'services' in result


class TestCheckPoints:
    """Test check_points method."""
    
    def test_check_points_with_phone(self, mock_supabase):
        """Test checking points with phone."""
        agent = CustomerServiceAgent(
            customer_tools=CustomerTools(supabase_client=mock_supabase),
            order_tools=OrderTools(supabase_client=mock_supabase)
        )
        
        result = agent.check_points("081234567890")
        
        assert result['success'] == True
        assert 'points' in result
    
    def test_check_points_without_phone(self, mock_supabase):
        """Test checking points without phone."""
        agent = CustomerServiceAgent(
            customer_tools=CustomerTools(supabase_client=mock_supabase),
            order_tools=OrderTools(supabase_client=mock_supabase)
        )
        
        result = agent.check_points("")
        
        assert result['success'] == False


class TestEstimatePickup:
    """Test estimate_pickup method."""
    
    def test_estimate_with_order_id(self, mock_supabase):
        """Test estimation with order ID."""
        agent = CustomerServiceAgent(
            customer_tools=CustomerTools(supabase_client=mock_supabase),
            order_tools=OrderTools(supabase_client=mock_supabase)
        )
        
        result = agent.estimate_pickup(order_id="order-001")
        
        assert result['success'] == True
        assert 'estimation' in result
    
    def test_estimate_with_phone(self, mock_supabase):
        """Test estimation with phone."""
        agent = CustomerServiceAgent(
            customer_tools=CustomerTools(supabase_client=mock_supabase),
            order_tools=OrderTools(supabase_client=mock_supabase)
        )
        
        result = agent.estimate_pickup(phone="081234567890")
        
        assert result['success'] == True
    
    def test_estimate_without_params(self, mock_supabase):
        """Test estimation without order ID or phone."""
        agent = CustomerServiceAgent(
            customer_tools=CustomerTools(supabase_client=mock_supabase),
            order_tools=OrderTools(supabase_client=mock_supabase)
        )
        
        result = agent.estimate_pickup()
        
        assert result['success'] == False


class TestIntentDetection:
    """Test intent detection methods."""
    
    def test_is_status_inquiry(self, mock_supabase):
        """Test status inquiry detection."""
        agent = CustomerServiceAgent(
            customer_tools=CustomerTools(supabase_client=mock_supabase),
            order_tools=OrderTools(supabase_client=mock_supabase)
        )
        
        assert agent._is_status_inquiry("cek status pesanan") == True
        assert agent._is_status_inquiry("harga laundry") == False
    
    def test_is_price_inquiry(self, mock_supabase):
        """Test price inquiry detection."""
        agent = CustomerServiceAgent(
            customer_tools=CustomerTools(supabase_client=mock_supabase),
            order_tools=OrderTools(supabase_client=mock_supabase)
        )
        
        assert agent._is_price_inquiry("berapa harga") == True
        assert agent._is_price_inquiry("cek pesanan") == False
    
    def test_is_points_inquiry(self, mock_supabase):
        """Test points inquiry detection."""
        agent = CustomerServiceAgent(
            customer_tools=CustomerTools(supabase_client=mock_supabase),
            order_tools=OrderTools(supabase_client=mock_supabase)
        )
        
        assert agent._is_points_inquiry("cek poin saya") == True
        assert agent._is_points_inquiry("harga laundry") == False
    
    def test_is_pickup_inquiry(self, mock_supabase):
        """Test pickup inquiry detection."""
        agent = CustomerServiceAgent(
            customer_tools=CustomerTools(supabase_client=mock_supabase),
            order_tools=OrderTools(supabase_client=mock_supabase)
        )
        
        assert agent._is_pickup_inquiry("kapan selesai") == True
        assert agent._is_pickup_inquiry("harga laundry") == False
    
    def test_is_greeting(self, mock_supabase):
        """Test greeting detection."""
        agent = CustomerServiceAgent(
            customer_tools=CustomerTools(supabase_client=mock_supabase),
            order_tools=OrderTools(supabase_client=mock_supabase)
        )
        
        assert agent._is_greeting("halo") == True
        assert agent._is_greeting("selamat pagi") == True
        assert agent._is_greeting("cek pesanan") == False


class TestHelperMethods:
    """Test helper methods."""
    
    def test_extract_phone_from_message(self, mock_supabase):
        """Test extracting phone from message."""
        agent = CustomerServiceAgent(
            customer_tools=CustomerTools(supabase_client=mock_supabase),
            order_tools=OrderTools(supabase_client=mock_supabase)
        )
        
        assert agent._extract_phone("nomor saya 081234567890") == "081234567890"
        assert agent._extract_phone("telepon +6281234567890") == "+6281234567890"
        assert agent._extract_phone("tidak ada nomor") is None
    
    def test_extract_order_id(self, mock_supabase):
        """Test extracting order ID from message."""
        agent = CustomerServiceAgent(
            customer_tools=CustomerTools(supabase_client=mock_supabase),
            order_tools=OrderTools(supabase_client=mock_supabase)
        )
        
        # Test UUID format
        uuid_message = "pesanan 12345678-1234-1234-1234-123456789012"
        result = agent._extract_order_id(uuid_message)
        assert result is not None
        
        # Test short ID format
        short_message = "pesanan #12345678"
        result = agent._extract_order_id(short_message)
        assert result is not None
        
        # Test no ID
        result = agent._extract_order_id("tidak ada id")
        assert result is None


class TestHandleGeneralInquiry:
    """Test _handle_general_inquiry method."""
    
    def test_without_gemini(self, mock_supabase):
        """Test handling without Gemini client."""
        # Create a mock that returns None for gemini_client
        mock_gemini = Mock()
        mock_gemini.return_value = None
        
        agent = CustomerServiceAgent(
            customer_tools=CustomerTools(supabase_client=mock_supabase),
            order_tools=OrderTools(supabase_client=mock_supabase),
            gemini_client=False  # Use False as sentinel for "no client"
        )
        
        # Patch the property to return None
        with patch.object(CustomerServiceAgent, 'gemini_client', new_callable=lambda: property(lambda self: None)):
            result = agent._handle_general_inquiry("pertanyaan umum", None, None)
        
            assert result['success'] == True
            # Should return contact info fallback
    
    def test_with_gemini_success(self, mock_supabase, mock_gemini_client):
        """Test handling with Gemini client."""
        agent = CustomerServiceAgent(
            customer_tools=CustomerTools(supabase_client=mock_supabase),
            order_tools=OrderTools(supabase_client=mock_supabase),
            gemini_client=mock_gemini_client
        )
        
        result = agent._handle_general_inquiry("pertanyaan umum", "08123", None)
        
        assert result['success'] == True
        assert result.get('ai_generated') == True
    
    def test_with_gemini_error(self, mock_supabase, mock_gemini_client):
        """Test handling Gemini error."""
        mock_gemini_client.generate_content.side_effect = Exception("API Error")
        
        agent = CustomerServiceAgent(
            customer_tools=CustomerTools(supabase_client=mock_supabase),
            order_tools=OrderTools(supabase_client=mock_supabase),
            gemini_client=mock_gemini_client
        )
        
        result = agent._handle_general_inquiry("pertanyaan", None, None)
        
        assert result['success'] == False
        assert 'error' in result


class TestSystemPrompt:
    """Test system prompt constant."""
    
    def test_system_prompt_exists(self, mock_supabase):
        """Test system prompt is defined."""
        assert CustomerServiceAgent.SYSTEM_PROMPT is not None
        assert len(CustomerServiceAgent.SYSTEM_PROMPT) > 0
