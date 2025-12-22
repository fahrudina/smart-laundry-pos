"""Tests for LaundryToolboxClient - 100% coverage."""

import pytest
from unittest.mock import Mock, AsyncMock, patch, MagicMock

from src.toolbox_client import LaundryToolboxClient, create_toolbox_client


class TestLaundryToolboxClientInit:
    """Test LaundryToolboxClient initialization."""
    
    def test_init_default_url(self):
        """Test initialization with default URL."""
        client = LaundryToolboxClient()
        assert client._url == "http://127.0.0.1:5000"
        assert client._client is None
        assert client._tools == {}
    
    def test_init_custom_url(self):
        """Test initialization with custom URL."""
        client = LaundryToolboxClient("http://custom:8000")
        assert client._url == "http://custom:8000"


class TestConnection:
    """Test connection methods."""
    
    @pytest.mark.asyncio
    async def test_connect(self):
        """Test connecting to Toolbox server."""
        with patch('src.toolbox_client.ToolboxClient') as mock_class:
            mock_instance = Mock()
            mock_class.return_value = mock_instance
            
            client = LaundryToolboxClient()
            result = await client.connect()
            
            assert result == client
            assert client._client == mock_instance
            mock_class.assert_called_once_with("http://127.0.0.1:5000")
    
    @pytest.mark.asyncio
    async def test_close(self):
        """Test closing connection."""
        with patch('src.toolbox_client.ToolboxClient') as mock_class:
            mock_instance = AsyncMock()
            mock_class.return_value = mock_instance
            
            client = LaundryToolboxClient()
            await client.connect()
            await client.close()
            
            mock_instance.close.assert_called_once()
            assert client._client is None
    
    @pytest.mark.asyncio
    async def test_close_without_connection(self):
        """Test closing without active connection."""
        client = LaundryToolboxClient()
        await client.close()  # Should not raise


class TestAsyncContextManager:
    """Test async context manager."""
    
    @pytest.mark.asyncio
    async def test_context_manager(self):
        """Test using client as context manager."""
        with patch('src.toolbox_client.ToolboxClient') as mock_class:
            mock_instance = AsyncMock()
            mock_class.return_value = mock_instance
            
            async with LaundryToolboxClient() as client:
                assert client._client is not None
            
            mock_instance.close.assert_called_once()


class TestLoadToolset:
    """Test toolset loading methods."""
    
    @pytest.mark.asyncio
    async def test_load_toolset(self):
        """Test loading a toolset."""
        with patch('src.toolbox_client.ToolboxClient') as mock_class:
            mock_tool = Mock()
            mock_tool.__name__ = "test-tool"
            
            mock_instance = AsyncMock()
            mock_instance.load_toolset = AsyncMock(return_value=[mock_tool])
            mock_class.return_value = mock_instance
            
            client = LaundryToolboxClient()
            await client.connect()
            
            tools = await client.load_toolset("test-toolset")
            
            assert len(tools) == 1
            assert "test-tool" in client._tools
            mock_instance.load_toolset.assert_called_with("test-toolset")
    
    @pytest.mark.asyncio
    async def test_load_customer_service_tools(self):
        """Test loading customer service tools."""
        with patch.object(LaundryToolboxClient, 'load_toolset', new_callable=AsyncMock) as mock_load:
            mock_load.return_value = []
            
            client = LaundryToolboxClient()
            await client.load_customer_service_tools()
            
            mock_load.assert_called_with("customer-service")
    
    @pytest.mark.asyncio
    async def test_load_analytics_tools(self):
        """Test loading analytics tools."""
        with patch.object(LaundryToolboxClient, 'load_toolset', new_callable=AsyncMock) as mock_load:
            mock_load.return_value = []
            
            client = LaundryToolboxClient()
            await client.load_analytics_tools()
            
            mock_load.assert_called_with("analytics")
    
    @pytest.mark.asyncio
    async def test_load_whatsapp_tools(self):
        """Test loading WhatsApp tools."""
        with patch.object(LaundryToolboxClient, 'load_toolset', new_callable=AsyncMock) as mock_load:
            mock_load.return_value = []
            
            client = LaundryToolboxClient()
            await client.load_whatsapp_tools()
            
            mock_load.assert_called_with("whatsapp")
    
    @pytest.mark.asyncio
    async def test_load_all_tools(self):
        """Test loading all tools."""
        with patch.object(LaundryToolboxClient, 'load_toolset', new_callable=AsyncMock) as mock_load:
            mock_load.return_value = []
            
            client = LaundryToolboxClient()
            await client.load_all_tools()
            
            mock_load.assert_called_with("all-tools")


