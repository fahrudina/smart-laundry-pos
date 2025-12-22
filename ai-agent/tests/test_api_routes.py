"""Tests for API routes - 100% coverage."""

import pytest
import json
from unittest.mock import Mock, patch, MagicMock
from flask import Flask

from src.api.routes import create_app


class TestCreateApp:
    """Test create_app factory function."""
    
    def test_create_app_default(self):
        """Test creating app with default config."""
        app = create_app()
        
        assert app is not None
        assert isinstance(app, Flask)
    
    def test_create_app_testing(self):
        """Test creating app with testing config."""
        app = create_app(testing=True)
        
        assert app.config['TESTING'] == True


class TestHealthEndpoint:
    """Test /health endpoint."""
    
    def test_health_check(self, test_client):
        """Test health check returns 200."""
        response = test_client.get('/health')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['status'] == 'healthy'
    
    def test_health_check_content_type(self, test_client):
        """Test health check returns JSON."""
        response = test_client.get('/health')
        
        assert response.content_type == 'application/json'


class TestChatEndpoint:
    """Test /api/chat endpoint."""
    
    def test_chat_success(self, test_client):
        """Test successful chat request."""
        with patch('src.api.routes.CustomerServiceAgent') as mock_agent_class:
            mock_agent = Mock()
            mock_agent.handle_inquiry.return_value = {
                'success': True,
                'response': 'Halo! Ada yang bisa saya bantu?'
            }
            mock_agent_class.return_value = mock_agent
            
            response = test_client.post('/api/chat', json={
                'message': 'halo',
                'phone': '081234567890'
            })
            
            assert response.status_code == 200
            data = json.loads(response.data)
            assert data['success'] == True
    
    def test_chat_missing_message(self, test_client):
        """Test chat with missing message."""
        response = test_client.post('/api/chat', json={
            'phone': '081234567890'
        })
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data
    
    def test_chat_empty_message(self, test_client):
        """Test chat with empty message."""
        response = test_client.post('/api/chat', json={
            'message': '',
            'phone': '081234567890'
        })
        
        assert response.status_code == 400
    
    def test_chat_without_phone(self, test_client):
        """Test chat without phone number."""
        with patch('src.api.routes.CustomerServiceAgent') as mock_agent_class:
            mock_agent = Mock()
            mock_agent.handle_inquiry.return_value = {
                'success': True,
                'response': 'Silakan berikan nomor telepon'
            }
            mock_agent_class.return_value = mock_agent
            
            response = test_client.post('/api/chat', json={
                'message': 'cek poin'
            })
            
            assert response.status_code == 200


class TestOrderStatusEndpoint:
    """Test /api/order/status endpoint."""
    
    def test_order_status_success(self, test_client):
        """Test getting order status."""
        with patch('src.api.routes.CustomerServiceAgent') as mock_agent_class:
            mock_agent = Mock()
            mock_agent.check_order_status.return_value = {
                'success': True,
                'orders': []
            }
            mock_agent_class.return_value = mock_agent
            
            response = test_client.get('/api/order/status?phone=081234567890')
            
            assert response.status_code == 200
    
    def test_order_status_missing_phone(self, test_client):
        """Test order status without phone."""
        response = test_client.get('/api/order/status')
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data


class TestServicesEndpoint:
    """Test /api/services endpoint."""
    
    def test_get_services(self, test_client):
        """Test getting services."""
        with patch('src.api.routes.CustomerServiceAgent') as mock_agent_class:
            mock_agent = Mock()
            mock_agent.get_service_prices.return_value = {
                'success': True,
                'services': []
            }
            mock_agent_class.return_value = mock_agent
            
            response = test_client.get('/api/services')
            
            assert response.status_code == 200


class TestPointsEndpoint:
    """Test /api/points endpoint."""
    
    def test_get_points_success(self, test_client):
        """Test getting points."""
        with patch('src.api.routes.CustomerServiceAgent') as mock_agent_class:
            mock_agent = Mock()
            mock_agent.check_points.return_value = {
                'success': True,
                'points': 100
            }
            mock_agent_class.return_value = mock_agent
            
            response = test_client.get('/api/points?phone=081234567890')
            
            assert response.status_code == 200
    
    def test_get_points_missing_phone(self, test_client):
        """Test points without phone."""
        response = test_client.get('/api/points')
        
        assert response.status_code == 400


class TestAnalyticsQueryEndpoint:
    """Test /api/analytics/query endpoint."""
    
    def test_analytics_query_success(self, test_client):
        """Test successful analytics query."""
        with patch('src.api.routes.AnalyticsAgent') as mock_agent_class:
            mock_agent = Mock()
            mock_agent.handle_query.return_value = {
                'success': True,
                'data': {'revenue': 1000000}
            }
            mock_agent_class.return_value = mock_agent
            
            response = test_client.post('/api/analytics/query', json={
                'query': 'pendapatan hari ini'
            })
            
            assert response.status_code == 200
            data = json.loads(response.data)
            assert data['success'] == True
    
    def test_analytics_query_missing_query(self, test_client):
        """Test analytics with missing query."""
        response = test_client.post('/api/analytics/query', json={})
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data


class TestDailyReportEndpoint:
    """Test /api/analytics/daily endpoint."""
    
    def test_daily_report(self, test_client):
        """Test daily report."""
        with patch('src.api.routes.AnalyticsAgent') as mock_agent_class:
            mock_agent = Mock()
            mock_agent.get_daily_report.return_value = {
                'success': True,
                'report': {}
            }
            mock_agent_class.return_value = mock_agent
            
            response = test_client.get('/api/analytics/daily')
            
            assert response.status_code == 200


