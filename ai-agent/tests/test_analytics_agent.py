"""Tests for AnalyticsAgent - 100% coverage."""

import pytest
from datetime import date, datetime, timedelta
from unittest.mock import Mock, patch, MagicMock

from src.agents.analytics_agent import AnalyticsAgent
from src.tools import AnalyticsTools


class TestAnalyticsAgentInit:
    """Test AnalyticsAgent initialization."""
    
    def test_init_with_tools(self, mock_supabase):
        """Test initialization with provided tools."""
        analytics_tools = AnalyticsTools(supabase_client=mock_supabase)
        
        agent = AnalyticsAgent(analytics_tools=analytics_tools)
        
        assert agent._analytics_tools == analytics_tools
    
    def test_init_without_tools(self):
        """Test initialization without tools."""
        agent = AnalyticsAgent()
        
        assert agent._analytics_tools is None
    
    def test_tools_lazy_loading(self, mock_supabase):
        """Test tools are loaded lazily."""
        analytics_tools = AnalyticsTools(supabase_client=mock_supabase)
        
        agent = AnalyticsAgent(analytics_tools=analytics_tools)
        
        assert agent.analytics_tools == analytics_tools


class TestProcessQuery:
    """Test process_query method."""
    
    def test_query_today_revenue(self, mock_supabase):
        """Test query for today's revenue."""
        agent = AnalyticsAgent(
            analytics_tools=AnalyticsTools(supabase_client=mock_supabase)
        )
        
        result = agent.process_query("berapa pendapatan hari ini?")
        
        assert result['success'] == True
        assert 'data' in result
    
    def test_query_period_revenue(self, mock_supabase):
        """Test query for period revenue."""
        agent = AnalyticsAgent(
            analytics_tools=AnalyticsTools(supabase_client=mock_supabase)
        )
        
        result = agent.process_query("pendapatan minggu ini")
        
        assert result['success'] == True
    
    def test_query_comparison(self, mock_supabase):
        """Test query for comparison."""
        agent = AnalyticsAgent(
            analytics_tools=AnalyticsTools(supabase_client=mock_supabase)
        )
        
        result = agent.process_query("bandingkan pendapatan bulan ini dengan bulan lalu")
        
        assert result['success'] == True
    
    def test_query_popular_services(self, mock_supabase):
        """Test query for popular services."""
        agent = AnalyticsAgent(
            analytics_tools=AnalyticsTools(supabase_client=mock_supabase)
        )
        
        result = agent.process_query("layanan apa yang paling laku?")
        
        assert result['success'] == True
    
    def test_query_order_pattern(self, mock_supabase):
        """Test query for order pattern by hour."""
        agent = AnalyticsAgent(
            analytics_tools=AnalyticsTools(supabase_client=mock_supabase)
        )
        
        result = agent.process_query("jam berapa paling ramai?")
        
        assert result['success'] == True
    
    def test_query_revenue_trend(self, mock_supabase):
        """Test query for revenue trend."""
        agent = AnalyticsAgent(
            analytics_tools=AnalyticsTools(supabase_client=mock_supabase)
        )
        
        result = agent.process_query("bagaimana tren pendapatan?")
        
        assert result['success'] == True
    
    def test_query_empty(self, mock_supabase):
        """Test empty query."""
        agent = AnalyticsAgent(
            analytics_tools=AnalyticsTools(supabase_client=mock_supabase)
        )
        
        result = agent.process_query("")
        
        assert result['success'] == False
    
    def test_query_unknown_intent(self, mock_supabase):
        """Test unknown query intent."""
        agent = AnalyticsAgent(
            analytics_tools=AnalyticsTools(supabase_client=mock_supabase)
        )
        
        result = agent.process_query("sesuatu yang tidak dimengerti xyz123")
        
        assert result['success'] == True
        # Should return general help or summary


class TestIntentDetection:
    """Test intent detection methods."""
    
    def test_detect_today_revenue(self, mock_supabase):
        """Test detection of today's revenue query."""
        agent = AnalyticsAgent(
            analytics_tools=AnalyticsTools(supabase_client=mock_supabase)
        )
        
        intent = agent._detect_intent("pendapatan hari ini")
        
        assert intent == "today_revenue"
    
    def test_detect_period_revenue(self, mock_supabase):
        """Test detection of period revenue query."""
        agent = AnalyticsAgent(
            analytics_tools=AnalyticsTools(supabase_client=mock_supabase)
        )
        
        intent = agent._detect_intent("pendapatan minggu ini")
        
        assert intent == "period_revenue"
    
    def test_detect_comparison(self, mock_supabase):
        """Test detection of comparison query."""
        agent = AnalyticsAgent(
            analytics_tools=AnalyticsTools(supabase_client=mock_supabase)
        )
        
        intent = agent._detect_intent("bandingkan dengan bulan lalu")
        
        assert intent == "comparison"
    
    def test_detect_popular_services(self, mock_supabase):
        """Test detection of popular services query."""
        agent = AnalyticsAgent(
            analytics_tools=AnalyticsTools(supabase_client=mock_supabase)
        )
        
        intent = agent._detect_intent("layanan paling laku")
        
        assert intent == "popular_services"
    
    def test_detect_order_pattern(self, mock_supabase):
        """Test detection of order pattern query."""
        agent = AnalyticsAgent(
            analytics_tools=AnalyticsTools(supabase_client=mock_supabase)
        )
        
        intent = agent._detect_intent("jam paling ramai")
        
        assert intent == "order_pattern"
    
    def test_detect_trend(self, mock_supabase):
        """Test detection of trend query."""
        agent = AnalyticsAgent(
            analytics_tools=AnalyticsTools(supabase_client=mock_supabase)
        )
        
        intent = agent._detect_intent("tren pendapatan")
        
        assert intent == "trend"


