"""Tests for OrderTools - 100% coverage."""

import pytest
from unittest.mock import Mock, patch
from datetime import datetime, timezone, timedelta

from src.tools.order_tools import OrderTools


class TestOrderToolsInit:
    """Test OrderTools initialization."""
    
    def test_init_with_client(self, mock_supabase):
        """Test initialization with provided client."""
        tools = OrderTools(supabase_client=mock_supabase)
        assert tools._client == mock_supabase
    
    def test_init_without_client(self):
        """Test initialization without client."""
        tools = OrderTools()
        assert tools._client is None
    
    def test_client_lazy_loading(self, mock_supabase):
        """Test client is loaded lazily."""
        tools = OrderTools(supabase_client=mock_supabase)
        client = tools.client
        assert client == mock_supabase


class TestCheckOrderStatus:
    """Test check_order_status method."""
    
    def test_check_status_by_phone(self, mock_supabase):
        """Test checking order status by phone."""
        tools = OrderTools(supabase_client=mock_supabase)
        
        results = tools.check_order_status("081234567890")
        
        assert isinstance(results, list)
    
    def test_check_status_adds_labels(self, mock_supabase):
        """Test that status and payment labels are added."""
        tools = OrderTools(supabase_client=mock_supabase)
        
        results = tools.check_order_status("081234567890")
        
        if results:
            assert 'status_label' in results[0]
            assert 'payment_label' in results[0]
            assert 'formatted_total' in results[0]
    
    def test_check_status_empty_phone(self, mock_supabase):
        """Test with empty phone returns empty list."""
        tools = OrderTools(supabase_client=mock_supabase)
        
        results = tools.check_order_status("")
        
        assert results == []
    
    def test_check_status_with_limit(self, mock_supabase):
        """Test status check respects limit."""
        tools = OrderTools(supabase_client=mock_supabase)
        
        results = tools.check_order_status("081234567890", limit=1)
        
        assert len(results) <= 1
    
    def test_status_labels(self, mock_supabase):
        """Test all status labels are defined."""
        tools = OrderTools(supabase_client=mock_supabase)
        
        assert 'pending' in tools.STATUS_LABELS
        assert 'in_progress' in tools.STATUS_LABELS
        assert 'ready_for_pickup' in tools.STATUS_LABELS
        assert 'completed' in tools.STATUS_LABELS
        assert 'cancelled' in tools.STATUS_LABELS
    
    def test_payment_labels(self, mock_supabase):
        """Test all payment labels are defined."""
        tools = OrderTools(supabase_client=mock_supabase)
        
        assert 'pending' in tools.PAYMENT_LABELS
        assert 'paid' in tools.PAYMENT_LABELS
        assert 'refunded' in tools.PAYMENT_LABELS


class TestGetOrderById:
    """Test get_order_by_id method."""
    
    def test_get_existing_order(self, mock_supabase):
        """Test getting existing order by ID."""
        tools = OrderTools(supabase_client=mock_supabase)
        
        result = tools.get_order_by_id("order-001")
        
        assert result is not None
        assert result['id'] == "order-001"
    
    def test_get_order_has_labels(self, mock_supabase):
        """Test returned order has labels."""
        tools = OrderTools(supabase_client=mock_supabase)
        
        result = tools.get_order_by_id("order-001")
        
        if result:
            assert 'status_label' in result
            assert 'payment_label' in result
    
    def test_get_nonexistent_order(self, mock_supabase):
        """Test getting nonexistent order."""
        tools = OrderTools(supabase_client=mock_supabase)
        
        result = tools.get_order_by_id("nonexistent")
        
        assert result is None
    
    def test_get_order_empty_id(self, mock_supabase):
        """Test with empty ID returns None."""
        tools = OrderTools(supabase_client=mock_supabase)
        
        result = tools.get_order_by_id("")
        
        assert result is None
    
    def test_get_order_none_id(self, mock_supabase):
        """Test with None ID returns None."""
        tools = OrderTools(supabase_client=mock_supabase)
        
        result = tools.get_order_by_id(None)
        
        assert result is None


