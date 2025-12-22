"""MCP Toolbox client wrapper for Smart Laundry POS AI Agent."""

from typing import Optional, List, Any, Dict
from toolbox_core import ToolboxClient
from .config import config


class LaundryToolboxClient:
    """
    Wrapper around ToolboxClient for Smart Laundry POS.
    
    This client provides easy access to database tools defined in tools.yaml
    through the MCP Toolbox server.
    """
    
    def __init__(self, toolbox_url: Optional[str] = None):
        """
        Initialize the Toolbox client.
        
        Args:
            toolbox_url: URL of the Toolbox server (defaults to config)
        """
        self._url = toolbox_url or config.TOOLBOX_URL
        self._client: Optional[ToolboxClient] = None
        self._tools: Dict[str, Any] = {}
    
    async def connect(self) -> "LaundryToolboxClient":
        """Connect to the Toolbox server."""
        self._client = ToolboxClient(self._url)
        return self
    
    async def close(self):
        """Close the connection."""
        if self._client:
            await self._client.close()
            self._client = None
    
    async def __aenter__(self) -> "LaundryToolboxClient":
        """Async context manager entry."""
        await self.connect()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        await self.close()
    
    async def load_toolset(self, toolset_name: str = "") -> List[Any]:
        """
        Load a toolset from the Toolbox server.
        
        Args:
            toolset_name: Name of the toolset (empty for all tools)
            
        Returns:
            List of loaded tools
        """
        if not self._client:
            await self.connect()
        
        tools = await self._client.load_toolset(toolset_name)
        
        # Index tools by name (use __name__ attribute)
        for tool in tools:
            self._tools[tool.__name__] = tool
        
        return tools
    
    async def load_customer_service_tools(self) -> List[Any]:
        """Load tools for customer service agent."""
        return await self.load_toolset("customer-service")
    
    async def load_analytics_tools(self) -> List[Any]:
        """Load tools for analytics agent."""
        return await self.load_toolset("analytics")
    
    async def load_order_management_tools(self) -> List[Any]:
        """Load tools for order management."""
        return await self.load_toolset("order-management")
    
    async def load_whatsapp_tools(self) -> List[Any]:
        """Load tools for WhatsApp agent."""
        return await self.load_toolset("whatsapp")
    
    async def load_all_tools(self) -> List[Any]:
        """Load all available tools."""
        return await self.load_toolset("all-tools")
    
    def get_tool(self, name: str) -> Optional[Any]:
        """
        Get a loaded tool by name.
        
        Args:
            name: Tool name
            
        Returns:
            Tool if found, None otherwise
        """
        return self._tools.get(name)
    
    async def execute_tool(self, tool_name: str, **kwargs) -> Any:
        """
        Execute a tool by name.
        
        Args:
            tool_name: Name of the tool to execute
            **kwargs: Tool parameters
            
        Returns:
            Tool execution result (parsed from JSON)
        """
        import json
        
        tool = self.get_tool(tool_name)
        if not tool:
            # Try loading all tools first
            await self.load_all_tools()
            tool = self.get_tool(tool_name)
        
        if not tool:
            raise ValueError(f"Tool '{tool_name}' not found")
        
        result = await tool(**kwargs)
        
        # Parse JSON string result if needed
        if isinstance(result, str):
            try:
                return json.loads(result)
            except json.JSONDecodeError:
                return result
        
        return result
    
    # ============================================
    # Customer Tools
    # ============================================
    
    async def search_customer(self, query: str) -> List[Dict]:
        """Search for customers by name or phone."""
        return await self.execute_tool("search-customer", query=query)
    
    async def get_customer_by_phone(self, phone: str) -> Optional[Dict]:
        """Get customer by phone number."""
        result = await self.execute_tool("get-customer-by-phone", phone=phone)
        return result[0] if result else None
    
    async def get_customer_order_history(
        self, 
        phone: str, 
        limit: int = 10
    ) -> List[Dict]:
        """Get customer order history."""
        return await self.execute_tool(
            "get-customer-order-history",
            phone=phone,
            limit=limit
        )
    
    async def get_customer_points(self, phone: str) -> Optional[Dict]:
        """
        Get customer loyalty points.
        
        Returns customer info with:
        - points: current available points
        - lifetime_points: total points earned over time
        - point_id: reference to points table
        - store_id: store association
        """
        result = await self.execute_tool("get-customer-points", phone=phone)
        return result[0] if result else None
    
    async def get_customer_points_history(
        self, 
        phone: str, 
        limit: int = 10
    ) -> List[Dict]:
        """
        Get customer loyalty points transaction history.
        
        Returns list of transactions with:
        - points_changed: positive for earning, negative for redemption
        - transaction_type: 'earning' or 'redemption'
        - transaction_date: when the transaction occurred
        - order_id: related order (for earning transactions)
        """
        return await self.execute_tool(
            "get-customer-points-history",
            phone=phone,
            limit=limit
        )
    
    async def get_churned_customers(self, days: int = 30) -> List[Dict]:
        """Get customers who only made one order."""
        return await self.execute_tool(
            "get-churned-customers",
            days_since_first_order=days
        )
    
    async def get_inactive_customers(self, days: int = 30) -> List[Dict]:
        """Get customers inactive for specified days."""
        return await self.execute_tool(
            "get-inactive-customers",
            inactive_days=days
        )
    
    # ============================================
    # Order Tools
    # ============================================
    
    async def check_order_status(
        self, 
        phone: str, 
        limit: int = 3
    ) -> List[Dict]:
        """Check order status by customer phone."""
        return await self.execute_tool(
            "check-order-status",
            phone=phone,
            limit=limit
        )
    
    async def get_order_by_id(self, order_id: str) -> Optional[Dict]:
        """Get order details by ID."""
        result = await self.execute_tool("get-order-by-id", order_id=order_id)
        return result[0] if result else None
    
    async def get_order_items(self, order_id: str) -> List[Dict]:
        """Get items for an order."""
        return await self.execute_tool("get-order-items", order_id=order_id)
    
    async def get_todays_orders(self, store_id: str = "") -> List[Dict]:
        """Get today's orders."""
        return await self.execute_tool("get-todays-orders", store_id=store_id)
    
    async def get_orders_ready_for_pickup(self, store_id: str = "") -> List[Dict]:
        """Get orders ready for pickup."""
        return await self.execute_tool(
            "get-orders-ready-for-pickup",
            store_id=store_id
        )
    
    async def get_pending_payments(self, store_id: str = "") -> List[Dict]:
        """Get orders with pending payments."""
        return await self.execute_tool("get-pending-payments", store_id=store_id)
    
    async def update_order_status(
        self, 
        order_id: str, 
        new_status: str
    ) -> Optional[Dict]:
        """Update order status."""
        result = await self.execute_tool(
            "update-order-status",
            order_id=order_id,
            new_status=new_status
        )
        return result[0] if result else None
    
    # ============================================
    # Analytics Tools (Store-Aware)
    # ============================================
    
    async def get_daily_revenue(
        self, 
        date: str = "", 
        store_id: str = ""
    ) -> Optional[Dict]:
        """Get daily revenue summary for a store."""
        result = await self.execute_tool(
            "get-daily-revenue", 
            date=date, 
            store_id=store_id
        )
        return result[0] if result else None
    
    async def get_weekly_revenue(self, store_id: str = "") -> Optional[Dict]:
        """Get weekly revenue summary for a store."""
        result = await self.execute_tool(
            "get-weekly-revenue",
            store_id=store_id
        )
        return result[0] if result else None
    
    async def get_monthly_revenue(self, store_id: str = "") -> Optional[Dict]:
        """Get monthly revenue summary for a store."""
        result = await self.execute_tool(
            "get-monthly-revenue",
            store_id=store_id
        )
        return result[0] if result else None
    
    async def compare_revenue_periods(
        self, 
        period: str = "week",
        store_id: str = ""
    ) -> Optional[Dict]:
        """Compare revenue between periods for a store."""
        result = await self.execute_tool(
            "compare-revenue-periods",
            period=period,
            store_id=store_id
        )
        return result[0] if result else None
    
    async def get_popular_services(
        self, 
        days: int = 30, 
        limit: int = 10,
        store_id: str = ""
    ) -> List[Dict]:
        """Get popular services for a store."""
        return await self.execute_tool(
            "get-popular-services",
            days=days,
            limit=limit,
            store_id=store_id
        )
    
    async def get_peak_hours(
        self, 
        days: int = 30,
        store_id: str = ""
    ) -> List[Dict]:
        """Get peak hours analysis for a store."""
        return await self.execute_tool(
            "get-peak-hours", 
            days=days,
            store_id=store_id
        )
    
    async def get_order_status_summary(self, store_id: str = "") -> List[Dict]:
        """Get order status summary for today for a store."""
        return await self.execute_tool(
            "get-order-status-summary",
            store_id=store_id
        )
    
    # ============================================
    # Store Tools
    # ============================================
    
    async def list_stores(self) -> List[Dict]:
        """List all available stores."""
        return await self.execute_tool("list-stores")
    
    # ============================================
    # Service Tools
    # ============================================
    
    async def get_all_services(self, store_id: str = "") -> List[Dict]:
        """Get all available services."""
        return await self.execute_tool("get-all-services", store_id=store_id)
    
    async def get_service_by_name(self, name: str) -> List[Dict]:
        """Search for service by name."""
        return await self.execute_tool("get-service-by-name", name=name)


# Factory function for creating client
async def create_toolbox_client(
    toolbox_url: Optional[str] = None
) -> LaundryToolboxClient:
    """
    Create and connect a Toolbox client.
    
    Args:
        toolbox_url: Optional URL override
        
    Returns:
        Connected LaundryToolboxClient
    """
    client = LaundryToolboxClient(toolbox_url)
    await client.connect()
    return client