class TestGetTool:
    """Test get_tool method."""
    
    def test_get_existing_tool(self):
        """Test getting an existing tool."""
        client = LaundryToolboxClient()
        mock_tool = Mock()
        client._tools["test-tool"] = mock_tool
        
        result = client.get_tool("test-tool")
        
        assert result == mock_tool
    
    def test_get_nonexistent_tool(self):
        """Test getting a nonexistent tool."""
        client = LaundryToolboxClient()
        
        result = client.get_tool("nonexistent")
        
        assert result is None


class TestExecuteTool:
    """Test execute_tool method."""
    
    @pytest.mark.asyncio
    async def test_execute_loaded_tool(self):
        """Test executing a loaded tool."""
        client = LaundryToolboxClient()
        
        mock_tool = AsyncMock(return_value=[{"id": "123"}])
        client._tools["test-tool"] = mock_tool
        
        result = await client.execute_tool("test-tool", param1="value1")
        
        assert result == [{"id": "123"}]
        mock_tool.assert_called_once_with(param1="value1")
    
    @pytest.mark.asyncio
    async def test_execute_tool_loads_if_not_found(self):
        """Test executing tool triggers load if not found."""
        with patch.object(LaundryToolboxClient, 'load_all_tools', new_callable=AsyncMock) as mock_load:
            client = LaundryToolboxClient()
            
            mock_tool = AsyncMock(return_value=[])
            
            async def load_and_add():
                client._tools["test-tool"] = mock_tool
            
            mock_load.side_effect = load_and_add
            
            result = await client.execute_tool("test-tool")
            
            mock_load.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_execute_tool_not_found(self):
        """Test executing tool that doesn't exist."""
        with patch.object(LaundryToolboxClient, 'load_all_tools', new_callable=AsyncMock):
            client = LaundryToolboxClient()
            
            with pytest.raises(ValueError, match="Tool 'nonexistent' not found"):
                await client.execute_tool("nonexistent")