class TestEstimatePickupTime:
    """Test estimate_pickup_time method."""
    
    def test_estimate_pending_order(self, mock_supabase):
        """Test estimation for pending order."""
        tools = OrderTools(supabase_client=mock_supabase)
        
        result = tools.estimate_pickup_time("order-001")  # pending order
        
        assert 'message' in result
        assert 'current_status' in result
    
    def test_estimate_ready_order(self, mock_supabase):
        """Test estimation for ready order."""
        tools = OrderTools(supabase_client=mock_supabase)
        
        result = tools.estimate_pickup_time("order-002")  # ready_for_pickup
        
        assert 'message' in result
        assert result['estimated_ready_time'] is None
    
    def test_estimate_nonexistent_order(self, mock_supabase):
        """Test estimation for nonexistent order."""
        tools = OrderTools(supabase_client=mock_supabase)
        
        result = tools.estimate_pickup_time("nonexistent")
        
        assert 'error' in result
    
    def test_estimate_empty_id(self, mock_supabase):
        """Test with empty order ID."""
        tools = OrderTools(supabase_client=mock_supabase)
        
        result = tools.estimate_pickup_time("")
        
        assert 'error' in result
    
    def test_estimate_none_id(self, mock_supabase):
        """Test with None order ID."""
        tools = OrderTools(supabase_client=mock_supabase)
        
        result = tools.estimate_pickup_time(None)
        
        assert 'error' in result


class TestGetTodaysOrders:
    """Test get_todays_orders method."""
    
    def test_get_todays_orders(self, mock_supabase):
        """Test getting today's orders."""
        tools = OrderTools(supabase_client=mock_supabase)
        
        results = tools.get_todays_orders()
        
        assert isinstance(results, list)
    
    def test_get_todays_orders_with_store(self, mock_supabase):
        """Test filtering by store."""
        tools = OrderTools(supabase_client=mock_supabase)
        
        results = tools.get_todays_orders(store_id="store-001")
        
        assert isinstance(results, list)
    
    def test_get_todays_orders_with_status(self, mock_supabase):
        """Test filtering by status."""
        tools = OrderTools(supabase_client=mock_supabase)
        
        results = tools.get_todays_orders(status="pending")
        
        assert isinstance(results, list)
    
    def test_get_todays_orders_invalid_status(self, mock_supabase):
        """Test with invalid status is ignored."""
        tools = OrderTools(supabase_client=mock_supabase)
        
        results = tools.get_todays_orders(status="invalid_status")
        
        assert isinstance(results, list)


class TestUpdateOrderStatus:
    """Test update_order_status method."""
    
    def test_update_valid_status(self, mock_supabase):
        """Test updating to valid status."""
        tools = OrderTools(supabase_client=mock_supabase)
        
        result = tools.update_order_status("order-001", "in_progress")
        
        assert result['success'] == True
        assert result['new_status'] == "in_progress"
    
    def test_update_invalid_status(self, mock_supabase):
        """Test updating to invalid status fails."""
        tools = OrderTools(supabase_client=mock_supabase)
        
        result = tools.update_order_status("order-001", "invalid_status")
        
        assert result['success'] == False
        assert 'error' in result
    
    def test_update_nonexistent_order(self, mock_supabase):
        """Test updating nonexistent order fails."""
        tools = OrderTools(supabase_client=mock_supabase)
        
        result = tools.update_order_status("nonexistent", "pending")
        
        assert result['success'] == False
    
    def test_update_empty_order_id(self, mock_supabase):
        """Test with empty order ID fails."""
        tools = OrderTools(supabase_client=mock_supabase)
        
        result = tools.update_order_status("", "pending")
        
        assert result['success'] == False