class TestParsePeriod:
    """Test _parse_period method."""
    
    def test_parse_today(self, mock_supabase):
        """Test parsing 'today' period."""
        agent = AnalyticsAgent(
            analytics_tools=AnalyticsTools(supabase_client=mock_supabase)
        )
        
        period = agent._parse_period("hari ini")
        
        assert period == "daily"
    
    def test_parse_week(self, mock_supabase):
        """Test parsing 'week' period."""
        agent = AnalyticsAgent(
            analytics_tools=AnalyticsTools(supabase_client=mock_supabase)
        )
        
        period = agent._parse_period("minggu ini")
        
        assert period == "weekly"
    
    def test_parse_month(self, mock_supabase):
        """Test parsing 'month' period."""
        agent = AnalyticsAgent(
            analytics_tools=AnalyticsTools(supabase_client=mock_supabase)
        )
        
        period = agent._parse_period("bulan ini")
        
        assert period == "monthly"
    
    def test_parse_year(self, mock_supabase):
        """Test parsing 'year' period."""
        agent = AnalyticsAgent(
            analytics_tools=AnalyticsTools(supabase_client=mock_supabase)
        )
        
        period = agent._parse_period("tahun ini")
        
        assert period == "yearly"
    
    def test_parse_default(self, mock_supabase):
        """Test parsing unknown period defaults to daily."""
        agent = AnalyticsAgent(
            analytics_tools=AnalyticsTools(supabase_client=mock_supabase)
        )
        
        period = agent._parse_period("random text")
        
        assert period == "daily"


class TestReportGeneration:
    """Test report generation methods."""
    
    def test_generate_daily_report(self, mock_supabase):
        """Test generating daily report."""
        agent = AnalyticsAgent(
            analytics_tools=AnalyticsTools(supabase_client=mock_supabase)
        )
        
        result = agent.generate_daily_report()
        
        assert result['success'] == True
        assert 'report' in result
    
    def test_generate_daily_report_with_date(self, mock_supabase):
        """Test generating daily report for specific date."""
        agent = AnalyticsAgent(
            analytics_tools=AnalyticsTools(supabase_client=mock_supabase)
        )
        
        report_date = date.today() - timedelta(days=1)
        result = agent.generate_daily_report(report_date=report_date)
        
        assert result['success'] == True
    
    def test_generate_weekly_report(self, mock_supabase):
        """Test generating weekly report."""
        agent = AnalyticsAgent(
            analytics_tools=AnalyticsTools(supabase_client=mock_supabase)
        )
        
        result = agent.generate_weekly_report()
        
        assert result['success'] == True
        assert 'report' in result
    
    def test_generate_monthly_report(self, mock_supabase):
        """Test generating monthly report."""
        agent = AnalyticsAgent(
            analytics_tools=AnalyticsTools(supabase_client=mock_supabase)
        )
        
        result = agent.generate_monthly_report()
        
        assert result['success'] == True
        assert 'report' in result


class TestComparisonMethods:
    """Test comparison methods."""
    
    def test_compare_day_over_day(self, mock_supabase):
        """Test day over day comparison."""
        agent = AnalyticsAgent(
            analytics_tools=AnalyticsTools(supabase_client=mock_supabase)
        )
        
        result = agent.compare_performance("day")
        
        assert result['success'] == True
        assert 'comparison' in result
    
    def test_compare_week_over_week(self, mock_supabase):
        """Test week over week comparison."""
        agent = AnalyticsAgent(
            analytics_tools=AnalyticsTools(supabase_client=mock_supabase)
        )
        
        result = agent.compare_performance("week")
        
        assert result['success'] == True
    
    def test_compare_month_over_month(self, mock_supabase):
        """Test month over month comparison."""
        agent = AnalyticsAgent(
            analytics_tools=AnalyticsTools(supabase_client=mock_supabase)
        )
        
        result = agent.compare_performance("month")
        
        assert result['success'] == True


