"""Tests for AnalyticsTools - 100% coverage."""

import pytest
from unittest.mock import Mock, patch
from datetime import datetime, timezone, timedelta

from src.tools.analytics_tools import AnalyticsTools


class TestAnalyticsToolsInit:
    """Test AnalyticsTools initialization."""
    
    def test_init_with_client(self, mock_supabase):
        """Test initialization with provided client."""
        tools = AnalyticsTools(supabase_client=mock_supabase)
        assert tools._client == mock_supabase
    
    def test_init_without_client(self):
        """Test initialization without client."""
        tools = AnalyticsTools()
        assert tools._client is None
    
    def test_client_lazy_loading(self, mock_supabase):
        """Test client is loaded lazily."""
        tools = AnalyticsTools(supabase_client=mock_supabase)
        client = tools.client
        assert client == mock_supabase


class TestGetDailyRevenue:
    """Test get_daily_revenue method."""
    
    def test_get_daily_revenue_today(self, mock_supabase):
        """Test getting today's revenue."""
        tools = AnalyticsTools(supabase_client=mock_supabase)
        
        result = tools.get_daily_revenue()
        
        assert 'date' in result
        assert 'total_orders' in result
        assert 'total_revenue' in result
        assert 'formatted_total' in result
    
    def test_get_daily_revenue_specific_date(self, mock_supabase):
        """Test getting revenue for specific date."""
        tools = AnalyticsTools(supabase_client=mock_supabase)
        
        result = tools.get_daily_revenue(date="2024-12-14")
        
        assert result['date'] == "2024-12-14"
    
    def test_get_daily_revenue_with_store(self, mock_supabase):
        """Test filtering by store."""
        tools = AnalyticsTools(supabase_client=mock_supabase)
        
        result = tools.get_daily_revenue(store_id="store-001")
        
        assert 'total_revenue' in result
    
    def test_get_daily_revenue_invalid_date(self, mock_supabase):
        """Test with invalid date format."""
        tools = AnalyticsTools(supabase_client=mock_supabase)
        
        result = tools.get_daily_revenue(date="invalid-date")
        
        assert 'error' in result
    
    def test_get_daily_revenue_has_breakdown(self, mock_supabase):
        """Test revenue has paid/pending breakdown."""
        tools = AnalyticsTools(supabase_client=mock_supabase)
        
        result = tools.get_daily_revenue()
        
        assert 'paid_revenue' in result
        assert 'pending_revenue' in result
        assert 'formatted_paid' in result
        assert 'formatted_pending' in result


class TestGetPeriodRevenue:
    """Test get_period_revenue method."""
    
    def test_get_period_revenue_week(self, mock_supabase):
        """Test getting weekly revenue."""
        tools = AnalyticsTools(supabase_client=mock_supabase)
        
        result = tools.get_period_revenue(period='week')
        
        assert result['period'] == 'week'
        assert result['days'] == 7
    
    def test_get_period_revenue_month(self, mock_supabase):
        """Test getting monthly revenue."""
        tools = AnalyticsTools(supabase_client=mock_supabase)
        
        result = tools.get_period_revenue(period='month')
        
        assert result['period'] == 'month'
        assert result['days'] == 30
    
    def test_get_period_revenue_year(self, mock_supabase):
        """Test getting yearly revenue."""
        tools = AnalyticsTools(supabase_client=mock_supabase)
        
        result = tools.get_period_revenue(period='year')
        
        assert result['period'] == 'year'
        assert result['days'] == 365
    
    def test_get_period_revenue_day(self, mock_supabase):
        """Test getting daily revenue."""
        tools = AnalyticsTools(supabase_client=mock_supabase)
        
        result = tools.get_period_revenue(period='day')
        
        assert result['period'] == 'day'
        assert result['days'] == 1
    
    def test_get_period_revenue_invalid(self, mock_supabase):
        """Test with invalid period defaults to week."""
        tools = AnalyticsTools(supabase_client=mock_supabase)
        
        result = tools.get_period_revenue(period='invalid')
        
        assert result['days'] == 7  # Default to week
    
    def test_get_period_revenue_with_store(self, mock_supabase):
        """Test filtering by store."""
        tools = AnalyticsTools(supabase_client=mock_supabase)
        
        result = tools.get_period_revenue(store_id="store-001")
        
        assert 'total_revenue' in result
    
    def test_get_period_revenue_has_average(self, mock_supabase):
        """Test result includes average order value."""
        tools = AnalyticsTools(supabase_client=mock_supabase)
        
        result = tools.get_period_revenue()
        
        assert 'average_order_value' in result
        assert 'formatted_average' in result