class TestCustomerTools:
    """Test customer-related tool wrappers."""
    
    @pytest.mark.asyncio
    async def test_search_customer(self):
        """Test search_customer wrapper."""
        with patch.object(LaundryToolboxClient, 'execute_tool', new_callable=AsyncMock) as mock_exec:
            mock_exec.return_value = [{"name": "John"}]
            
            client = LaundryToolboxClient()
            result = await client.search_customer("John")
            
            mock_exec.assert_called_once_with("search-customer", query="John")
            assert result == [{"name": "John"}]
    
    @pytest.mark.asyncio
    async def test_get_customer_by_phone(self):
        """Test get_customer_by_phone wrapper."""
        with patch.object(LaundryToolboxClient, 'execute_tool', new_callable=AsyncMock) as mock_exec:
            mock_exec.return_value = [{"phone": "08123"}]
            
            client = LaundryToolboxClient()
            result = await client.get_customer_by_phone("08123")
            
            mock_exec.assert_called_once_with("get-customer-by-phone", phone="08123")
            assert result == {"phone": "08123"}
    
    @pytest.mark.asyncio
    async def test_get_customer_by_phone_not_found(self):
        """Test get_customer_by_phone when not found."""
        with patch.object(LaundryToolboxClient, 'execute_tool', new_callable=AsyncMock) as mock_exec:
            mock_exec.return_value = []
            
            client = LaundryToolboxClient()
            result = await client.get_customer_by_phone("000")
            
            assert result is None
    
    @pytest.mark.asyncio
    async def test_get_customer_points(self):
        """Test get_customer_points wrapper."""
        with patch.object(LaundryToolboxClient, 'execute_tool', new_callable=AsyncMock) as mock_exec:
            mock_exec.return_value = [{"points": 100}]
            
            client = LaundryToolboxClient()
            result = await client.get_customer_points("08123")
            
            mock_exec.assert_called_once_with("get-customer-points", phone="08123")
            assert result == {"points": 100}
    
    @pytest.mark.asyncio
    async def test_get_churned_customers(self):
        """Test get_churned_customers wrapper."""
        with patch.object(LaundryToolboxClient, 'execute_tool', new_callable=AsyncMock) as mock_exec:
            mock_exec.return_value = [{"name": "Churned"}]
            
            client = LaundryToolboxClient()
            result = await client.get_churned_customers(60)
            
            mock_exec.assert_called_once_with("get-churned-customers", days_since_first_order=60)
    
    @pytest.mark.asyncio
    async def test_get_inactive_customers(self):
        """Test get_inactive_customers wrapper."""
        with patch.object(LaundryToolboxClient, 'execute_tool', new_callable=AsyncMock) as mock_exec:
            mock_exec.return_value = [{"name": "Inactive"}]
            
            client = LaundryToolboxClient()
            result = await client.get_inactive_customers(45)
            
            mock_exec.assert_called_once_with("get-inactive-customers", inactive_days=45)


class TestOrderTools:
    """Test order-related tool wrappers."""
    
    @pytest.mark.asyncio
    async def test_check_order_status(self):
        """Test check_order_status wrapper."""
        with patch.object(LaundryToolboxClient, 'execute_tool', new_callable=AsyncMock) as mock_exec:
            mock_exec.return_value = [{"status": "processing"}]
            
            client = LaundryToolboxClient()
            result = await client.check_order_status("08123", 5)
            
            mock_exec.assert_called_once_with("check-order-status", phone="08123", limit=5)
    
    @pytest.mark.asyncio
    async def test_get_order_by_id(self):
        """Test get_order_by_id wrapper."""
        with patch.object(LaundryToolboxClient, 'execute_tool', new_callable=AsyncMock) as mock_exec:
            mock_exec.return_value = [{"id": "abc123"}]
            
            client = LaundryToolboxClient()
            result = await client.get_order_by_id("abc123")
            
            mock_exec.assert_called_once_with("get-order-by-id", order_id="abc123")
            assert result == {"id": "abc123"}
    
    @pytest.mark.asyncio
    async def test_get_todays_orders(self):
        """Test get_todays_orders wrapper."""
        with patch.object(LaundryToolboxClient, 'execute_tool', new_callable=AsyncMock) as mock_exec:
            mock_exec.return_value = [{"id": "1"}, {"id": "2"}]
            
            client = LaundryToolboxClient()
            result = await client.get_todays_orders()
            
            mock_exec.assert_called_once_with("get-todays-orders", store_id="")
    
    @pytest.mark.asyncio
    async def test_update_order_status(self):
        """Test update_order_status wrapper."""
        with patch.object(LaundryToolboxClient, 'execute_tool', new_callable=AsyncMock) as mock_exec:
            mock_exec.return_value = [{"id": "abc", "status": "completed"}]
            
            client = LaundryToolboxClient()
            result = await client.update_order_status("abc", "completed")
            
            mock_exec.assert_called_once_with(
                "update-order-status",
                order_id="abc",
                new_status="completed"
            )


