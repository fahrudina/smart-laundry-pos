"""Customer-related tools for AI Agent."""

from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta, timezone


class CustomerTools:
    """Tools for customer-related operations."""
    
    def __init__(self, supabase_client=None):
        """
        Initialize CustomerTools.
        
        Args:
            supabase_client: Optional Supabase client for testing
        """
        self._client = supabase_client
    
    @property
    def client(self):
        """Get Supabase client lazily."""
        if self._client is None:
            from ..database import get_supabase_client
            self._client = get_supabase_client()
        return self._client
    
    def search_customer(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Search customer by name or phone number.
        
        Args:
            query: Search term (name or phone)
            limit: Maximum results to return (default: 10)
            
        Returns:
            List of matching customers
        """
        if not query or len(query.strip()) < 2:
            return []
        
        query = query.strip()
        
        result = self.client.table('customers')\
            .select('id, name, phone, email, address, created_at')\
            .or_(f'name.ilike.%{query}%,phone.ilike.%{query}%')\
            .limit(limit)\
            .execute()
        
        return result.data if result.data else []
    
    def get_customer_by_phone(self, phone: str) -> Optional[Dict[str, Any]]:
        """
        Get customer details by phone number.
        
        Args:
            phone: Customer phone number
            
        Returns:
            Customer data or None if not found
        """
        if not phone:
            return None
        
        # Clean phone number - remove spaces, dashes
        phone = self._clean_phone(phone)
        
        result = self.client.table('customers')\
            .select('id, name, phone, email, address, created_at')\
            .eq('phone', phone)\
            .maybe_single()\
            .execute()
        
        return result.data
    
    def get_customer_by_id(self, customer_id: str) -> Optional[Dict[str, Any]]:
        """
        Get customer details by ID.
        
        Args:
            customer_id: Customer UUID
            
        Returns:
            Customer data or None if not found
        """
        if not customer_id:
            return None
        
        result = self.client.table('customers')\
            .select('id, name, phone, email, address, created_at')\
            .eq('id', customer_id)\
            .maybe_single()\
            .execute()
        
        return result.data
    
    def get_customer_order_history(
        self, 
        customer_id: str, 
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Get order history for a customer.
        
        Args:
            customer_id: Customer UUID
            limit: Maximum orders to return
            
        Returns:
            List of orders sorted by date descending
        """
        if not customer_id:
            return []
        
        result = self.client.table('orders')\
            .select('id, status, payment_status, total_amount, created_at, updated_at')\
            .eq('customer_id', customer_id)\
            .order('created_at', desc=True)\
            .limit(limit)\
            .execute()
        
        return result.data if result.data else []
    
    def get_customer_points(self, phone: str) -> Dict[str, Any]:
        """
        Get customer loyalty points balance.
        
        Args:
            phone: Customer phone number
            
        Returns:
            Points data with balance and totals
        """
        default_points = {
            "points_balance": 0,
            "total_points_earned": 0,
            "total_points_redeemed": 0
        }
        
        if not phone:
            return default_points
        
        phone = self._clean_phone(phone)
        
        result = self.client.table('customer_points')\
            .select('points_balance, total_points_earned, total_points_redeemed')\
            .eq('customer_phone', phone)\
            .maybe_single()\
            .execute()
        
        if result.data:
            return result.data
        
        return default_points
    
    def get_churned_customers(
        self,
        days_inactive: int = 30,
        store_id: Optional[str] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Get customers who only ordered once and haven't returned.
        
        These are customers whose only order was more than X days ago.
        
        Args:
            days_inactive: Minimum days since first (and only) order
            store_id: Optional store filter
            limit: Maximum results
            
        Returns:
            List of churned customers with order details
        """
        if days_inactive < 0:
            days_inactive = 0
        
        # Build customer query
        query = self.client.table('customers')\
            .select('id, name, phone, email, store_id')
        
        if store_id:
            query = query.eq('store_id', store_id)
        
        customers = query.limit(limit * 2).execute().data or []
        
        churned = []
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=days_inactive)
        
        for customer in customers:
            # Get orders for this customer
            orders = self.client.table('orders')\
                .select('id, created_at, total_amount, status')\
                .eq('customer_id', customer['id'])\
                .neq('status', 'cancelled')\
                .order('created_at', desc=False)\
                .execute()
            
            order_list = orders.data if orders.data else []
            
            # Only include if exactly one order
            if len(order_list) == 1:
                first_order = order_list[0]
                order_date = self._parse_datetime(first_order['created_at'])
                
                if order_date and order_date < cutoff_date:
                    days_since = (datetime.now(timezone.utc) - order_date).days
                    churned.append({
                        "customer_id": customer['id'],
                        "name": customer['name'],
                        "phone": customer['phone'],
                        "email": customer.get('email'),
                        "first_order_date": first_order['created_at'],
                        "first_order_amount": first_order['total_amount'],
                        "days_since_order": days_since
                    })
            
            if len(churned) >= limit:
                break
        
        # Sort by days inactive descending
        return sorted(churned, key=lambda x: x['days_since_order'], reverse=True)
    
    def get_inactive_customers(
        self,
        days: int = 14,
        store_id: Optional[str] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Get customers who haven't ordered in X days (for re-engagement).
        
        Unlike churned customers, these may have multiple orders but
        haven't returned recently.
        
        Args:
            days: Number of days of inactivity
            store_id: Optional store filter
            limit: Maximum results
            
        Returns:
            List of inactive customers
        """
        if days < 0:
            days = 0
        
        query = self.client.table('customers')\
            .select('id, name, phone, email')
        
        if store_id:
            query = query.eq('store_id', store_id)
        
        customers = query.limit(limit * 2).execute().data or []
        
        inactive = []
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)
        
        for customer in customers:
            # Get most recent order
            recent_order = self.client.table('orders')\
                .select('created_at, total_amount')\
                .eq('customer_id', customer['id'])\
                .neq('status', 'cancelled')\
                .order('created_at', desc=True)\
                .limit(1)\
                .execute()
            
            if recent_order.data:
                last_order_date = self._parse_datetime(recent_order.data[0]['created_at'])
                
                if last_order_date and last_order_date < cutoff_date:
                    days_inactive = (datetime.now(timezone.utc) - last_order_date).days
                    inactive.append({
                        "customer_id": customer['id'],
                        "name": customer['name'],
                        "phone": customer['phone'],
                        "email": customer.get('email'),
                        "last_order_date": recent_order.data[0]['created_at'],
                        "last_order_amount": recent_order.data[0]['total_amount'],
                        "days_inactive": days_inactive
                    })
            
            if len(inactive) >= limit:
                break
        
        return sorted(inactive, key=lambda x: x['days_inactive'], reverse=True)
    
    def create_or_update_customer(
        self,
        phone: str,
        name: str,
        email: Optional[str] = None,
        address: Optional[str] = None,
        store_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create a new customer or update existing one by phone.
        
        Args:
            phone: Customer phone number (required)
            name: Customer name (required)
            email: Optional email
            address: Optional address
            store_id: Optional store ID
            
        Returns:
            Result with customer data and created flag
        """
        if not phone or not name:
            return {
                "success": False,
                "error": "Phone and name are required"
            }
        
        phone = self._clean_phone(phone)
        name = name.strip()
        
        # Check if customer exists
        existing = self.get_customer_by_phone(phone)
        
        customer_data = {
            "name": name,
            "phone": phone
        }
        
        if email:
            customer_data["email"] = email.strip()
        if address:
            customer_data["address"] = address.strip()
        if store_id:
            customer_data["store_id"] = store_id
        
        if existing:
            # Update existing customer
            result = self.client.table('customers')\
                .update(customer_data)\
                .eq('id', existing['id'])\
                .execute()
            
            return {
                "success": True,
                "customer": result.data[0] if result.data else existing,
                "created": False
            }
        else:
            # Create new customer
            result = self.client.table('customers')\
                .insert(customer_data)\
                .execute()
            
            if result.data:
                return {
                    "success": True,
                    "customer": result.data[0],
                    "created": True
                }
            
            return {
                "success": False,
                "error": "Failed to create customer"
            }
    
    def _clean_phone(self, phone: str) -> str:
        """Clean phone number by removing spaces, dashes, etc."""
        return phone.strip().replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
    
    def _parse_datetime(self, date_str: str) -> Optional[datetime]:
        """Parse datetime string from database."""
        if not date_str:
            return None
        
        try:
            # Handle ISO format with Z suffix
            if date_str.endswith('Z'):
                date_str = date_str[:-1] + '+00:00'
            
            dt = datetime.fromisoformat(date_str)
            
            # Ensure timezone aware
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            
            return dt
        except (ValueError, TypeError):
            return None