class TestCompareRevenue:
    """Test compare_revenue method."""
    
    def test_compare_this_week_last_week(self, mock_supabase):
        """Test comparing this week vs last week."""
        tools = AnalyticsTools(supabase_client=mock_supabase)
        
        result = tools.compare_revenue('last_week', 'this_week')
        
        assert 'period1' in result
        assert 'period2' in result
        assert 'growth_percentage' in result
        assert 'growth_direction' in result
    
    def test_compare_this_month_last_month(self, mock_supabase):
        """Test comparing this month vs last month."""
        tools = AnalyticsTools(supabase_client=mock_supabase)
        
        result = tools.compare_revenue('last_month', 'this_month')
        
        assert result['period1']['name'] == 'last_month'
        assert result['period2']['name'] == 'this_month'
    
    def test_compare_today_yesterday(self, mock_supabase):
        """Test comparing today vs yesterday."""
        tools = AnalyticsTools(supabase_client=mock_supabase)
        
        result = tools.compare_revenue('yesterday', 'today')
        
        assert 'growth_percentage' in result
    
    def test_compare_invalid_periods(self, mock_supabase):
        """Test with invalid periods defaults to week."""
        tools = AnalyticsTools(supabase_client=mock_supabase)
        
        result = tools.compare_revenue('invalid1', 'invalid2')
        
        # Should still return valid structure
        assert 'period1' in result
        assert 'period2' in result
    
    def test_compare_with_store(self, mock_supabase):
        """Test comparison with store filter."""
        tools = AnalyticsTools(supabase_client=mock_supabase)
        
        result = tools.compare_revenue('last_week', 'this_week', store_id="store-001")
        
        assert 'growth_percentage' in result
    
    def test_compare_has_difference(self, mock_supabase):
        """Test comparison includes difference."""
        tools = AnalyticsTools(supabase_client=mock_supabase)
        
        result = tools.compare_revenue('last_week', 'this_week')
        
        assert 'revenue_difference' in result
        assert 'formatted_difference' in result


class TestGetPopularServices:
    """Test get_popular_services method."""
    
    def test_get_popular_services(self, mock_supabase):
        """Test getting popular services."""
        tools = AnalyticsTools(supabase_client=mock_supabase)
        
        results = tools.get_popular_services()
        
        assert isinstance(results, list)
    
    def test_get_popular_services_week(self, mock_supabase):
        """Test getting popular services for week."""
        tools = AnalyticsTools(supabase_client=mock_supabase)
        
        results = tools.get_popular_services(period='week')
        
        assert isinstance(results, list)
    
    def test_get_popular_services_month(self, mock_supabase):
        """Test getting popular services for month."""
        tools = AnalyticsTools(supabase_client=mock_supabase)
        
        results = tools.get_popular_services(period='month')
        
        assert isinstance(results, list)
    
    def test_get_popular_services_with_limit(self, mock_supabase):
        """Test limiting results."""
        tools = AnalyticsTools(supabase_client=mock_supabase)
        
        results = tools.get_popular_services(limit=5)
        
        assert len(results) <= 5
    
    def test_get_popular_services_with_store(self, mock_supabase):
        """Test filtering by store."""
        tools = AnalyticsTools(supabase_client=mock_supabase)
        
        results = tools.get_popular_services(store_id="store-001")
        
        assert isinstance(results, list)
    
    def test_popular_services_have_stats(self, mock_supabase):
        """Test services have stats."""
        tools = AnalyticsTools(supabase_client=mock_supabase)
        
        results = tools.get_popular_services()
        
        if results:
            assert 'service_name' in results[0]
            assert 'order_count' in results[0]
            assert 'total_revenue' in results[0]
            assert 'formatted_revenue' in results[0]


class TestGetPeakHours:
    """Test get_peak_hours method."""
    
    def test_get_peak_hours(self, mock_supabase):
        """Test getting peak hours."""
        tools = AnalyticsTools(supabase_client=mock_supabase)
        
        results = tools.get_peak_hours()
        
        assert isinstance(results, list)
        assert len(results) == 24  # All hours
    
    def test_get_peak_hours_custom_days(self, mock_supabase):
        """Test with custom days."""
        tools = AnalyticsTools(supabase_client=mock_supabase)
        
        results = tools.get_peak_hours(days=7)
        
        assert isinstance(results, list)
    
    def test_get_peak_hours_with_store(self, mock_supabase):
        """Test filtering by store."""
        tools = AnalyticsTools(supabase_client=mock_supabase)
        
        results = tools.get_peak_hours(store_id="store-001")
        
        assert isinstance(results, list)
    
    def test_peak_hours_sorted_by_count(self, mock_supabase):
        """Test hours are sorted by order count."""
        tools = AnalyticsTools(supabase_client=mock_supabase)
        
        results = tools.get_peak_hours()
        
        # Should be sorted descending
        for i in range(len(results) - 1):
            assert results[i]['order_count'] >= results[i + 1]['order_count']
    
    def test_peak_hours_have_time_label(self, mock_supabase):
        """Test hours have time label."""
        tools = AnalyticsTools(supabase_client=mock_supabase)
        
        results = tools.get_peak_hours()
        
        if results:
            assert 'time_label' in results[0]
            assert 'hour' in results[0]