class TestAnalyticsTools:
    """Test analytics-related tool wrappers."""
    
    @pytest.mark.asyncio
    async def test_get_daily_revenue(self):
        """Test get_daily_revenue wrapper."""
        with patch.object(LaundryToolboxClient, 'execute_tool', new_callable=AsyncMock) as mock_exec:
            mock_exec.return_value = [{"total_revenue": 1000000}]
            
            client = LaundryToolboxClient()
            result = await client.get_daily_revenue("2025-01-01")
            
            mock_exec.assert_called_once_with("get-daily-revenue", date="2025-01-01")
    
    @pytest.mark.asyncio
    async def test_get_weekly_revenue(self):
        """Test get_weekly_revenue wrapper."""
        with patch.object(LaundryToolboxClient, 'execute_tool', new_callable=AsyncMock) as mock_exec:
            mock_exec.return_value = [{"total_revenue": 5000000}]
            
            client = LaundryToolboxClient()
            result = await client.get_weekly_revenue()
            
            mock_exec.assert_called_once_with("get-weekly-revenue")
    
    @pytest.mark.asyncio
    async def test_get_popular_services(self):
        """Test get_popular_services wrapper."""
        with patch.object(LaundryToolboxClient, 'execute_tool', new_callable=AsyncMock) as mock_exec:
            mock_exec.return_value = [{"name": "Cuci Kiloan"}]
            
            client = LaundryToolboxClient()
            result = await client.get_popular_services(days=7, limit=5)
            
            mock_exec.assert_called_once_with("get-popular-services", days=7, limit=5)
    
    @pytest.mark.asyncio
    async def test_get_peak_hours(self):
        """Test get_peak_hours wrapper."""
        with patch.object(LaundryToolboxClient, 'execute_tool', new_callable=AsyncMock) as mock_exec:
            mock_exec.return_value = [{"hour": 10, "count": 50}]
            
            client = LaundryToolboxClient()
            result = await client.get_peak_hours(days=14)
            
            mock_exec.assert_called_once_with("get-peak-hours", days=14)


class TestServiceTools:
    """Test service-related tool wrappers."""
    
    @pytest.mark.asyncio
    async def test_get_all_services(self):
        """Test get_all_services wrapper."""
        with patch.object(LaundryToolboxClient, 'execute_tool', new_callable=AsyncMock) as mock_exec:
            mock_exec.return_value = [{"name": "Cuci Setrika"}]
            
            client = LaundryToolboxClient()
            result = await client.get_all_services()
            
            mock_exec.assert_called_once_with("get-all-services", store_id="")
    
    @pytest.mark.asyncio
    async def test_get_service_by_name(self):
        """Test get_service_by_name wrapper."""
        with patch.object(LaundryToolboxClient, 'execute_tool', new_callable=AsyncMock) as mock_exec:
            mock_exec.return_value = [{"name": "Dry Cleaning"}]
            
            client = LaundryToolboxClient()
            result = await client.get_service_by_name("dry")
            
            mock_exec.assert_called_once_with("get-service-by-name", name="dry")


class TestCreateToolboxClient:
    """Test factory function."""
    
    @pytest.mark.asyncio
    async def test_create_toolbox_client(self):
        """Test create_toolbox_client factory."""
        with patch('src.toolbox_client.ToolboxClient') as mock_class:
            mock_instance = Mock()
            mock_class.return_value = mock_instance
            
            client = await create_toolbox_client()
            
            assert isinstance(client, LaundryToolboxClient)
            assert client._client is not None
    
    @pytest.mark.asyncio
    async def test_create_toolbox_client_custom_url(self):
        """Test create_toolbox_client with custom URL."""
        with patch('src.toolbox_client.ToolboxClient') as mock_class:
            mock_instance = Mock()
            mock_class.return_value = mock_instance
            
            client = await create_toolbox_client("http://custom:9000")
            
            assert client._url == "http://custom:9000"