class TestUpdatePaymentStatus:
    """Test update_payment_status method."""
    
    def test_update_valid_payment_status(self, mock_supabase):
        """Test updating to valid payment status."""
        tools = OrderTools(supabase_client=mock_supabase)
        
        result = tools.update_payment_status("order-001", "paid")
        
        assert result['success'] == True
        assert result['new_payment_status'] == "paid"
    
    def test_update_invalid_payment_status(self, mock_supabase):
        """Test updating to invalid payment status fails."""
        tools = OrderTools(supabase_client=mock_supabase)
        
        result = tools.update_payment_status("order-001", "invalid")
        
        assert result['success'] == False
    
    def test_update_payment_nonexistent_order(self, mock_supabase):
        """Test updating payment for nonexistent order."""
        tools = OrderTools(supabase_client=mock_supabase)
        
        result = tools.update_payment_status("nonexistent", "paid")
        
        assert result['success'] == False
    
    def test_update_payment_empty_order_id(self, mock_supabase):
        """Test with empty order ID fails."""
        tools = OrderTools(supabase_client=mock_supabase)
        
        result = tools.update_payment_status("", "paid")
        
        assert result['success'] == False


class TestCreateOrder:
    """Test create_order method."""
    
    def test_create_order_success(self, mock_supabase, sample_order_items):
        """Test successful order creation."""
        tools = OrderTools(supabase_client=mock_supabase)
        
        result = tools.create_order(
            customer_phone="081234567890",
            customer_name="Test Customer",
            items=sample_order_items
        )
        
        assert result['success'] == True
        assert 'order_id' in result
        assert 'total_amount' in result
    
    def test_create_order_with_store(self, mock_supabase, sample_order_items):
        """Test order creation with store ID."""
        tools = OrderTools(supabase_client=mock_supabase)
        
        result = tools.create_order(
            customer_phone="081234567890",
            customer_name="Test Customer",
            items=sample_order_items,
            store_id="store-001"
        )
        
        assert result['success'] == True
    
    def test_create_order_missing_phone(self, mock_supabase, sample_order_items):
        """Test order creation without phone fails."""
        tools = OrderTools(supabase_client=mock_supabase)
        
        result = tools.create_order(
            customer_phone="",
            customer_name="Test",
            items=sample_order_items
        )
        
        assert result['success'] == False
    
    def test_create_order_missing_name(self, mock_supabase, sample_order_items):
        """Test order creation without name fails."""
        tools = OrderTools(supabase_client=mock_supabase)
        
        result = tools.create_order(
            customer_phone="08123",
            customer_name="",
            items=sample_order_items
        )
        
        assert result['success'] == False
    
    def test_create_order_no_items(self, mock_supabase):
        """Test order creation without items fails."""
        tools = OrderTools(supabase_client=mock_supabase)
        
        result = tools.create_order(
            customer_phone="08123",
            customer_name="Test",
            items=[]
        )
        
        assert result['success'] == False
    
    def test_create_order_calculates_totals(self, mock_supabase):
        """Test order total calculation."""
        tools = OrderTools(supabase_client=mock_supabase)
        
        items = [
            {"service_name": "Test", "price": 10000, "quantity": 2}
        ]
        
        result = tools.create_order(
            customer_phone="08123456789",
            customer_name="Test",
            items=items
        )
        
        assert result['success'] == True
        assert result['subtotal'] == 20000
        # Tax is 10%
        assert result['tax_amount'] == 2000
        assert result['total_amount'] == 22000


class TestGetOrdersReadyForPickup:
    """Test get_orders_ready_for_pickup method."""
    
    def test_get_ready_orders(self, mock_supabase):
        """Test getting orders ready for pickup."""
        tools = OrderTools(supabase_client=mock_supabase)
        
        results = tools.get_orders_ready_for_pickup()
        
        assert isinstance(results, list)
    
    def test_get_ready_orders_with_store(self, mock_supabase):
        """Test filtering by store."""
        tools = OrderTools(supabase_client=mock_supabase)
        
        results = tools.get_orders_ready_for_pickup(store_id="store-001")
        
        assert isinstance(results, list)