class TestTopServices:
    """Test top services methods."""
    
    def test_get_top_services_default(self, mock_supabase):
        """Test getting top services with default limit."""
        agent = AnalyticsAgent(
            analytics_tools=AnalyticsTools(supabase_client=mock_supabase)
        )
        
        result = agent.get_top_services()
        
        assert result['success'] == True
        assert 'services' in result
    
    def test_get_top_services_custom_limit(self, mock_supabase):
        """Test getting top services with custom limit."""
        agent = AnalyticsAgent(
            analytics_tools=AnalyticsTools(supabase_client=mock_supabase)
        )
        
        result = agent.get_top_services(limit=10)
        
        assert result['success'] == True
    
    def test_get_top_services_with_period(self, mock_supabase):
        """Test getting top services with period."""
        agent = AnalyticsAgent(
            analytics_tools=AnalyticsTools(supabase_client=mock_supabase)
        )
        
        result = agent.get_top_services(period="monthly")
        
        assert result['success'] == True


class TestPeakHours:
    """Test peak hours methods."""
    
    def test_get_peak_hours(self, mock_supabase):
        """Test getting peak hours."""
        agent = AnalyticsAgent(
            analytics_tools=AnalyticsTools(supabase_client=mock_supabase)
        )
        
        result = agent.get_peak_hours()
        
        assert result['success'] == True
        assert 'peak_hours' in result
    
    def test_get_peak_hours_for_date(self, mock_supabase):
        """Test getting peak hours for specific date."""
        agent = AnalyticsAgent(
            analytics_tools=AnalyticsTools(supabase_client=mock_supabase)
        )
        
        result = agent.get_peak_hours(analysis_date=date.today())
        
        assert result['success'] == True


class TestTrendAnalysis:
    """Test trend analysis methods."""
    
    def test_analyze_trend_daily(self, mock_supabase):
        """Test daily trend analysis."""
        agent = AnalyticsAgent(
            analytics_tools=AnalyticsTools(supabase_client=mock_supabase)
        )
        
        result = agent.analyze_trend(period="daily", days=7)
        
        assert result['success'] == True
        assert 'trend' in result
    
    def test_analyze_trend_weekly(self, mock_supabase):
        """Test weekly trend analysis."""
        agent = AnalyticsAgent(
            analytics_tools=AnalyticsTools(supabase_client=mock_supabase)
        )
        
        result = agent.analyze_trend(period="weekly", days=28)
        
        assert result['success'] == True
    
    def test_analyze_trend_monthly(self, mock_supabase):
        """Test monthly trend analysis."""
        agent = AnalyticsAgent(
            analytics_tools=AnalyticsTools(supabase_client=mock_supabase)
        )
        
        result = agent.analyze_trend(period="monthly", days=90)
        
        assert result['success'] == True


class TestFormatResponse:
    """Test response formatting methods."""
    
    def test_format_currency(self, mock_supabase):
        """Test currency formatting."""
        agent = AnalyticsAgent(
            analytics_tools=AnalyticsTools(supabase_client=mock_supabase)
        )
        
        formatted = agent._format_currency(1000000)
        
        assert "Rp" in formatted
        assert "1.000.000" in formatted or "1,000,000" in formatted
    
    def test_format_percentage(self, mock_supabase):
        """Test percentage formatting."""
        agent = AnalyticsAgent(
            analytics_tools=AnalyticsTools(supabase_client=mock_supabase)
        )
        
        formatted = agent._format_percentage(25.5)
        
        assert "%" in formatted
    
    def test_format_response_for_revenue(self, mock_supabase):
        """Test formatting revenue response."""
        agent = AnalyticsAgent(
            analytics_tools=AnalyticsTools(supabase_client=mock_supabase)
        )
        
        data = {
            'revenue': 1000000,
            'order_count': 50,
            'average_order': 20000
        }
        
        response = agent._format_response("today_revenue", data)
        
        assert response is not None
        assert len(response) > 0


class TestWithGemini:
    """Test Gemini integration."""
    
    def test_with_gemini_client(self, mock_supabase, mock_gemini_client):
        """Test agent with Gemini client."""
        agent = AnalyticsAgent(
            analytics_tools=AnalyticsTools(supabase_client=mock_supabase),
            gemini_client=mock_gemini_client
        )
        
        result = agent.process_query("analisis mendalam pendapatan")
        
        assert result['success'] == True
    
    def test_gemini_error_handling(self, mock_supabase, mock_gemini_client):
        """Test Gemini error handling."""
        mock_gemini_client.generate_content.side_effect = Exception("API Error")
        
        agent = AnalyticsAgent(
            analytics_tools=AnalyticsTools(supabase_client=mock_supabase),
            gemini_client=mock_gemini_client
        )
        
        result = agent.process_query("analisis mendalam")
        
        # Should fall back to basic analytics
        assert result['success'] == True


class TestSystemPrompt:
    """Test system prompt constant."""
    
    def test_system_prompt_exists(self, mock_supabase):
        """Test system prompt is defined."""
        assert AnalyticsAgent.SYSTEM_PROMPT is not None
        assert len(AnalyticsAgent.SYSTEM_PROMPT) > 0
        assert "analytics" in AnalyticsAgent.SYSTEM_PROMPT.lower() or "analitik" in AnalyticsAgent.SYSTEM_PROMPT.lower()