class TestGetCustomerStats:
    """Test get_customer_stats method."""
    
    def test_get_customer_stats_month(self, mock_supabase):
        """Test getting customer stats for month."""
        tools = AnalyticsTools(supabase_client=mock_supabase)
        
        result = tools.get_customer_stats(period='month')
        
        assert result['period'] == 'month'
        assert 'total_customers' in result
        assert 'new_customers' in result
        assert 'active_customers' in result
    
    def test_get_customer_stats_week(self, mock_supabase):
        """Test getting customer stats for week."""
        tools = AnalyticsTools(supabase_client=mock_supabase)
        
        result = tools.get_customer_stats(period='week')
        
        assert result['period'] == 'week'
    
    def test_get_customer_stats_year(self, mock_supabase):
        """Test getting customer stats for year."""
        tools = AnalyticsTools(supabase_client=mock_supabase)
        
        result = tools.get_customer_stats(period='year')
        
        assert result['period'] == 'year'
    
    def test_get_customer_stats_with_store(self, mock_supabase):
        """Test filtering by store."""
        tools = AnalyticsTools(supabase_client=mock_supabase)
        
        result = tools.get_customer_stats(store_id="store-001")
        
        assert 'total_customers' in result
    
    def test_customer_stats_has_revenue(self, mock_supabase):
        """Test stats include revenue metrics."""
        tools = AnalyticsTools(supabase_client=mock_supabase)
        
        result = tools.get_customer_stats()
        
        assert 'total_revenue' in result
        assert 'average_order_value' in result
        assert 'customer_lifetime_value' in result
        assert 'formatted_revenue' in result
        assert 'formatted_aov' in result
        assert 'formatted_clv' in result


class TestGetOrderSummary:
    """Test get_order_summary method."""
    
    def test_get_order_summary(self, mock_supabase):
        """Test getting order summary."""
        tools = AnalyticsTools(supabase_client=mock_supabase)
        
        result = tools.get_order_summary()
        
        assert 'total_orders' in result
        assert 'by_status' in result
        assert 'by_payment' in result
        assert 'active_orders' in result
    
    def test_get_order_summary_with_store(self, mock_supabase):
        """Test filtering by store."""
        tools = AnalyticsTools(supabase_client=mock_supabase)
        
        result = tools.get_order_summary(store_id="store-001")
        
        assert 'total_orders' in result
    
    def test_order_summary_has_all_statuses(self, mock_supabase):
        """Test summary includes all statuses."""
        tools = AnalyticsTools(supabase_client=mock_supabase)
        
        result = tools.get_order_summary()
        
        assert 'pending' in result['by_status']
        assert 'in_progress' in result['by_status']
        assert 'ready_for_pickup' in result['by_status']
        assert 'completed' in result['by_status']
        assert 'cancelled' in result['by_status']
    
    def test_order_summary_has_all_payments(self, mock_supabase):
        """Test summary includes all payment statuses."""
        tools = AnalyticsTools(supabase_client=mock_supabase)
        
        result = tools.get_order_summary()
        
        assert 'pending' in result['by_payment']
        assert 'paid' in result['by_payment']
        assert 'refunded' in result['by_payment']


class TestAnalyticsHelperMethods:
    """Test helper methods."""
    
    def test_parse_datetime_valid(self, mock_supabase):
        """Test parsing valid datetime."""
        tools = AnalyticsTools(supabase_client=mock_supabase)
        
        result = tools._parse_datetime("2024-12-14T10:00:00Z")
        
        assert result is not None
        assert result.hour == 10
    
    def test_parse_datetime_with_timezone(self, mock_supabase):
        """Test parsing datetime with timezone."""
        tools = AnalyticsTools(supabase_client=mock_supabase)
        
        result = tools._parse_datetime("2024-12-14T10:00:00+07:00")
        
        assert result is not None
    
    def test_parse_datetime_empty(self, mock_supabase):
        """Test parsing empty string."""
        tools = AnalyticsTools(supabase_client=mock_supabase)
        
        result = tools._parse_datetime("")
        
        assert result is None
    
    def test_parse_datetime_none(self, mock_supabase):
        """Test parsing None."""
        tools = AnalyticsTools(supabase_client=mock_supabase)
        
        result = tools._parse_datetime(None)
        
        assert result is None
    
    def test_parse_datetime_invalid(self, mock_supabase):
        """Test parsing invalid string."""
        tools = AnalyticsTools(supabase_client=mock_supabase)
        
        result = tools._parse_datetime("not-a-date")
        
        assert result is None