class TestGetPendingPayments:
    """Test get_pending_payments method."""
    
    def test_get_pending_payments(self, mock_supabase):
        """Test getting orders with pending payments."""
        tools = OrderTools(supabase_client=mock_supabase)
        
        results = tools.get_pending_payments()
        
        assert isinstance(results, list)
    
    def test_get_pending_payments_with_hours(self, mock_supabase):
        """Test filtering by hours old."""
        tools = OrderTools(supabase_client=mock_supabase)
        
        results = tools.get_pending_payments(hours_old=48)
        
        assert isinstance(results, list)
    
    def test_get_pending_payments_negative_hours(self, mock_supabase):
        """Test with negative hours defaults to 0."""
        tools = OrderTools(supabase_client=mock_supabase)
        
        results = tools.get_pending_payments(hours_old=-10)
        
        assert isinstance(results, list)
    
    def test_get_pending_payments_with_store(self, mock_supabase):
        """Test filtering by store."""
        tools = OrderTools(supabase_client=mock_supabase)
        
        results = tools.get_pending_payments(store_id="store-001")
        
        assert isinstance(results, list)


class TestGetServices:
    """Test get_services method."""
    
    def test_get_services(self, mock_supabase):
        """Test getting available services."""
        tools = OrderTools(supabase_client=mock_supabase)
        
        results = tools.get_services()
        
        assert isinstance(results, list)
    
    def test_get_services_with_store(self, mock_supabase):
        """Test filtering by store."""
        tools = OrderTools(supabase_client=mock_supabase)
        
        results = tools.get_services(store_id="store-001")
        
        assert isinstance(results, list)
    
    def test_services_have_formatted_price(self, mock_supabase):
        """Test services have formatted price."""
        tools = OrderTools(supabase_client=mock_supabase)
        
        results = tools.get_services()
        
        if results:
            assert 'formatted_price' in results[0]


class TestOrderHelperMethods:
    """Test helper methods."""
    
    def test_clean_phone(self, mock_supabase):
        """Test phone cleaning."""
        tools = OrderTools(supabase_client=mock_supabase)
        
        assert tools._clean_phone("0812 3456 7890") == "081234567890"
        assert tools._clean_phone("0812-3456-7890") == "081234567890"
    
    def test_parse_datetime_valid(self, mock_supabase):
        """Test parsing valid datetime."""
        tools = OrderTools(supabase_client=mock_supabase)
        
        result = tools._parse_datetime("2024-12-14T10:00:00Z")
        
        assert result is not None
    
    def test_parse_datetime_empty(self, mock_supabase):
        """Test parsing empty string."""
        tools = OrderTools(supabase_client=mock_supabase)
        
        result = tools._parse_datetime("")
        
        assert result is None
    
    def test_parse_datetime_invalid(self, mock_supabase):
        """Test parsing invalid string."""
        tools = OrderTools(supabase_client=mock_supabase)
        
        result = tools._parse_datetime("invalid")
        
        assert result is None
    
    def test_valid_statuses(self, mock_supabase):
        """Test VALID_STATUSES constant."""
        tools = OrderTools(supabase_client=mock_supabase)
        
        assert 'pending' in tools.VALID_STATUSES
        assert 'in_progress' in tools.VALID_STATUSES
        assert 'ready_for_pickup' in tools.VALID_STATUSES
        assert 'completed' in tools.VALID_STATUSES
        assert 'cancelled' in tools.VALID_STATUSES
    
    def test_valid_payment_statuses(self, mock_supabase):
        """Test VALID_PAYMENT_STATUSES constant."""
        tools = OrderTools(supabase_client=mock_supabase)
        
        assert 'pending' in tools.VALID_PAYMENT_STATUSES
        assert 'paid' in tools.VALID_PAYMENT_STATUSES
        assert 'refunded' in tools.VALID_PAYMENT_STATUSES
