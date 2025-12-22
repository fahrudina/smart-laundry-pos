"""Order-related tools for AI Agent."""

from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta, timezone
from ..config import config


class OrderTools:
    """Tools for order-related operations."""
    
    # Status labels in Indonesian
    STATUS_LABELS = {
        'pending': 'Menunggu Proses',
        'in_progress': 'Sedang Diproses',
        'ready_for_pickup': 'Siap Diambil',
        'completed': 'Selesai',
        'cancelled': 'Dibatalkan'
    }
    
    PAYMENT_LABELS = {
        'pending': 'Belum Dibayar',
        'paid': 'Sudah Dibayar',
        'refunded': 'Dikembalikan'
    }
    
    VALID_STATUSES = ['pending', 'in_progress', 'ready_for_pickup', 'completed', 'cancelled']
    VALID_PAYMENT_STATUSES = ['pending', 'paid', 'refunded']
    
    def __init__(self, supabase_client=None):
        """
        Initialize OrderTools.
        
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
    
    def check_order_status(self, phone: str, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Check order status by customer phone number.
        
        Args:
            phone: Customer phone number
            limit: Maximum orders to return
            
        Returns:
            List of recent orders with status information
        """
        if not phone:
            return []
        
        phone = self._clean_phone(phone)
        
        result = self.client.table('orders')\
            .select('id, status, payment_status, total_amount, created_at, updated_at')\
            .eq('customer_phone', phone)\
            .order('created_at', desc=True)\
            .limit(limit)\
            .execute()
        
        orders = result.data if result.data else []
        
        # Add human-readable labels
        for order in orders:
            order['status_label'] = self.STATUS_LABELS.get(
                order.get('status'), 
                order.get('status', 'Unknown')
            )
            order['payment_label'] = self.PAYMENT_LABELS.get(
                order.get('payment_status'),
                order.get('payment_status', 'Unknown')
            )
            order['formatted_total'] = config.format_currency(
                order.get('total_amount', 0)
            )
        
        return orders
    
    def get_order_by_id(self, order_id: str) -> Optional[Dict[str, Any]]:
        """
        Get order details by ID including items.
        
        Args:
            order_id: Order UUID
            
        Returns:
            Order details with items or None
        """
        if not order_id:
            return None
        
        result = self.client.table('orders')\
            .select('*, order_items(*)')\
            .eq('id', order_id)\
            .maybe_single()\
            .execute()
        
        if result.data:
            order = result.data
            order['status_label'] = self.STATUS_LABELS.get(
                order.get('status'),
                order.get('status', 'Unknown')
            )
            order['payment_label'] = self.PAYMENT_LABELS.get(
                order.get('payment_status'),
                order.get('payment_status', 'Unknown')
            )
            order['formatted_total'] = config.format_currency(
                order.get('total_amount', 0)
            )
        
        return result.data
    
    def estimate_pickup_time(self, order_id: str) -> Dict[str, Any]:
        """
        Estimate when order will be ready for pickup.
        
        Args:
            order_id: Order UUID
            
        Returns:
            Estimation details with status and message
        """
        if not order_id:
            return {
                "order_id": order_id,
                "error": "Order ID is required",
                "estimated_ready_time": None,
                "message": "ID pesanan tidak valid"
            }
        
        order = self.get_order_by_id(order_id)
        
        if not order:
            return {
                "order_id": order_id,
                "error": "Order not found",
                "estimated_ready_time": None,
                "message": "Pesanan tidak ditemukan"
            }
        
        status = order.get('status', 'unknown')
        
        # Estimation based on status
        estimations = {
            'pending': {
                'hours': 3,
                'message': 'Pesanan akan siap dalam 2-3 jam'
            },
            'in_progress': {
                'hours': 2,
                'message': 'Pesanan sedang diproses, siap dalam 1-2 jam'
            },
            'ready_for_pickup': {
                'hours': 0,
                'message': 'Pesanan sudah siap diambil! 🎉'
            },
            'completed': {
                'hours': 0,
                'message': 'Pesanan sudah selesai dan diambil'
            },
            'cancelled': {
                'hours': 0,
                'message': 'Pesanan telah dibatalkan'
            }
        }
        
        estimation = estimations.get(status, {
            'hours': 0,
            'message': 'Status tidak diketahui'
        })
        
        estimated_ready = None
        if estimation['hours'] > 0:
            created_at = self._parse_datetime(order.get('created_at'))
            if created_at:
                estimated_ready = (
                    created_at + timedelta(hours=estimation['hours'])
                ).isoformat()
        
        return {
            "order_id": order_id,
            "current_status": status,
            "status_label": self.STATUS_LABELS.get(status, status),
            "estimated_ready_time": estimated_ready,
            "message": estimation['message']
        }
    
    def get_todays_orders(
        self,
        store_id: Optional[str] = None,
        status: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Get all orders for today.
        
        Args:
            store_id: Optional store filter
            status: Optional status filter
            
        Returns:
            List of today's orders
        """
        today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
        
        query = self.client.table('orders')\
            .select('*, order_items(service_name, quantity, line_total)')\
            .gte('created_at', f'{today}T00:00:00')\
            .lte('created_at', f'{today}T23:59:59')\
            .order('created_at', desc=True)
        
        if store_id:
            query = query.eq('store_id', store_id)
        
        if status:
            if status in self.VALID_STATUSES:
                query = query.eq('status', status)
        
        result = query.execute()
        orders = result.data if result.data else []
        
        # Add labels to all orders
        for order in orders:
            order['status_label'] = self.STATUS_LABELS.get(
                order.get('status'), 
                order.get('status')
            )
            order['formatted_total'] = config.format_currency(
                order.get('total_amount', 0)
            )
        
        return orders
    
    def update_order_status(
        self,
        order_id: str,
        new_status: str
    ) -> Dict[str, Any]:
        """
        Update order status.
        
        Args:
            order_id: Order UUID
            new_status: New status value
            
        Returns:
            Update result with success flag
        """
        if not order_id:
            return {
                "success": False,
                "error": "Order ID is required"
            }
        
        if new_status not in self.VALID_STATUSES:
            return {
                "success": False,
                "error": f"Invalid status. Must be one of: {self.VALID_STATUSES}"
            }
        
        # Check if order exists
        existing = self.get_order_by_id(order_id)
        if not existing:
            return {
                "success": False,
                "error": "Order not found"
            }
        
        result = self.client.table('orders')\
            .update({'status': new_status, 'updated_at': datetime.now(timezone.utc).isoformat()})\
            .eq('id', order_id)\
            .execute()
        
        if result.data:
            return {
                "success": True,
                "order_id": order_id,
                "old_status": existing.get('status'),
                "new_status": new_status,
                "status_label": self.STATUS_LABELS.get(new_status, new_status),
                "message": f"Status berhasil diubah menjadi {self.STATUS_LABELS.get(new_status, new_status)}"
            }
        
        return {
            "success": False,
            "error": "Failed to update order status"
        }
    
    def update_payment_status(
        self,
        order_id: str,
        payment_status: str
    ) -> Dict[str, Any]:
        """
        Update order payment status.
        
        Args:
            order_id: Order UUID
            payment_status: New payment status
            
        Returns:
            Update result
        """
        if not order_id:
            return {
                "success": False,
                "error": "Order ID is required"
            }
        
        if payment_status not in self.VALID_PAYMENT_STATUSES:
            return {
                "success": False,
                "error": f"Invalid payment status. Must be one of: {self.VALID_PAYMENT_STATUSES}"
            }
        
        existing = self.get_order_by_id(order_id)
        if not existing:
            return {
                "success": False,
                "error": "Order not found"
            }
        
        result = self.client.table('orders')\
            .update({'payment_status': payment_status, 'updated_at': datetime.now(timezone.utc).isoformat()})\
            .eq('id', order_id)\
            .execute()
        
        if result.data:
            return {
                "success": True,
                "order_id": order_id,
                "old_payment_status": existing.get('payment_status'),
                "new_payment_status": payment_status,
                "payment_label": self.PAYMENT_LABELS.get(payment_status, payment_status),
                "message": f"Status pembayaran berhasil diubah"
            }
        
        return {
            "success": False,
            "error": "Failed to update payment status"
        }
    
    def create_order(
        self,
        customer_phone: str,
        customer_name: str,
        items: List[Dict[str, Any]],
        store_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create a new laundry order.
        
        Args:
            customer_phone: Customer phone number
            customer_name: Customer name
            items: List of order items with service_name, price, quantity
            store_id: Optional store ID
            
        Returns:
            Created order details
        """
        if not customer_phone or not customer_name:
            return {
                "success": False,
                "error": "Customer phone and name are required"
            }
        
        if not items or len(items) == 0:
            return {
                "success": False,
                "error": "At least one item is required"
            }
        
        customer_phone = self._clean_phone(customer_phone)
        customer_name = customer_name.strip()
        
        # Calculate totals
        subtotal = sum(
            float(item.get('price', 0)) * int(item.get('quantity', 1))
            for item in items
        )
        tax_amount = subtotal * config.TAX_RATE
        total_amount = subtotal + tax_amount
        
        # Find or create customer
        customer_id = self._get_or_create_customer_id(
            customer_phone, 
            customer_name, 
            store_id
        )
        
        # Create order
        order_data = {
            'customer_id': customer_id,
            'customer_name': customer_name,
            'customer_phone': customer_phone,
            'subtotal': subtotal,
            'tax_amount': tax_amount,
            'total_amount': total_amount,
            'status': 'pending',
            'payment_status': 'pending'
        }
        
        if store_id:
            order_data['store_id'] = store_id
        
        order = self.client.table('orders').insert(order_data).execute()
        
        if not order.data:
            return {
                "success": False,
                "error": "Failed to create order"
            }
        
        order_id = order.data[0]['id']
        
        # Create order items
        order_items = []
        for item in items:
            quantity = int(item.get('quantity', 1))
            price = float(item.get('price', 0))
            order_items.append({
                'order_id': order_id,
                'service_name': item.get('service_name', 'Unknown Service'),
                'service_price': price,
                'quantity': quantity,
                'line_total': price * quantity
            })
        
        self.client.table('order_items').insert(order_items).execute()
        
        return {
            "success": True,
            "order_id": order_id,
            "customer_id": customer_id,
            "subtotal": subtotal,
            "tax_amount": tax_amount,
            "total_amount": total_amount,
            "formatted_total": config.format_currency(total_amount),
            "item_count": len(items),
            "message": f"Pesanan berhasil dibuat! Total: {config.format_currency(total_amount)}"
        }
    
    def get_orders_ready_for_pickup(
        self,
        store_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Get all orders ready for pickup.
        
        Args:
            store_id: Optional store filter
            
        Returns:
            List of ready orders
        """
        query = self.client.table('orders')\
            .select('id, customer_name, customer_phone, total_amount, updated_at')\
            .eq('status', 'ready_for_pickup')\
            .order('updated_at', desc=True)
        
        if store_id:
            query = query.eq('store_id', store_id)
        
        result = query.execute()
        orders = result.data if result.data else []
        
        for order in orders:
            order['formatted_total'] = config.format_currency(
                order.get('total_amount', 0)
            )
        
        return orders
    
    def get_pending_payments(
        self,
        hours_old: int = 24,
        store_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Get orders with pending payments older than X hours.
        
        Args:
            hours_old: Minimum age in hours (default: 24)
            store_id: Optional store filter
            
        Returns:
            List of orders with pending payments
        """
        if hours_old < 0:
            hours_old = 0
        
        cutoff = (datetime.now(timezone.utc) - timedelta(hours=hours_old)).isoformat()
        
        query = self.client.table('orders')\
            .select('id, customer_name, customer_phone, total_amount, created_at, status')\
            .eq('payment_status', 'pending')\
            .lt('created_at', cutoff)\
            .neq('status', 'cancelled')\
            .order('created_at')
        
        if store_id:
            query = query.eq('store_id', store_id)
        
        result = query.execute()
        orders = result.data if result.data else []
        
        for order in orders:
            order['formatted_total'] = config.format_currency(
                order.get('total_amount', 0)
            )
            created_at = self._parse_datetime(order.get('created_at'))
            if created_at:
                order['hours_pending'] = int(
                    (datetime.now(timezone.utc) - created_at).total_seconds() / 3600
                )
        
        return orders
    
    def get_services(self, store_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Get available laundry services.
        
        Args:
            store_id: Optional store filter
            
        Returns:
            List of services with prices
        """
        query = self.client.table('services')\
            .select('id, name, price, unit, category, description')\
            .eq('is_active', True)\
            .order('category')\
            .order('name')
        
        if store_id:
            query = query.eq('store_id', store_id)
        
        result = query.execute()
        services = result.data if result.data else []
        
        for service in services:
            service['formatted_price'] = config.format_currency(
                service.get('price', 0)
            )
        
        return services
    
    def _get_or_create_customer_id(
        self,
        phone: str,
        name: str,
        store_id: Optional[str] = None
    ) -> Optional[str]:
        """Get existing customer ID or create new customer."""
        # Check if customer exists
        result = self.client.table('customers')\
            .select('id')\
            .eq('phone', phone)\
            .maybe_single()\
            .execute()
        
        if result.data:
            return result.data['id']
        
        # Create new customer
        customer_data = {
            'name': name,
            'phone': phone
        }
        
        if store_id:
            customer_data['store_id'] = store_id
        
        new_customer = self.client.table('customers')\
            .insert(customer_data)\
            .execute()
        
        if new_customer.data:
            return new_customer.data[0]['id']
        
        return None
    
    def _clean_phone(self, phone: str) -> str:
        """Clean phone number by removing spaces, dashes, etc."""
        return phone.strip().replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
    
    def _parse_datetime(self, date_str: str) -> Optional[datetime]:
        """Parse datetime string from database."""
        if not date_str:
            return None
        
        try:
            if date_str.endswith('Z'):
                date_str = date_str[:-1] + '+00:00'
            
            dt = datetime.fromisoformat(date_str)
            
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            
            return dt
        except (ValueError, TypeError):
            return None