class TestPeriodReportEndpoint:
    """Test /api/analytics/period endpoint."""
    
    def test_period_report(self, test_client):
        """Test period report."""
        with patch('src.api.routes.AnalyticsAgent') as mock_agent_class:
            mock_agent = Mock()
            mock_agent.get_period_report.return_value = {
                'success': True,
                'report': {}
            }
            mock_agent_class.return_value = mock_agent
            
            response = test_client.get('/api/analytics/period?period=week')
            
            assert response.status_code == 200


class TestComparePeriodsEndpoint:
    """Test /api/analytics/compare endpoint."""
    
    def test_compare_periods(self, test_client):
        """Test comparing periods."""
        with patch('src.api.routes.AnalyticsAgent') as mock_agent_class:
            mock_agent = Mock()
            mock_agent.compare_periods.return_value = {
                'success': True,
                'comparison': {}
            }
            mock_agent_class.return_value = mock_agent
            
            response = test_client.get('/api/analytics/compare')
            
            assert response.status_code == 200


class TestChurnedCustomersEndpoint:
    """Test /api/analytics/churned endpoint."""
    
    def test_churned_customers(self, test_client):
        """Test getting churned customers."""
        with patch('src.api.routes.AnalyticsAgent') as mock_agent_class:
            mock_agent = Mock()
            mock_agent.get_churned_customers_report.return_value = {
                'success': True,
                'customers': []
            }
            mock_agent_class.return_value = mock_agent
            
            response = test_client.get('/api/analytics/churned')
            
            assert response.status_code == 200


class TestPopularServicesEndpoint:
    """Test /api/analytics/popular-services endpoint."""
    
    def test_popular_services(self, test_client):
        """Test getting popular services."""
        with patch('src.api.routes.AnalyticsAgent') as mock_agent_class:
            mock_agent = Mock()
            mock_agent.get_popular_services_report.return_value = {
                'success': True,
                'services': []
            }
            mock_agent_class.return_value = mock_agent
            
            response = test_client.get('/api/analytics/popular-services')
            
            assert response.status_code == 200


class TestWhatsAppWebhookEndpoint:
    """Test /api/whatsapp/webhook endpoint."""
    
    def test_webhook_success(self, test_client):
        """Test successful webhook."""
        with patch('src.api.routes.WhatsAppAgent') as mock_agent_class:
            mock_agent = Mock()
            mock_agent.handle_message.return_value = {
                'success': True,
                'response': 'Halo!'
            }
            mock_agent_class.return_value = mock_agent
            
            response = test_client.post('/api/whatsapp/webhook', json={
                'phone': '081234567890',
                'message': 'halo'
            })
            
            assert response.status_code == 200
    
    def test_webhook_missing_phone(self, test_client):
        """Test webhook without phone."""
        response = test_client.post('/api/whatsapp/webhook', json={
            'message': 'halo'
        })
        
        assert response.status_code == 400


class TestNotifyReadyEndpoint:
    """Test /api/whatsapp/notify/ready endpoint."""
    
    def test_notify_ready(self, test_client):
        """Test notifying ready orders."""
        with patch('src.api.routes.WhatsAppAgent') as mock_agent_class:
            mock_agent = Mock()
            mock_agent.notify_ready_orders.return_value = {
                'success': True,
                'sent': 5
            }
            mock_agent_class.return_value = mock_agent
            
            response = test_client.post('/api/whatsapp/notify/ready', json={})
            
            assert response.status_code == 200


class TestNotifyPaymentEndpoint:
    """Test /api/whatsapp/notify/payment endpoint."""
    
    def test_notify_payment(self, test_client):
        """Test notifying pending payments."""
        with patch('src.api.routes.WhatsAppAgent') as mock_agent_class:
            mock_agent = Mock()
            mock_agent.notify_pending_payments.return_value = {
                'success': True,
                'sent': 3
            }
            mock_agent_class.return_value = mock_agent
            
            response = test_client.post('/api/whatsapp/notify/payment', json={})
            
            assert response.status_code == 200


class TestCampaignEndpoint:
    """Test /api/whatsapp/campaign endpoint."""
    
    def test_campaign_success(self, test_client):
        """Test sending campaign."""
        with patch('src.api.routes.WhatsAppAgent') as mock_agent_class:
            mock_agent = Mock()
            mock_agent.send_reengagement_campaign.return_value = {
                'success': True,
                'sent': 10
            }
            mock_agent_class.return_value = mock_agent
            
            response = test_client.post('/api/whatsapp/campaign', json={
                'customers': [{'name': 'Test', 'phone': '081234567890'}],
                'promo_message': 'Promo 20%!'
            })
            
            assert response.status_code == 200
    
    def test_campaign_missing_customers(self, test_client):
        """Test campaign without customers."""
        response = test_client.post('/api/whatsapp/campaign', json={
            'promo_message': 'Promo!'
        })
        
        assert response.status_code == 400
    
    def test_campaign_missing_message(self, test_client):
        """Test campaign without message."""
        response = test_client.post('/api/whatsapp/campaign', json={
            'customers': [{'name': 'Test', 'phone': '081234567890'}]
        })
        
        assert response.status_code == 400


class TestErrorHandlers:
    """Test error handlers."""
    
    def test_404_error(self, test_client):
        """Test 404 error handler."""
        response = test_client.get('/api/nonexistent')
        
        assert response.status_code == 404
        data = json.loads(response.data)
        assert 'error' in data
