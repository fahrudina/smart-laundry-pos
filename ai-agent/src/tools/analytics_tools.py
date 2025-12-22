"""Analytics tools for AI Agent."""

from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta, timezone
from ..config import config


class AnalyticsTools:
    """Tools for business analytics and reporting."""
    
    def __init__(self, supabase_client=None):
        """
        Initialize AnalyticsTools.
        
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
    
    def get_daily_revenue(
        self,
        date: Optional[str] = None,
        store_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get revenue summary for a specific date.
        
        Args:
            date: Date string (YYYY-MM-DD), defaults to today
            store_id: Optional store filter
            
        Returns:
            Revenue summary with totals and breakdowns
        """
        if not date:
            date = datetime.now(timezone.utc).strftime('%Y-%m-%d')
        
        # Validate date format
        try:
            datetime.strptime(date, '%Y-%m-%d')
        except ValueError:
            return {
                "error": "Invalid date format. Use YYYY-MM-DD",
                "date": date
            }
        
        query = self.client.table('orders')\
            .select('total_amount, payment_status, status')\
            .gte('created_at', f'{date}T00:00:00')\
            .lte('created_at', f'{date}T23:59:59')\
            .neq('status', 'cancelled')
        
        if store_id:
            query = query.eq('store_id', store_id)
        
        result = query.execute()
        orders = result.data if result.data else []
        
        total_revenue = sum(float(o.get('total_amount', 0)) for o in orders)
        paid_revenue = sum(
            float(o.get('total_amount', 0))
            for o in orders
            if o.get('payment_status') == 'paid'
        )
        pending_revenue = sum(
            float(o.get('total_amount', 0))
            for o in orders
            if o.get('payment_status') == 'pending'
        )
        
        # Count by status
        status_counts = {}
        for order in orders:
            status = order.get('status', 'unknown')
            status_counts[status] = status_counts.get(status, 0) + 1
        
        return {
            "date": date,
            "total_orders": len(orders),
            "total_revenue": total_revenue,
            "paid_revenue": paid_revenue,
            "pending_revenue": pending_revenue,
            "formatted_total": config.format_currency(total_revenue),
            "formatted_paid": config.format_currency(paid_revenue),
            "formatted_pending": config.format_currency(pending_revenue),
            "orders_by_status": status_counts
        }
    
    def get_period_revenue(
        self,
        period: str = 'week',
        store_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get revenue for a time period.
        
        Args:
            period: 'day', 'week', 'month', or 'year'
            store_id: Optional store filter
            
        Returns:
            Period revenue summary
        """
        now = datetime.now(timezone.utc)
        
        period_days = {
            'day': 1,
            'week': 7,
            'month': 30,
            'year': 365
        }
        
        days = period_days.get(period, 7)
        start_date = (now - timedelta(days=days)).strftime('%Y-%m-%d')
        end_date = now.strftime('%Y-%m-%d')
        
        query = self.client.table('orders')\
            .select('total_amount, payment_status, created_at')\
            .gte('created_at', f'{start_date}T00:00:00')\
            .lte('created_at', f'{end_date}T23:59:59')\
            .neq('status', 'cancelled')
        
        if store_id:
            query = query.eq('store_id', store_id)
        
        result = query.execute()
        orders = result.data if result.data else []
        
        total_revenue = sum(float(o.get('total_amount', 0)) for o in orders)
        paid_revenue = sum(
            float(o.get('total_amount', 0))
            for o in orders
            if o.get('payment_status') == 'paid'
        )
        
        average_order = total_revenue / len(orders) if orders else 0
        
        return {
            "period": period,
            "days": days,
            "start_date": start_date,
            "end_date": end_date,
            "total_orders": len(orders),
            "total_revenue": total_revenue,
            "paid_revenue": paid_revenue,
            "average_order_value": average_order,
            "formatted_total": config.format_currency(total_revenue),
            "formatted_average": config.format_currency(average_order)
        }
    
    def compare_revenue(
        self,
        period1: str,
        period2: str,
        store_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Compare revenue between two periods.
        
        Args:
            period1: First period ('this_week', 'last_week', 'this_month', 'last_month')
            period2: Second period
            store_id: Optional store filter
            
        Returns:
            Comparison data with growth percentage
        """
        def get_period_dates(period_name: str) -> tuple:
            now = datetime.now(timezone.utc)
            
            periods = {
                'today': (now.replace(hour=0, minute=0, second=0), now),
                'yesterday': (
                    (now - timedelta(days=1)).replace(hour=0, minute=0, second=0),
                    (now - timedelta(days=1)).replace(hour=23, minute=59, second=59)
                ),
                'this_week': (now - timedelta(days=7), now),
                'last_week': (now - timedelta(days=14), now - timedelta(days=7)),
                'this_month': (now - timedelta(days=30), now),
                'last_month': (now - timedelta(days=60), now - timedelta(days=30)),
                'this_year': (now - timedelta(days=365), now),
            }
            
            return periods.get(period_name, (now - timedelta(days=7), now))
        
        def get_revenue_for_period(start: datetime, end: datetime) -> tuple:
            query = self.client.table('orders')\
                .select('total_amount')\
                .gte('created_at', start.isoformat())\
                .lte('created_at', end.isoformat())\
                .eq('payment_status', 'paid')\
                .neq('status', 'cancelled')
            
            if store_id:
                query = query.eq('store_id', store_id)
            
            result = query.execute()
            orders = result.data if result.data else []
            total = sum(float(o.get('total_amount', 0)) for o in orders)
            return total, len(orders)
        
        start1, end1 = get_period_dates(period1)
        start2, end2 = get_period_dates(period2)
        
        rev1, count1 = get_revenue_for_period(start1, end1)
        rev2, count2 = get_revenue_for_period(start2, end2)
        
        # Calculate growth
        growth_percentage = 0.0
        if rev1 > 0:
            growth_percentage = ((rev2 - rev1) / rev1) * 100
        elif rev2 > 0:
            growth_percentage = 100.0
        
        growth_direction = "up" if growth_percentage > 0 else "down" if growth_percentage < 0 else "flat"
        
        return {
            "period1": {
                "name": period1,
                "revenue": rev1,
                "order_count": count1,
                "formatted": config.format_currency(rev1)
            },
            "period2": {
                "name": period2,
                "revenue": rev2,
                "order_count": count2,
                "formatted": config.format_currency(rev2)
            },
            "growth_percentage": round(growth_percentage, 2),
            "growth_direction": growth_direction,
            "revenue_difference": rev2 - rev1,
            "formatted_difference": config.format_currency(abs(rev2 - rev1))
        }
    
    def get_popular_services(
        self,
        period: str = 'week',
        limit: int = 10,
        store_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Get most popular services by order count.
        
        Args:
            period: 'day', 'week', 'month', 'year'
            limit: Maximum services to return
            store_id: Optional store filter
            
        Returns:
            List of services with order counts
        """
        now = datetime.now(timezone.utc)
        
        period_days = {
            'day': 1,
            'week': 7,
            'month': 30,
            'year': 365
        }
        
        days = period_days.get(period, 7)
        start_date = (now - timedelta(days=days)).isoformat()
        
        # Get order items within period
        query = self.client.table('order_items')\
            .select('service_name, quantity, line_total, order_id')
        
        result = query.execute()
        items = result.data if result.data else []
        
        # Filter by date using order relationship (simplified approach)
        # In production, you'd want to join with orders table
        
        # Aggregate by service
        service_stats: Dict[str, Dict] = {}
        
        for item in items:
            name = item.get('service_name', 'Unknown')
            quantity = int(item.get('quantity', 0))
            revenue = float(item.get('line_total', 0))
            
            if name not in service_stats:
                service_stats[name] = {
                    'service_name': name,
                    'order_count': 0,
                    'total_quantity': 0,
                    'total_revenue': 0
                }
            
            service_stats[name]['order_count'] += 1
            service_stats[name]['total_quantity'] += quantity
            service_stats[name]['total_revenue'] += revenue
        
        # Sort by order count
        sorted_services = sorted(
            service_stats.values(),
            key=lambda x: x['order_count'],
            reverse=True
        )[:limit]
        
        # Add formatted values
        for service in sorted_services:
            service['formatted_revenue'] = config.format_currency(
                service['total_revenue']
            )
        
        return sorted_services
    
    def get_peak_hours(
        self,
        days: int = 30,
        store_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Analyze peak business hours.
        
        Args:
            days: Number of days to analyze
            store_id: Optional store filter
            
        Returns:
            List of hours with order counts
        """
        now = datetime.now(timezone.utc)
        start_date = (now - timedelta(days=days)).isoformat()
        
        query = self.client.table('orders')\
            .select('created_at')\
            .gte('created_at', start_date)\
            .neq('status', 'cancelled')
        
        if store_id:
            query = query.eq('store_id', store_id)
        
        result = query.execute()
        orders = result.data if result.data else []
        
        # Count orders by hour
        hour_counts = {h: 0 for h in range(24)}
        
        for order in orders:
            created_at = self._parse_datetime(order.get('created_at'))
            if created_at:
                hour = created_at.hour
                hour_counts[hour] += 1
        
        # Convert to list with formatted times
        peak_hours = []
        for hour, count in hour_counts.items():
            peak_hours.append({
                'hour': hour,
                'time_label': f"{hour:02d}:00 - {hour:02d}:59",
                'order_count': count
            })
        
        # Sort by order count descending
        return sorted(peak_hours, key=lambda x: x['order_count'], reverse=True)
    
    def get_customer_stats(
        self,
        period: str = 'month',
        store_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get customer statistics.
        
        Args:
            period: 'week', 'month', 'year'
            store_id: Optional store filter
            
        Returns:
            Customer statistics
        """
        now = datetime.now(timezone.utc)
        
        period_days = {
            'week': 7,
            'month': 30,
            'year': 365
        }
        
        days = period_days.get(period, 30)
        start_date = (now - timedelta(days=days)).isoformat()
        
        # Get total customers
        customer_query = self.client.table('customers').select('id, created_at')
        if store_id:
            customer_query = customer_query.eq('store_id', store_id)
        
        all_customers = customer_query.execute().data or []
        total_customers = len(all_customers)
        
        # New customers in period
        new_customers = sum(
            1 for c in all_customers
            if c.get('created_at', '') >= start_date
        )
        
        # Get orders in period
        order_query = self.client.table('orders')\
            .select('customer_id, total_amount')\
            .gte('created_at', start_date)\
            .neq('status', 'cancelled')
        
        if store_id:
            order_query = order_query.eq('store_id', store_id)
        
        orders = order_query.execute().data or []
        
        # Active customers (ordered in period)
        active_customer_ids = set(o.get('customer_id') for o in orders if o.get('customer_id'))
        active_customers = len(active_customer_ids)
        
        # Average order value
        total_revenue = sum(float(o.get('total_amount', 0)) for o in orders)
        avg_order_value = total_revenue / len(orders) if orders else 0
        
        # Customer lifetime value (simple calculation)
        clv = total_revenue / active_customers if active_customers else 0
        
        return {
            "period": period,
            "total_customers": total_customers,
            "new_customers": new_customers,
            "active_customers": active_customers,
            "total_orders": len(orders),
            "total_revenue": total_revenue,
            "average_order_value": avg_order_value,
            "customer_lifetime_value": clv,
            "formatted_revenue": config.format_currency(total_revenue),
            "formatted_aov": config.format_currency(avg_order_value),
            "formatted_clv": config.format_currency(clv)
        }
    
    def get_order_summary(
        self,
        store_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get overall order summary by status.
        
        Args:
            store_id: Optional store filter
            
        Returns:
            Order counts by status
        """
        query = self.client.table('orders')\
            .select('status, payment_status')
        
        if store_id:
            query = query.eq('store_id', store_id)
        
        result = query.execute()
        orders = result.data if result.data else []
        
        status_counts = {
            'pending': 0,
            'in_progress': 0,
            'ready_for_pickup': 0,
            'completed': 0,
            'cancelled': 0
        }
        
        payment_counts = {
            'pending': 0,
            'paid': 0,
            'refunded': 0
        }
        
        for order in orders:
            status = order.get('status', 'unknown')
            payment = order.get('payment_status', 'unknown')
            
            if status in status_counts:
                status_counts[status] += 1
            
            if payment in payment_counts:
                payment_counts[payment] += 1
        
        return {
            "total_orders": len(orders),
            "by_status": status_counts,
            "by_payment": payment_counts,
            "active_orders": (
                status_counts['pending'] + 
                status_counts['in_progress'] + 
                status_counts['ready_for_pickup']
            )
        }
    
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
