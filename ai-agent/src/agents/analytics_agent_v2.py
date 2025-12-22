"""Analytics Agent using MCP Toolbox for Smart Laundry POS."""

import re
import json
from typing import Optional, Dict, Any, List
from datetime import datetime
from ..toolbox_client import LaundryToolboxClient
from ..config import config


class AnalyticsAgent:
    """
    AI Agent for business analytics using MCP Toolbox.
    
    This agent uses tools from the Toolbox server to:
    - Generate revenue reports
    - Analyze sales trends
    - Identify popular services
    - Track customer behavior
    - Compare performance metrics
    
    Supports multi-tenant store filtering via store_id or store name.
    Uses LLM for intelligent intent detection with keyword fallback.
    """
    
    SYSTEM_PROMPT = """Anda adalah asisten Smart Laundry. Jawab singkat dan langsung sesuai pertanyaan.
Jangan bertele-tele. Gunakan format bullet point jika perlu."""
    
    INTENT_CLASSIFICATION_PROMPT = """Klasifikasikan intent dari pertanyaan pengguna berikut untuk sistem laundry.

Pertanyaan: "{query}"

Pilih SATU intent yang paling sesuai dari daftar berikut:
- daily_revenue: Laporan pendapatan harian/hari ini/kemarin
- weekly_revenue: Laporan pendapatan mingguan/minggu ini
- monthly_revenue: Laporan pendapatan bulanan/bulan ini
- compare_periods: Perbandingan pendapatan antar periode (minggu ini vs lalu, bulan ini vs lalu)
- popular_services: Layanan terlaris/populer/top
- peak_hours: Jam sibuk/ramai
- churned_customers: Pelanggan churn/hilang/tidak kembali
- inactive_customers: Pelanggan tidak aktif
- points_summary: Ringkasan/total poin toko
- points_redeem: Cara tukar/pakai poin
- points_earn: Cara dapat/kumpul poin
- points_check: Cek poin pelanggan (dengan nomor HP)
- points_info: Informasi umum tentang poin
- store_list: Daftar toko/cabang
- store_detail: Detail/info toko tertentu
- general: Pertanyaan umum lainnya

Juga ekstrak informasi berikut jika ada:
- store_name: Nama toko yang disebutkan (jika ada)
- phone_number: Nomor HP (format 08xxx)
- period: Periode waktu (week/month)

Jawab HANYA dalam format JSON seperti ini:
{{"intent": "nama_intent", "store_name": "nama toko atau null", "phone_number": "nomor atau null", "period": "week/month atau null"}}"""

    # Intent to handler mapping
    INTENT_HANDLERS = {
        'daily_revenue': 'get_daily_report',
        'weekly_revenue': 'get_weekly_report',
        'monthly_revenue': 'get_monthly_report',
        'compare_periods': 'compare_periods',
        'popular_services': 'get_top_services',
        'peak_hours': 'get_peak_hours',
        'churned_customers': 'get_churned_customers',
        'inactive_customers': 'get_inactive_customers',
        'points_summary': 'get_points_summary',
        'store_list': 'list_stores',
    }
    
    def __init__(
        self,
        toolbox_client: Optional[LaundryToolboxClient] = None,
        gemini_client=None,
        store_id: Optional[str] = None,
        use_llm_fallback: bool = True  # Use LLM as fallback when keywords fail
    ):
        """
        Initialize AnalyticsAgent.
        
        Args:
            toolbox_client: Optional LaundryToolboxClient instance
            gemini_client: Optional Gemini client for AI insights
            store_id: Optional store ID for multi-tenant filtering
            use_llm_fallback: Whether to use LLM as fallback when keyword detection fails (default True)
        """
        self._toolbox_client = toolbox_client
        self._gemini_client = gemini_client
        self._tools_loaded = False
        self._store_id = store_id or ""
        self._store_cache: Dict[str, Dict] = {}  # Cache store name -> store info
        self._use_llm_fallback = use_llm_fallback  # LLM used as fallback when keywords fail
    
    @property
    def store_id(self) -> str:
        """Get current store ID."""
        return self._store_id
    
    @store_id.setter
    def store_id(self, value: str):
        """Set store ID for filtering."""
        self._store_id = value or ""
    
    @property
    def toolbox_client(self) -> LaundryToolboxClient:
        """Get or create Toolbox client."""
        if self._toolbox_client is None:
            self._toolbox_client = LaundryToolboxClient()
        return self._toolbox_client
    
    @property
    def gemini_client(self):
        """Get Gemini client lazily."""
        if self._gemini_client is None:
            try:
                import google.generativeai as genai
                genai.configure(api_key=config.GOOGLE_API_KEY)
                self._gemini_client = genai.GenerativeModel(config.GEMINI_MODEL)
            except (ImportError, Exception):
                self._gemini_client = None
        return self._gemini_client
    
    async def _ensure_tools_loaded(self):
        """Ensure analytics tools are loaded."""
        if not self._tools_loaded:
            await self.toolbox_client.load_analytics_tools()
            self._tools_loaded = True
    
    async def _load_store_cache(self):
        """Load store cache for name resolution."""
        if not self._store_cache:
            try:
                stores = await self.toolbox_client.list_stores()
                if stores:
                    for store in stores:
                        name_lower = store.get('name', '').lower()
                        # Ensure store_id is properly formatted as UUID string
                        raw_id = store.get('id', '')
                        store['id'] = self._format_uuid(raw_id)
                        self._store_cache[name_lower] = store
            except Exception as e:
                # Log error but continue
                import logging
                logging.warning(f"Failed to load store cache: {e}")
    
    def clear_store_cache(self):
        """Clear the store cache to force reload."""
        self._store_cache = {}
    
    async def _classify_intent_with_llm(self, query: str) -> Dict[str, Any]:
        """
        Use LLM to classify the intent of a query.
        
        Args:
            query: User's natural language query
            
        Returns:
            Dict with 'intent', 'store_name', 'phone_number', 'period'
        """
        if not self.gemini_client:
            return {"intent": "general", "store_name": None, "phone_number": None, "period": None}
        
        try:
            prompt = self.INTENT_CLASSIFICATION_PROMPT.format(query=query)
            response = await self.gemini_client.generate_content_async(prompt)
            
            if response and response.text:
                # Parse JSON from response
                text = response.text.strip()
                # Handle markdown code blocks
                if text.startswith('```'):
                    text = text.split('\n', 1)[1] if '\n' in text else text[3:]
                    if text.endswith('```'):
                        text = text[:-3]
                    text = text.strip()
                    if text.startswith('json'):
                        text = text[4:].strip()
                
                result = json.loads(text)
                return {
                    "intent": result.get("intent", "general"),
                    "store_name": result.get("store_name"),
                    "phone_number": result.get("phone_number"),
                    "period": result.get("period")
                }
        except json.JSONDecodeError as e:
            import logging
            logging.warning(f"Failed to parse LLM intent response: {e}")
        except Exception as e:
            import logging
            logging.warning(f"LLM intent classification error: {e}")
        
        # Fallback to keyword-based detection
        return {"intent": "general", "store_name": None, "phone_number": None, "period": None}
    
    def _classify_intent_with_keywords(self, query_lower: str) -> Dict[str, Any]:
        """
        Fallback keyword-based intent classification.
        
        Args:
            query_lower: Lowercased query string
            
        Returns:
            Dict with 'intent', 'store_name', 'phone_number', 'period'
        """
        result = {
            "intent": "general",
            "store_name": None,
            "phone_number": None,
            "period": None
        }
        
        # Extract phone number
        match = re.search(r'(08\d{8,12})', query_lower)
        if match:
            result["phone_number"] = match.group(1)
        
        # Order matters! Check comparison FIRST
        if self._is_comparison_query(query_lower):
            result["intent"] = "compare_periods"
            result["period"] = self._extract_period(query_lower)
        elif self._is_store_list_query(query_lower):
            result["intent"] = "store_list"
        elif self._is_store_detail_query(query_lower):
            result["intent"] = "store_detail"
        elif self._is_daily_revenue_query(query_lower):
            result["intent"] = "daily_revenue"
        elif self._is_weekly_query(query_lower):
            result["intent"] = "weekly_revenue"
        elif self._is_monthly_query(query_lower):
            result["intent"] = "monthly_revenue"
        elif self._is_popular_services_query(query_lower):
            result["intent"] = "popular_services"
        elif self._is_peak_hours_query(query_lower):
            result["intent"] = "peak_hours"
        elif self._is_churned_customers_query(query_lower):
            result["intent"] = "churned_customers"
        elif self._is_inactive_customers_query(query_lower):
            result["intent"] = "inactive_customers"
        elif self._is_points_summary_query(query_lower):
            result["intent"] = "points_summary"
        elif self._is_points_redeem_query(query_lower):
            result["intent"] = "points_redeem"
        elif self._is_points_earn_query(query_lower):
            result["intent"] = "points_earn"
        elif self._is_points_info_query(query_lower):
            result["intent"] = "points_info"
        elif self._is_points_query(query_lower):
            result["intent"] = "points_check"
        
        return result

    async def _ask_for_store_context(self, report_type: str) -> Dict[str, Any]:
        """
        Ask user to specify a store when no store context is available.
        
        Args:
            report_type: Type of report being requested (for context in message)
            
        Returns:
            Response asking user to specify store
        """
        await self._load_store_cache()
        store_names = list(self._store_cache.keys())[:5]  # Show first 5
        
        response = f"""📊 *{report_type.title()}*

Mohon sebutkan nama toko untuk melihat {report_type}.

Contoh: `{report_type} toko [nama toko]`

🏪 *Toko tersedia:*"""
        for name in store_names:
            response += f"\n• {name.title()}"
        if len(self._store_cache) > 5:
            response += f"\n• ... dan {len(self._store_cache) - 5} toko lainnya"
        
        response += "\n\n💡 Ketik `daftar toko` untuk melihat semua toko."
        
        return {
            "success": True,
            "response": response,
            "data": {"requires_store": True}
        }
    
    async def _get_store_name_by_id(self, store_id: str) -> str:
        """Get store name by store ID."""
        await self._load_store_cache()
        for store_name, store_info in self._store_cache.items():
            if store_info.get('id') == store_id:
                return store_info.get('name', store_name.title())
        return store_id[:8] if store_id else "Unknown"
    
    def _format_uuid(self, uuid_value) -> str:
        """
        Format UUID value to proper string format.
        
        Handles various input formats:
        - Already a string UUID: "29edf3ae-6ac3-42b3-abf8-90494dcdc7c5"
        - Bytes/bytearray: convert to hex UUID format
        - List of integers (byte values): convert to hex UUID format
        - None or empty: return empty string
        """
        if not uuid_value:
            return ""
        
        # Already a proper UUID string
        if isinstance(uuid_value, str):
            # Check if it's already a valid UUID format
            if len(uuid_value) == 36 and uuid_value.count('-') == 4:
                return uuid_value
            # Could be hex without dashes
            if len(uuid_value) == 32:
                return f"{uuid_value[:8]}-{uuid_value[8:12]}-{uuid_value[12:16]}-{uuid_value[16:20]}-{uuid_value[20:]}"
            return uuid_value
        
        # Handle bytes or bytearray
        if isinstance(uuid_value, (bytes, bytearray)):
            hex_str = uuid_value.hex()
            return f"{hex_str[:8]}-{hex_str[8:12]}-{hex_str[12:16]}-{hex_str[16:20]}-{hex_str[20:]}"
        
        # Handle list of integers (byte values)
        if isinstance(uuid_value, (list, tuple)) and len(uuid_value) == 16:
            hex_str = ''.join(f'{b:02x}' for b in uuid_value)
            return f"{hex_str[:8]}-{hex_str[8:12]}-{hex_str[12:16]}-{hex_str[16:20]}-{hex_str[20:]}"
        
        # Handle memoryview
        if isinstance(uuid_value, memoryview):
            hex_str = uuid_value.tobytes().hex()
            return f"{hex_str[:8]}-{hex_str[8:12]}-{hex_str[12:16]}-{hex_str[16:20]}-{hex_str[20:]}"
        
        # Fallback: try to convert to string
        return str(uuid_value)
    
    async def _resolve_store_id(self, query: str, provided_store_id: str = "") -> str:
        """
        Resolve store ID from query text or provided ID.
        
        Args:
            query: User query that may contain store name
            provided_store_id: Explicitly provided store ID
            
        Returns:
            Store ID as properly formatted UUID string, or empty string
        """
        if provided_store_id:
            return self._format_uuid(provided_store_id)
        
        await self._load_store_cache()
        query_lower = query.lower()
        
        # Find the best matching store name
        best_match = None
        best_match_score = 0
        
        for store_name, store_info in self._store_cache.items():
            # Calculate match score based on how many words match
            score = self._calculate_store_match_score(store_name, query_lower)
            if score > best_match_score:
                best_match_score = score
                best_match = store_info
        
        # Only use match if score is above threshold (at least 2 words match or exact match)
        if best_match and best_match_score >= 2:
            store_id = best_match.get('id', '')
            return self._format_uuid(store_id) if store_id else ''
        
        return self._format_uuid(self._store_id) if self._store_id else ''
    
    def _calculate_store_match_score(self, store_name: str, query: str) -> int:
        """
        Calculate how well a store name matches the query.
        
        Returns a score based on:
        - Number of store name words found in query
        - Bonus for consecutive word matches
        - Bonus for unique identifiers (like location names)
        
        Args:
            store_name: Store name in lowercase
            query: Query text in lowercase
            
        Returns:
            Match score (higher = better match)
        """
        # Split store name into words, filter out common words
        common_words = {'laundry', 'toko', 'ruang', 'outlet', 'cabang', 'store'}
        store_words = [w for w in store_name.split() if w and len(w) > 1]
        unique_words = [w for w in store_words if w not in common_words]
        
        score = 0
        
        # Check each store word in query
        for word in store_words:
            if word in query:
                score += 1
                # Bonus for unique/identifying words (not common laundry terms)
                if word in unique_words:
                    score += 2
        
        # Bonus for exact store name match
        if store_name in query:
            score += 5
        
        return score
    
    async def process_query(
        self, 
        query: str, 
        store_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Process a natural language analytics query.
        
        Uses LLM for intelligent intent detection with keyword fallback.
        
        Args:
            query: Natural language query
            store_id: Optional store ID to filter by (overrides instance store_id)
            
        Returns:
            Analytics result with data and insights
        """
        if not query or not query.strip():
            return {
                "success": False,
                "response": "Mohon berikan pertanyaan.",
                "data": None
            }
        
        await self._ensure_tools_loaded()
        
        # Classify intent: keywords first, LLM fallback
        query_lower = query.lower()
        classification = self._classify_intent_with_keywords(query_lower)
        
        # If keywords can't detect intent, try LLM as fallback
        if classification.get("intent") == "general" and self._use_llm_fallback:
            llm_classification = await self._classify_intent_with_llm(query)
            if llm_classification.get("intent") != "general":
                classification = llm_classification
        
        intent = classification.get("intent", "general")
        phone_number = classification.get("phone_number")
        period = classification.get("period")
        
        # Resolve store ID from query text, classification, or provided ID
        effective_store_id = await self._resolve_store_id(
            query, 
            store_id if store_id is not None else ""
        )
        
        # Route to appropriate handler based on intent
        if intent == "store_list":
            return await self.list_stores()
        
        if intent == "store_detail":
            # Extract store name from query
            cleaned = query_lower
            for word in ['info toko', 'detail toko', 'store info', 'tentang toko', 'alamat toko']:
                cleaned = cleaned.replace(word, '').strip()
            if cleaned:
                return await self.get_store_by_name(cleaned)
            return await self.list_stores()
        
        if intent == "compare_periods":
            period = period or self._extract_period(query_lower)
            return await self.compare_periods(period, store_id=effective_store_id)
        
        if intent == "daily_revenue":
            return await self.get_daily_report(store_id=effective_store_id)
        
        if intent == "weekly_revenue":
            return await self.get_weekly_report(store_id=effective_store_id)
        
        if intent == "monthly_revenue":
            return await self.get_monthly_report(store_id=effective_store_id)
        
        if intent == "popular_services":
            return await self.get_top_services(store_id=effective_store_id)
        
        if intent == "peak_hours":
            return await self.get_peak_hours(store_id=effective_store_id)
        
        if intent == "churned_customers":
            return await self.get_churned_customers()
        
        if intent == "inactive_customers":
            return await self.get_inactive_customers()
        
        if intent == "points_summary":
            return await self.get_points_summary(store_id=effective_store_id)
        
        if intent == "points_redeem":
            return self._get_points_knowledge(context="redeem")
        
        if intent == "points_earn":
            return self._get_points_knowledge(context="earn")
        
        if intent == "points_info":
            return self._get_points_knowledge(context="general")
        
        if intent == "points_check":
            # Use phone from LLM classification or extract from query
            phone = phone_number or re.search(r'(08\d{8,12})', query)
            if phone:
                if isinstance(phone, str):
                    return await self.get_customer_points(phone)
                else:
                    return await self.get_customer_points(phone.group(1))
            return self._get_points_knowledge(context="check")
        
        # Use AI for complex/general queries
        return await self._handle_complex_query(query)
    
    async def get_daily_report(
        self, 
        date: Optional[str] = None,
        store_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate daily revenue report.
        
        Args:
            date: Optional date (YYYY-MM-DD format)
            store_id: Optional store ID to filter by
            
        Returns:
            Daily report
        """
        await self._ensure_tools_loaded()
        effective_store_id = store_id if store_id is not None else self._store_id
        
        # If no store context, ask user to specify
        if not effective_store_id:
            return await self._ask_for_store_context("laporan harian")
        
        try:
            revenue = await self.toolbox_client.get_daily_revenue(
                date or "", 
                store_id=effective_store_id
            )
            status_summary = await self.toolbox_client.get_order_status_summary(
                store_id=effective_store_id
            )
            
            if not revenue:
                return {
                    "success": True,
                    "response": "Belum ada data transaksi untuk tanggal ini.",
                    "data": None
                }
            
            date_str = revenue.get('date', 'Hari ini')
            total_orders = revenue.get('total_orders', 0)
            paid = revenue.get('paid_revenue', 0)
            unpaid = revenue.get('unpaid_revenue', 0)
            total = revenue.get('total_revenue', 0)
            
            # Get store name for display
            store_name = await self._get_store_name_by_id(effective_store_id) if effective_store_id else "Semua Toko"
            
            response = f"""📊 *Laporan Harian - {store_name}*
Tanggal: {date_str}
Total: {config.format_currency(total)} ({total_orders} order)
• Lunas: {config.format_currency(paid)}
• Belum: {config.format_currency(unpaid)}"""
            
            if status_summary:
                response += "\n\n📈 *Status Pesanan:*"
                for status in status_summary:
                    exec_status = status.get('execution_status', '')
                    pay_status = status.get('payment_status', '')
                    label = f"{self._get_status_label(exec_status)} ({pay_status})"
                    count = status.get('count', 0)
                    response += f"\n• {label}: {count}"
            
            return {
                "success": True,
                "response": response,
                "data": {
                    "revenue": revenue,
                    "status_summary": status_summary
                }
            }
        except Exception as e:
            return {
                "success": False,
                "response": "Gagal mengambil laporan harian.",
                "error": str(e)
            }
    
    async def get_weekly_report(self, store_id: Optional[str] = None) -> Dict[str, Any]:
        """Generate weekly revenue report."""
        await self._ensure_tools_loaded()
        effective_store_id = store_id if store_id is not None else self._store_id
        
        # If no store context, ask user to specify
        if not effective_store_id:
            return await self._ask_for_store_context("laporan mingguan")
        
        try:
            revenue = await self.toolbox_client.get_weekly_revenue(
                store_id=effective_store_id
            )
            
            if not revenue:
                return {
                    "success": True,
                    "response": "Belum ada data transaksi minggu ini.",
                    "data": None
                }
            
            total_orders = revenue.get('total_orders', 0)
            paid = revenue.get('paid_revenue', 0)
            total = revenue.get('total_revenue', 0)
            avg = revenue.get('average_order_value', 0)
            
            # Get store name for display
            store_name = await self._get_store_name_by_id(effective_store_id) if effective_store_id else "Semua Toko"
            
            response = f"""📊 *Laporan Minggu Ini - {store_name}*
Total: {config.format_currency(total)} ({total_orders} order)
• Lunas: {config.format_currency(paid)}
• Rata-rata: {config.format_currency(avg)}/order"""
            
            return {
                "success": True,
                "response": response,
                "data": revenue
            }
        except Exception as e:
            return {
                "success": False,
                "response": "Gagal mengambil laporan mingguan.",
                "error": str(e)
            }
    
    async def get_monthly_report(self, store_id: Optional[str] = None) -> Dict[str, Any]:
        """Generate monthly revenue report."""
        await self._ensure_tools_loaded()
        effective_store_id = store_id if store_id is not None else self._store_id
        
        # If no store context, ask user to specify
        if not effective_store_id:
            return await self._ask_for_store_context("laporan bulanan")
        
        try:
            revenue = await self.toolbox_client.get_monthly_revenue(
                store_id=effective_store_id
            )
            popular_services = await self.toolbox_client.get_popular_services(
                days=30, 
                limit=5,
                store_id=effective_store_id
            )
            
            if not revenue:
                return {
                    "success": True,
                    "response": "Belum ada data transaksi bulan ini.",
                    "data": None
                }
            
            total_orders = revenue.get('total_orders', 0)
            paid = revenue.get('paid_revenue', 0)
            total = revenue.get('total_revenue', 0)
            avg = revenue.get('average_order_value', 0)
            
            response = f"""📊 Bulan ini: {config.format_currency(total)} ({total_orders} order)
• Lunas: {config.format_currency(paid)}
• Rata-rata: {config.format_currency(avg)}/order"""
            
            if popular_services:
                response += "\n🏆 Top: "
                # Handle both 'service_name' (from DB) and 'name' field names
                top_names = [svc.get('service_name') or svc.get('name', 'Layanan') for svc in popular_services[:3]]
                response += ", ".join(filter(None, top_names))
            
            return {
                "success": True,
                "response": response,
                "data": {
                    "revenue": revenue,
                    "popular_services": popular_services
                }
            }
        except Exception as e:
            return {
                "success": False,
                "response": "Gagal mengambil laporan bulanan.",
                "error": str(e)
            }
    
    async def compare_periods(
        self, 
        period: str = "week",
        store_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Compare revenue between periods.
        
        Args:
            period: 'week' or 'month'
            store_id: Optional store ID to filter by
            
        Returns:
            Comparison result
        """
        await self._ensure_tools_loaded()
        effective_store_id = store_id if store_id is not None else self._store_id
        
        # If no store context, ask user to specify
        if not effective_store_id:
            return await self._ask_for_store_context("perbandingan pendapatan")
        
        try:
            comparison = await self.toolbox_client.compare_revenue_periods(
                period,
                store_id=effective_store_id
            )
            
            if not comparison:
                return {
                    "success": True,
                    "response": "Data tidak cukup untuk perbandingan.",
                    "data": None
                }
            
            current = comparison.get('current_revenue', 0) or 0
            previous = comparison.get('previous_revenue', 0) or 0
            current_orders = comparison.get('current_orders', 0) or 0
            previous_orders = comparison.get('previous_orders', 0) or 0
            change = comparison.get('revenue_change_percent', 0) or 0
            
            period_label = "Minggu" if period == "week" else "Bulan"
            trend = "📈" if change > 0 else "📉" if change < 0 else "➡️"
            
            # Get store name
            store_name = await self._get_store_name_by_id(effective_store_id)
            
            response = f"""{trend} *Perbandingan Pendapatan - {store_name}*

📅 *{period_label} Ini:*
• Pendapatan: {config.format_currency(current)}
• Jumlah Order: {current_orders}

📅 *{period_label} Lalu:*
• Pendapatan: {config.format_currency(previous)}
• Jumlah Order: {previous_orders}

📊 *Perubahan:* {change:+.1f}%"""
            
            return {
                "success": True,
                "response": response,
                "data": comparison
            }
        except Exception as e:
            return {
                "success": False,
                "response": "Gagal membandingkan periode.",
                "error": str(e)
            }
    
    async def get_top_services(
        self, 
        days: int = 30, 
        limit: int = 10,
        store_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get top performing services."""
        await self._ensure_tools_loaded()
        effective_store_id = store_id if store_id is not None else self._store_id
        
        try:
            services = await self.toolbox_client.get_popular_services(
                days=days, 
                limit=limit,
                store_id=effective_store_id
            )
            
            if not services:
                return {
                    "success": True,
                    "response": "Belum ada data layanan.",
                    "data": []
                }
            
            response = f"🏆 Top {min(5, len(services))} layanan:\n"
            for i, svc in enumerate(services[:5], 1):
                # Handle both 'service_name' (from DB) and 'name' field names
                name = svc.get('service_name') or svc.get('name', 'Layanan')
                count = svc.get('order_count', 0)
                total_qty = svc.get('total_quantity', 0)
                revenue = svc.get('total_revenue', 0)
                response += f"{i}. {name} ({count}x, {total_qty} item)\n"
            
            return {
                "success": True,
                "response": response,
                "data": services
            }
        except Exception as e:
            return {
                "success": False,
                "response": "Gagal mengambil data layanan populer.",
                "error": str(e)
            }
    
    async def get_peak_hours(
        self, 
        days: int = 30,
        store_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get peak business hours."""
        await self._ensure_tools_loaded()
        effective_store_id = store_id if store_id is not None else self._store_id
        
        try:
            hours = await self.toolbox_client.get_peak_hours(
                days=days,
                store_id=effective_store_id
            )
            
            if not hours:
                return {
                    "success": True,
                    "response": "Belum ada data jam operasional.",
                    "data": []
                }
            
            # Get top 5 peak hours
            top_hours = sorted(hours, key=lambda x: x.get('order_count', 0), reverse=True)[:5]
            
            response = "⏰ Jam tersibuk: "
            hour_strs = [f"{h.get('hour', 0):02d}:00 ({h.get('order_count', 0)}x)" for h in top_hours[:3]]
            response += ", ".join(hour_strs)
            
            return {
                "success": True,
                "response": response,
                "data": hours
            }
        except Exception as e:
            return {
                "success": False,
                "response": "Gagal menganalisis jam sibuk.",
                "error": str(e)
            }
    
    async def get_churned_customers(self, days: int = 30) -> Dict[str, Any]:
        """Get customers who only made one order and never returned."""
        await self._ensure_tools_loaded()
        
        try:
            customers = await self.toolbox_client.get_churned_customers(days=days)
            
            if not customers:
                return {
                    "success": True,
                    "response": "Tidak ada pelanggan churn 🎉",
                    "data": []
                }
            
            response = f"⚠️ {len(customers)} pelanggan churn:\n"
            for cust in customers[:5]:
                name = cust.get('name', 'N/A')
                response += f"• {name}\n"
            if len(customers) > 5:
                response += f"... +{len(customers) - 5} lainnya"
            
            return {
                "success": True,
                "response": response,
                "data": customers
            }
        except Exception as e:
            return {
                "success": False,
                "response": "Gagal menganalisis pelanggan churn.",
                "error": str(e)
            }
    
    async def get_inactive_customers(self, days: int = 30) -> Dict[str, Any]:
        """Get customers who haven't placed orders recently."""
        await self._ensure_tools_loaded()
        
        try:
            customers = await self.toolbox_client.get_inactive_customers(days=days)
            
            if not customers:
                return {
                    "success": True,
                    "response": "Semua pelanggan aktif 🎉",
                    "data": []
                }
            
            response = f"😴 {len(customers)} pelanggan tidak aktif:\n"
            for cust in customers[:5]:
                name = cust.get('name', 'N/A')
                days_since = cust.get('days_since_last_order', 0)
                response += f"• {name} ({days_since} hari)\n"
            if len(customers) > 5:
                response += f"... +{len(customers) - 5} lainnya"
            
            return {
                "success": True,
                "response": response,
                "data": customers
            }
        except Exception as e:
            return {
                "success": False,
                "response": "Gagal menganalisis pelanggan tidak aktif.",
                "error": str(e)
            }
    
    async def get_customer_points(self, phone: str) -> Dict[str, Any]:
        """
        Get loyalty points for a customer by phone number.
        
        Loyalty Points Knowledge:
        - Points are earned: 1 point per KG for kilo-based services, 1 point per unit for unit-based services
        - Points can be redeemed for discounts on future orders
        - Each store can enable/disable points feature independently
        - current_points = available points for redemption
        - accumulated_points = lifetime points earned (never decreases)
        """
        await self._ensure_tools_loaded()
        try:
            result = await self.toolbox_client.get_customer_points(phone)
            if not result:
                return {
                    "success": True, 
                    "response": "Nomor tidak ditemukan dalam sistem. Pastikan nomor HP benar atau pelanggan sudah terdaftar.", 
                    "data": None
                }
            
            # Handle both single dict and list results
            customer = result[0] if isinstance(result, list) else result
            name = customer.get('name', '-')
            current_points = customer.get('points', 0)
            lifetime_points = customer.get('lifetime_points', current_points)
            
            # Build informative response
            response_parts = [f"🎁 *Poin Loyalitas - {name}*\n"]
            response_parts.append(f"📊 Poin tersedia: *{current_points:,} poin*")
            
            if lifetime_points > current_points:
                redeemed = lifetime_points - current_points
                response_parts.append(f"📈 Total poin diperoleh: {lifetime_points:,} poin")
                response_parts.append(f"🎯 Poin sudah ditukar: {redeemed:,} poin")
            
            response_parts.append("\n💡 *Cara mendapat poin:*")
            response_parts.append("• 1 poin per KG (layanan kiloan)")
            response_parts.append("• 1 poin per item (layanan satuan)")
            
            return {
                "success": True, 
                "response": "\n".join(response_parts), 
                "data": customer
            }
        except Exception as e:
            return {"success": False, "response": "Gagal mengambil data poin.", "error": str(e)}
    
    async def get_points_summary(self, store_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Get loyalty points summary for a store.
        
        Returns aggregate statistics about points issued by the store.
        If no store_id provided, asks user to specify the store.
        """
        await self._ensure_tools_loaded()
        effective_store_id = store_id if store_id else self._store_id
        
        # If no store context, ask user to specify
        if not effective_store_id:
            # Load stores to show available options
            await self._load_store_cache()
            store_names = list(self._store_cache.keys())[:5]  # Show first 5
            
            response = """📊 *Ringkasan Poin*

Mohon sebutkan nama toko untuk melihat ringkasan poin.

Contoh: `ringkasan poin toko [nama toko]`

🏪 *Toko tersedia:*"""
            for name in store_names:
                response += f"\n• {name.title()}"
            if len(self._store_cache) > 5:
                response += f"\n• ... dan {len(self._store_cache) - 5} toko lainnya"
            
            return {
                "success": True,
                "response": response,
                "data": {"requires_store": True}
            }
        
        try:
            result = await self.toolbox_client.execute_tool(
                "get-points-summary-by-store",
                store_id=effective_store_id
            )
            
            if not result:
                return {
                    "success": True,
                    "response": "Belum ada data poin untuk toko ini.",
                    "data": None
                }
            
            summary = result[0] if isinstance(result, list) else result
            total_customers = summary.get('total_customers_with_points', 0) or 0
            total_available = summary.get('total_available_points', 0) or 0
            total_lifetime = summary.get('total_lifetime_points_issued', 0) or 0
            avg_points = summary.get('avg_points_per_customer', 0) or 0
            
            # Get store name
            store_name = await self._get_store_name_by_id(effective_store_id)
            
            response_parts = [f"🎁 *Ringkasan Poin Loyalitas - {store_name}*\n"]
            response_parts.append(f"👥 Pelanggan dengan poin: {total_customers}")
            response_parts.append(f"💰 Total poin tersedia: {total_available:,}")
            response_parts.append(f"📈 Total poin diterbitkan: {total_lifetime:,}")
            response_parts.append(f"📊 Rata-rata poin/pelanggan: {avg_points:.0f}")
            
            return {
                "success": True,
                "response": "\n".join(response_parts),
                "data": summary
            }
        except Exception as e:
            return {"success": False, "response": "Gagal mengambil ringkasan poin.", "error": str(e)}
    
    async def _handle_complex_query(self, query: str) -> Dict[str, Any]:
        """Handle complex analytics queries using AI."""
        if not self.gemini_client:
            return {
                "success": False,
                "response": "Maaf, pertanyaan ini membutuhkan analisis AI yang tidak tersedia saat ini.",
                "data": None
            }
        
        try:
            # Gather context data
            daily = await self.toolbox_client.get_daily_revenue("")
            weekly = await self.toolbox_client.get_weekly_revenue()
            services = await self.toolbox_client.get_popular_services(days=30, limit=5)
            
            context = f"""
Data harian: {daily}
Data mingguan: {weekly}
Top layanan: {services}
"""
            
            prompt = f"""{self.SYSTEM_PROMPT}

Konteks data bisnis:
{context}

Pertanyaan: {query}

Berikan analisis dan rekomendasi berdasarkan data di atas."""
            
            response = self.gemini_client.generate_content(prompt)
            
            return {
                "success": True,
                "response": response.text,
                "ai_generated": True,
                "data": {
                    "daily": daily,
                    "weekly": weekly,
                    "services": services
                }
            }
        except Exception as e:
            return {
                "success": False,
                "response": "Gagal memproses pertanyaan analitik.",
                "error": str(e)
            }
    
    def _get_points_knowledge(self, context: str = "general") -> Dict[str, Any]:
        """
        Return knowledge about the loyalty points system based on context.
        
        Args:
            context: Type of info requested - 'general', 'redeem', 'earn', 'check'
        """
        if context == "redeem":
            response = """🎁 *Cara Menukar Poin*

💡 *Langkah-langkah:*
1. Pastikan Anda sudah memiliki poin (min. 100 poin)
2. Saat transaksi, sampaikan ke kasir bahwa ingin tukar poin
3. Kasir akan memasukkan jumlah poin yang ingin ditukar
4. Poin akan dipotong dari saldo dan menjadi diskon

💰 *Nilai Tukar:*
• 1 poin = Rp 100 (dapat berbeda tiap toko)
• Contoh: 500 poin = Rp 50.000 diskon

📌 *Syarat & Ketentuan:*
• Minimum penukaran: 100 poin
• Maksimum: sesuai saldo poin Anda
• Poin tidak bisa diuangkan
• Berlaku untuk semua layanan

📱 Cek saldo poin: ketik `cek poin 08xxxxxxxxxx`"""
        elif context == "earn":
            response = """🎁 *Cara Mendapat Poin*

📌 *Ketentuan Perolehan:*
• 1 poin per KG untuk layanan kiloan
• 1 poin per item untuk layanan satuan
• Poin otomatis ditambahkan setelah transaksi selesai

💡 *Tips Kumpulkan Poin:*
• Gunakan layanan kiloan untuk poin lebih banyak
• Ajak keluarga/teman untuk bertransaksi
• Poin tidak kadaluarsa

📱 Cek saldo poin: ketik `cek poin 08xxxxxxxxxx`"""
        elif context == "check":
            response = """📱 *Cara Cek Poin*

Ketik: `cek poin 08xxxxxxxxxx`
Contoh: `cek poin 081234567890`

Atau langsung tanyakan ke kasir saat transaksi."""
        else:
            response = """🎁 *Sistem Poin Loyalitas Smart Laundry*

📌 *Cara Mendapat Poin:*
• 1 poin per KG untuk layanan kiloan
• 1 poin per item untuk layanan satuan
• Poin otomatis ditambahkan setelah transaksi selesai

💰 *Cara Tukar Poin:*
• Sampaikan ke kasir saat transaksi
• 1 poin = Rp 100 (dapat berbeda tiap toko)
• Minimum penukaran: 100 poin

📱 *Cek Poin Pelanggan:*
Ketik: `cek poin 08xxxxxxxxxx`
Contoh: `cek poin 081234567890`"""

        return {
            "success": True,
            "response": response,
            "data": {
                "type": "points_knowledge",
                "context": context,
                "earning_rate": {
                    "kilo": "1 poin per KG",
                    "unit": "1 poin per item"
                },
                "redemption_rate": "1 poin = Rp 100"
            }
        }
    
    # Intent detection methods
    def _is_daily_revenue_query(self, query: str) -> bool:
        keywords = ['hari ini', 'harian', 'today', 'daily', 'kemarin', 'kemaren', 'yesterday']
        return any(kw in query for kw in keywords)
    
    def _is_weekly_query(self, query: str) -> bool:
        keywords = ['minggu', 'mingguan', 'weekly', 'week', 'seminggu']
        return any(kw in query for kw in keywords)
    
    def _is_monthly_query(self, query: str) -> bool:
        keywords = ['bulan', 'bulanan', 'monthly', 'month']
        return any(kw in query for kw in keywords)
    
    def _is_comparison_query(self, query: str) -> bool:
        keywords = ['banding', 'compare', 'vs', 'dibanding', 'perbandingan']
        return any(kw in query for kw in keywords)
    
    def _is_popular_services_query(self, query: str) -> bool:
        keywords = ['populer', 'terlaris', 'top', 'favorit', 'popular', 'best']
        return any(kw in query for kw in keywords)
    
    def _is_peak_hours_query(self, query: str) -> bool:
        keywords = ['jam sibuk', 'peak', 'tersibuk', 'ramai', 'busy']
        return any(kw in query for kw in keywords)
    
    def _is_churned_customers_query(self, query: str) -> bool:
        keywords = ['churn', 'hilang', 'sekali order', 'tidak kembali']
        return any(kw in query for kw in keywords)
    
    def _is_inactive_customers_query(self, query: str) -> bool:
        keywords = ['tidak aktif', 'inactive', 'lama tidak', 'dormant']
        return any(kw in query for kw in keywords)
    
    def _is_store_list_query(self, query: str) -> bool:
        """Check if query is asking for store list from database."""
        keywords = [
            'daftar toko', 'list store', 'toko apa', 'store apa', 'cabang',
            'semua toko', 'all stores', 'toko tersedia', 'available stores',
            'lihat toko', 'tampilkan toko', 'show stores', 'toko mana',
            'outlet', 'lokasi toko', 'store locations'
        ]
        return any(kw in query for kw in keywords)
    
    def _is_store_detail_query(self, query: str) -> bool:
        """Check if query is asking for specific store details."""
        keywords = ['info toko', 'detail toko', 'store info', 'tentang toko', 'alamat toko']
        return any(kw in query for kw in keywords)
    
    def _is_points_query(self, query: str) -> bool:
        keywords = ['poin', 'loyalti', 'loyalty', 'reward', 'point', 'points', 'hadiah', 'bonus']
        return any(kw in query for kw in keywords)
    
    def _is_points_info_query(self, query: str) -> bool:
        """Check if query is asking for general points information/knowledge."""
        info_keywords = [
            'informasi poin', 'info poin', 'tentang poin', 'apa itu poin',
            'penjelasan poin', 'sistem poin', 'points info', 'about points'
        ]
        return any(kw in query for kw in info_keywords)
    
    def _is_points_redeem_query(self, query: str) -> bool:
        """Check if query is asking how to redeem points."""
        redeem_keywords = [
            'tukar poin', 'tuker poin', 'redeem', 'pakai poin', 'gunakan poin',
            'cara tukar', 'cara pakai poin', 'cara gunakan poin', 'menukar poin',
            'gimana tukar', 'gimana cara tukar', 'bagaimana tukar'
        ]
        return any(kw in query for kw in redeem_keywords)
    
    def _is_points_earn_query(self, query: str) -> bool:
        """Check if query is asking how to earn points."""
        earn_keywords = [
            'cara dapat poin', 'cara mendapat poin', 'cara kumpul poin',
            'gimana dapat poin', 'bagaimana dapat poin', 'earn points',
            'dapet poin', 'dapat poin', 'kumpulkan poin'
        ]
        return any(kw in query for kw in earn_keywords)
    
    def _is_points_summary_query(self, query: str) -> bool:
        """Check if query is asking for store-wide points summary."""
        summary_keywords = ['ringkasan poin', 'total poin', 'statistik poin', 'points summary', 'semua poin']
        return any(kw in query for kw in summary_keywords)
    
    def _extract_period(self, query: str) -> str:
        if 'bulan' in query or 'month' in query:
            return 'month'
        return 'week'
    
    def _get_status_label(self, status: str) -> str:
        labels = {
            'pending': '⏳ Menunggu',
            'processing': '🔄 Diproses',
            'washing': '🧼 Dicuci',
            'drying': '💨 Dikeringkan',
            'folding': '👕 Dilipat',
            'completed': '✅ Selesai',
            'delivered': '📦 Dikirim',
            'cancelled': '❌ Dibatalkan'
        }
        return labels.get(status, status)
    
    # Store management methods
    async def list_stores(self) -> Dict[str, Any]:
        """
        List all available stores from the database.
        
        Store Knowledge:
        - Stores are fetched directly from the 'stores' table in the database
        - Each store has: id (UUID), name, address, phone, created_at
        - Stores support multi-tenant features like:
          * enable_qr: QR code payments
          * enable_points: Loyalty points system
          * wa_use_store_number: WhatsApp integration
        """
        await self._ensure_tools_loaded()
        
        try:
            stores = await self.toolbox_client.list_stores()
            
            if not stores:
                return {
                    "success": True,
                    "response": "Tidak ada toko terdaftar dalam sistem.",
                    "data": []
                }
            
            # Update store cache
            for store in stores:
                name_lower = store.get('name', '').lower()
                self._store_cache[name_lower] = store
            
            response_parts = [f"🏪 *Daftar {len(stores)} Toko:*\n"]
            for i, store in enumerate(stores, 1):
                name = store.get('name', 'N/A')
                address = store.get('address', '-')
                phone = store.get('phone', '-')
                store_id = store.get('id', '')[:8]  # Show first 8 chars of UUID
                
                response_parts.append(f"{i}. *{name}*")
                if address and address != '-':
                    response_parts.append(f"   📍 {address}")
                if phone and phone != '-':
                    response_parts.append(f"   📞 {phone}")
                response_parts.append(f"   🆔 {store_id}")
                response_parts.append("")
            
            return {
                "success": True,
                "response": "\n".join(response_parts).strip(),
                "data": stores
            }
        except Exception as e:
            return {
                "success": False,
                "response": "Gagal mengambil daftar toko dari database.",
                "error": str(e)
            }
    
    async def get_store_by_name(self, name: str) -> Dict[str, Any]:
        """
        Get store details by name from the database.
        
        Args:
            name: Store name to search for
            
        Returns:
            Store information if found
        """
        await self._load_store_cache()
        
        name_lower = name.lower()
        
        # Try exact match first
        if name_lower in self._store_cache:
            store = self._store_cache[name_lower]
            return {
                "success": True,
                "response": f"🏪 *{store.get('name', 'N/A')}*\n📍 {store.get('address', '-')}\n📞 {store.get('phone', '-')}",
                "data": store
            }
        
        # Try partial match
        for store_name, store_info in self._store_cache.items():
            if name_lower in store_name:
                return {
                    "success": True,
                    "response": f"🏪 *{store_info.get('name', 'N/A')}*\n📍 {store_info.get('address', '-')}\n📞 {store_info.get('phone', '-')}",
                    "data": store_info
                }
        
        return {
            "success": False,
            "response": f"Toko '{name}' tidak ditemukan. Gunakan 'daftar toko' untuk melihat toko yang tersedia.",
            "data": None
        }
