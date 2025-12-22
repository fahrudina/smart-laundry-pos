"""Analytics Agent for Smart Laundry POS."""

from typing import Optional, Dict, Any, List
from ..tools import AnalyticsTools, CustomerTools
from ..config import config


class AnalyticsAgent:
    """
    AI Agent for business analytics and reporting.
    
    This agent can:
    - Generate revenue reports
    - Compare performance periods
    - Identify churned customers
    - Analyze popular services
    - Provide business insights
    """
    
    SYSTEM_PROMPT = """Anda adalah analis bisnis Smart Laundry yang profesional.
Berikan insight yang actionable berdasarkan data.
Gunakan format yang mudah dibaca.
Sertakan rekomendasi praktis."""
    
    def __init__(
        self,
        analytics_tools: Optional[AnalyticsTools] = None,
        customer_tools: Optional[CustomerTools] = None,
        gemini_client=None
    ):
        """
        Initialize AnalyticsAgent.
        
        Args:
            analytics_tools: Optional AnalyticsTools instance
            customer_tools: Optional CustomerTools instance
            gemini_client: Optional Gemini client for testing
        """
        self._analytics_tools = analytics_tools
        self._customer_tools = customer_tools
        self._gemini_client = gemini_client
    
    @property
    def analytics_tools(self) -> AnalyticsTools:
        """Get AnalyticsTools instance."""
        if self._analytics_tools is None:
            self._analytics_tools = AnalyticsTools()
        return self._analytics_tools
    
    @property
    def customer_tools(self) -> CustomerTools:
        """Get CustomerTools instance."""
        if self._customer_tools is None:
            self._customer_tools = CustomerTools()
        return self._customer_tools
    
    @property
    def gemini_client(self):
        """Get Gemini client lazily."""
        if self._gemini_client is None:
            try:
                import google.generativeai as genai
                genai.configure(api_key=config.GOOGLE_API_KEY)
                self._gemini_client = genai.GenerativeModel(config.GEMINI_MODEL)
            except ImportError:
                self._gemini_client = None
        return self._gemini_client
    
    def handle_query(
        self,
        query: str,
        store_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Handle an analytics query.
        
        Args:
            query: Analytics question
            store_id: Optional store filter
            
        Returns:
            Response with data and insights
        """
        if not query or not query.strip():
            return {
                "success": False,
                "response": "Silakan masukkan pertanyaan analitik.",
                "data": None
            }
        
        query_lower = query.lower()
        
        # Intent detection
        if self._is_revenue_query(query_lower):
            return self._handle_revenue_query(query_lower, store_id)
        
        if self._is_comparison_query(query_lower):
            return self._handle_comparison_query(query_lower, store_id)
        
        if self._is_churn_query(query_lower):
            return self._handle_churn_query(store_id)
        
        if self._is_popular_services_query(query_lower):
            return self._handle_popular_services_query(store_id)
        
        if self._is_customer_stats_query(query_lower):
            return self._handle_customer_stats_query(store_id)
        
        if self._is_peak_hours_query(query_lower):
            return self._handle_peak_hours_query(store_id)
        
        # Default: General analytics summary
        return self._handle_general_query(query, store_id)
    
    def get_daily_report(
        self,
        date: Optional[str] = None,
        store_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate daily revenue report.
        
        Args:
            date: Date string (YYYY-MM-DD)
            store_id: Optional store filter
            
        Returns:
            Daily report data
        """
        revenue = self.analytics_tools.get_daily_revenue(date, store_id)
        
        if 'error' in revenue:
            return {
                "success": False,
                "response": revenue['error'],
                "data": None
            }
        
        response = (
            f"📊 *Laporan Harian - {revenue['date']}*\n\n"
            f"📦 Total Pesanan: {revenue['total_orders']}\n"
            f"💰 Total Pendapatan: {revenue['formatted_total']}\n"
            f"✅ Sudah Dibayar: {revenue['formatted_paid']}\n"
            f"⏳ Belum Dibayar: {revenue['formatted_pending']}\n"
        )
        
        if revenue.get('orders_by_status'):
            response += "\n📋 *Status Pesanan:*\n"
            for status, count in revenue['orders_by_status'].items():
                response += f"• {status}: {count}\n"
        
        return {
            "success": True,
            "response": response,
            "data": revenue
        }
    
    def get_period_report(
        self,
        period: str = 'week',
        store_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate period revenue report.
        
        Args:
            period: 'day', 'week', 'month', 'year'
            store_id: Optional store filter
            
        Returns:
            Period report data
        """
        revenue = self.analytics_tools.get_period_revenue(period, store_id)
        
        period_labels = {
            'day': 'Hari Ini',
            'week': 'Minggu Ini',
            'month': 'Bulan Ini',
            'year': 'Tahun Ini'
        }
        
        label = period_labels.get(period, period)
        
        response = (
            f"📊 *Laporan {label}*\n"
            f"({revenue['start_date']} - {revenue['end_date']})\n\n"
            f"📦 Total Pesanan: {revenue['total_orders']}\n"
            f"💰 Total Pendapatan: {revenue['formatted_total']}\n"
            f"📈 Rata-rata per Pesanan: {revenue['formatted_average']}"
        )
        
        return {
            "success": True,
            "response": response,
            "data": revenue
        }
    
    def compare_periods(
        self,
        period1: str = 'last_week',
        period2: str = 'this_week',
        store_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Compare two periods.
        
        Args:
            period1: First period name
            period2: Second period name
            store_id: Optional store filter
            
        Returns:
            Comparison data
        """
        comparison = self.analytics_tools.compare_revenue(period1, period2, store_id)
        
        period_labels = {
            'today': 'Hari Ini',
            'yesterday': 'Kemarin',
            'this_week': 'Minggu Ini',
            'last_week': 'Minggu Lalu',
            'this_month': 'Bulan Ini',
            'last_month': 'Bulan Lalu'
        }
        
        p1_label = period_labels.get(period1, period1)
        p2_label = period_labels.get(period2, period2)
        
        growth = comparison['growth_percentage']
        direction = comparison['growth_direction']
        
        emoji = "📈" if direction == "up" else "📉" if direction == "down" else "➡️"
        
        response = (
            f"📊 *Perbandingan Pendapatan*\n\n"
            f"*{p1_label}:*\n"
            f"• Pendapatan: {comparison['period1']['formatted']}\n"
            f"• Jumlah Pesanan: {comparison['period1']['order_count']}\n\n"
            f"*{p2_label}:*\n"
            f"• Pendapatan: {comparison['period2']['formatted']}\n"
            f"• Jumlah Pesanan: {comparison['period2']['order_count']}\n\n"
            f"{emoji} *Pertumbuhan: {growth:+.1f}%*\n"
            f"Selisih: {comparison['formatted_difference']}"
        )
        
        return {
            "success": True,
            "response": response,
            "data": comparison
        }
    
    def get_churned_customers_report(
        self,
        days: int = 30,
        store_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get report on churned customers.
        
        Args:
            days: Days of inactivity threshold
            store_id: Optional store filter
            
        Returns:
            Churned customers report
        """
        churned = self.customer_tools.get_churned_customers(days, store_id, limit=20)
        
        if not churned:
            return {
                "success": True,
                "response": f"🎉 Tidak ada pelanggan yang churn dalam {days} hari terakhir!",
                "data": {"churned_count": 0, "customers": []}
            }
        
        response = (
            f"⚠️ *Pelanggan yang Tidak Kembali*\n"
            f"(Hanya 1x order, lebih dari {days} hari)\n\n"
            f"Ditemukan: {len(churned)} pelanggan\n\n"
        )
        
        for i, customer in enumerate(churned[:10], 1):
            response += (
                f"{i}. {customer['name']}\n"
                f"   📞 {customer['phone']}\n"
                f"   📅 Order terakhir: {customer['days_since_order']} hari lalu\n"
                f"   💰 Nilai: {config.format_currency(customer['first_order_amount'])}\n\n"
            )
        
        if len(churned) > 10:
            response += f"... dan {len(churned) - 10} lainnya"
        
        response += "\n💡 *Rekomendasi:* Kirim promo re-engagement ke pelanggan ini!"
        
        return {
            "success": True,
            "response": response,
            "data": {"churned_count": len(churned), "customers": churned}
        }
    
    def get_popular_services_report(
        self,
        period: str = 'month',
        store_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get popular services report.
        
        Args:
            period: Time period
            store_id: Optional store filter
            
        Returns:
            Popular services data
        """
        services = self.analytics_tools.get_popular_services(period, limit=10, store_id=store_id)
        
        if not services:
            return {
                "success": True,
                "response": "Belum ada data layanan untuk periode ini.",
                "data": {"services": []}
            }
        
        period_labels = {
            'day': 'Hari Ini',
            'week': 'Minggu Ini',
            'month': 'Bulan Ini',
            'year': 'Tahun Ini'
        }
        
        label = period_labels.get(period, period)
        
        response = f"🏆 *Layanan Terpopuler {label}*\n\n"
        
        for i, service in enumerate(services, 1):
            medal = "🥇" if i == 1 else "🥈" if i == 2 else "🥉" if i == 3 else f"{i}."
            response += (
                f"{medal} {service['service_name']}\n"
                f"   📦 {service['order_count']} pesanan\n"
                f"   💰 {service['formatted_revenue']}\n\n"
            )
        
        return {
            "success": True,
            "response": response,
            "data": {"services": services}
        }
    
    def get_customer_stats_report(
        self,
        period: str = 'month',
        store_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get customer statistics report.
        
        Args:
            period: Time period
            store_id: Optional store filter
            
        Returns:
            Customer stats data
        """
        stats = self.analytics_tools.get_customer_stats(period, store_id)
        
        period_labels = {
            'week': 'Minggu Ini',
            'month': 'Bulan Ini',
            'year': 'Tahun Ini'
        }
        
        label = period_labels.get(period, period)
        
        response = (
            f"👥 *Statistik Pelanggan {label}*\n\n"
            f"📊 Total Pelanggan: {stats['total_customers']}\n"
            f"🆕 Pelanggan Baru: {stats['new_customers']}\n"
            f"✅ Pelanggan Aktif: {stats['active_customers']}\n\n"
            f"📦 Total Pesanan: {stats['total_orders']}\n"
            f"💰 Total Pendapatan: {stats['formatted_revenue']}\n"
            f"📈 Rata-rata per Pesanan: {stats['formatted_aov']}\n"
            f"👤 Nilai per Pelanggan: {stats['formatted_clv']}"
        )
        
        return {
            "success": True,
            "response": response,
            "data": stats
        }
    
    def get_peak_hours_report(
        self,
        store_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get peak hours analysis.
        
        Args:
            store_id: Optional store filter
            
        Returns:
            Peak hours data
        """
        peak_hours = self.analytics_tools.get_peak_hours(days=30, store_id=store_id)
        
        if not peak_hours:
            return {
                "success": True,
                "response": "Belum ada data untuk analisis jam sibuk.",
                "data": {"peak_hours": []}
            }
        
        # Get top 5 busiest hours
        top_hours = peak_hours[:5]
        
        response = "⏰ *Jam Tersibuk (30 Hari Terakhir)*\n\n"
        
        for i, hour in enumerate(top_hours, 1):
            bar = "█" * min(hour['order_count'], 20)
            response += (
                f"{i}. {hour['time_label']}\n"
                f"   {bar} {hour['order_count']} pesanan\n"
            )
        
        response += "\n💡 *Insight:* Pertimbangkan menambah staff pada jam sibuk!"
        
        return {
            "success": True,
            "response": response,
            "data": {"peak_hours": peak_hours}
        }
    
    def _is_revenue_query(self, query: str) -> bool:
        """Check if query is about revenue."""
        keywords = ['pendapatan', 'revenue', 'omset', 'omzet', 'income', 'pemasukan', 'uang']
        return any(kw in query for kw in keywords)
    
    def _is_comparison_query(self, query: str) -> bool:
        """Check if query is a comparison."""
        keywords = ['banding', 'compare', 'versus', 'vs', 'dibanding', 'pertumbuhan', 'growth']
        return any(kw in query for kw in keywords)
    
    def _is_churn_query(self, query: str) -> bool:
        """Check if query is about churned customers."""
        keywords = ['churn', 'hilang', 'tidak kembali', 'tidak pernah', 'never', 'lost']
        return any(kw in query for kw in keywords)
    
    def _is_popular_services_query(self, query: str) -> bool:
        """Check if query is about popular services."""
        keywords = ['populer', 'popular', 'terlaris', 'favorit', 'favorite', 'top', 'terbaik']
        return any(kw in query for kw in keywords)
    
    def _is_customer_stats_query(self, query: str) -> bool:
        """Check if query is about customer stats."""
        keywords = ['pelanggan', 'customer', 'statistik', 'stats', 'pengguna', 'user']
        return any(kw in query for kw in keywords)
    
    def _is_peak_hours_query(self, query: str) -> bool:
        """Check if query is about peak hours."""
        keywords = ['jam', 'hour', 'sibuk', 'peak', 'ramai', 'busy', 'waktu']
        return any(kw in query for kw in keywords)
    
    def _handle_revenue_query(
        self,
        query: str,
        store_id: Optional[str]
    ) -> Dict[str, Any]:
        """Handle revenue query."""
        # Detect period from query
        if 'hari' in query or 'today' in query:
            return self.get_daily_report(store_id=store_id)
        elif 'minggu' in query or 'week' in query:
            return self.get_period_report('week', store_id)
        elif 'bulan' in query or 'month' in query:
            return self.get_period_report('month', store_id)
        elif 'tahun' in query or 'year' in query:
            return self.get_period_report('year', store_id)
        else:
            return self.get_daily_report(store_id=store_id)
    
    def _handle_comparison_query(
        self,
        query: str,
        store_id: Optional[str]
    ) -> Dict[str, Any]:
        """Handle comparison query."""
        # Default comparison: this week vs last week
        if 'bulan' in query or 'month' in query:
            return self.compare_periods('last_month', 'this_month', store_id)
        else:
            return self.compare_periods('last_week', 'this_week', store_id)
    
    def _handle_churn_query(self, store_id: Optional[str]) -> Dict[str, Any]:
        """Handle churn query."""
        return self.get_churned_customers_report(store_id=store_id)
    
    def _handle_popular_services_query(
        self,
        store_id: Optional[str]
    ) -> Dict[str, Any]:
        """Handle popular services query."""
        return self.get_popular_services_report('month', store_id)
    
    def _handle_customer_stats_query(
        self,
        store_id: Optional[str]
    ) -> Dict[str, Any]:
        """Handle customer stats query."""
        return self.get_customer_stats_report('month', store_id)
    
    def _handle_peak_hours_query(
        self,
        store_id: Optional[str]
    ) -> Dict[str, Any]:
        """Handle peak hours query."""
        return self.get_peak_hours_report(store_id)
    
    def _handle_general_query(
        self,
        query: str,
        store_id: Optional[str]
    ) -> Dict[str, Any]:
        """Handle general analytics query with AI."""
        # Return summary of all metrics
        daily = self.analytics_tools.get_daily_revenue(store_id=store_id)
        summary = self.analytics_tools.get_order_summary(store_id)
        
        response = (
            "📊 *Ringkasan Bisnis Hari Ini*\n\n"
            f"💰 Pendapatan: {daily.get('formatted_total', 'N/A')}\n"
            f"📦 Total Pesanan: {daily.get('total_orders', 0)}\n"
            f"✅ Dibayar: {daily.get('formatted_paid', 'N/A')}\n"
            f"⏳ Pending: {daily.get('formatted_pending', 'N/A')}\n\n"
            f"📋 Pesanan Aktif: {summary.get('active_orders', 0)}\n\n"
            "💡 Untuk analisis lebih detail, coba tanyakan:\n"
            "• Pendapatan minggu ini\n"
            "• Perbandingan bulan ini vs bulan lalu\n"
            "• Layanan terpopuler\n"
            "• Pelanggan yang tidak kembali"
        )
        
        return {
            "success": True,
            "response": response,
            "data": {"daily": daily, "summary": summary}
        }
