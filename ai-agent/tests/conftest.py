"""Pytest configuration and shared fixtures."""

import pytest
from unittest.mock import Mock, MagicMock
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List


# ============== Mock Data ==============

MOCK_CUSTOMERS = [
    {
        "id": "cust-001",
        "name": "Budi Santoso",
        "phone": "081234567890",
        "email": "budi@example.com",
        "address": "Jl. Merdeka 123",
        "store_id": "store-001",
        "created_at": "2024-01-15T10:00:00Z"
    },
    {
        "id": "cust-002",
        "name": "Siti Rahayu",
        "phone": "082345678901",
        "email": "siti@example.com",
        "address": "Jl. Sudirman 456",
        "store_id": "store-001",
        "created_at": "2024-06-01T14:30:00Z"
    },
    {
        "id": "cust-003",
        "name": "Ahmad Hidayat",
        "phone": "083456789012",
        "email": None,
        "address": None,
        "store_id": "store-001",
        "created_at": "2024-11-01T09:00:00Z"
    }
]

MOCK_ORDERS = [
    {
        "id": "order-001",
        "customer_id": "cust-001",
        "customer_name": "Budi Santoso",
        "customer_phone": "081234567890",
        "status": "pending",
        "payment_status": "pending",
        "subtotal": 50000,
        "tax_amount": 5000,
        "total_amount": 55000,
        "store_id": "store-001",
        "created_at": "2024-12-14T08:00:00Z",
        "updated_at": "2024-12-14T08:00:00Z"
    },
    {
        "id": "order-002",
        "customer_id": "cust-001",
        "customer_name": "Budi Santoso",
        "customer_phone": "081234567890",
        "status": "ready_for_pickup",
        "payment_status": "paid",
        "subtotal": 100000,
        "tax_amount": 10000,
        "total_amount": 110000,
        "store_id": "store-001",
        "created_at": "2024-12-13T10:00:00Z",
        "updated_at": "2024-12-14T09:00:00Z"
    },
    {
        "id": "order-003",
        "customer_id": "cust-002",
        "customer_name": "Siti Rahayu",
        "customer_phone": "082345678901",
        "status": "completed",
        "payment_status": "paid",
        "subtotal": 75000,
        "tax_amount": 7500,
        "total_amount": 82500,
        "store_id": "store-001",
        "created_at": "2024-12-12T15:00:00Z",
        "updated_at": "2024-12-13T11:00:00Z"
    }
]

MOCK_ORDER_ITEMS = [
    {
        "id": "item-001",
        "order_id": "order-001",
        "service_name": "Cuci Kering",
        "service_price": 10000,
        "quantity": 5,
        "line_total": 50000
    },
    {
        "id": "item-002",
        "order_id": "order-002",
        "service_name": "Cuci Setrika",
        "service_price": 15000,
        "quantity": 4,
        "line_total": 60000
    },
    {
        "id": "item-003",
        "order_id": "order-002",
        "service_name": "Dry Clean",
        "service_price": 40000,
        "quantity": 1,
        "line_total": 40000
    }
]

MOCK_SERVICES = [
    {
        "id": "svc-001",
        "name": "Cuci Kering",
        "price": 10000,
        "unit": "kg",
        "category": "Regular",
        "description": "Cuci dan keringkan",
        "is_active": True
    },
    {
        "id": "svc-002",
        "name": "Cuci Setrika",
        "price": 15000,
        "unit": "kg",
        "category": "Regular",
        "description": "Cuci, keringkan, dan setrika",
        "is_active": True
    },
    {
        "id": "svc-003",
        "name": "Dry Clean",
        "price": 40000,
        "unit": "pcs",
        "category": "Premium",
        "description": "Dry cleaning profesional",
        "is_active": True
    },
    {
        "id": "svc-004",
        "name": "Express",
        "price": 25000,
        "unit": "kg",
        "category": "Express",
        "description": "Selesai dalam 4 jam",
        "is_active": True
    }
]

MOCK_CUSTOMER_POINTS = {
    "081234567890": {
        "points_balance": 150,
        "total_points_earned": 500,
        "total_points_redeemed": 350
    },
    "082345678901": {
        "points_balance": 75,
        "total_points_earned": 100,
        "total_points_redeemed": 25
    }
}


# ============== Mock Supabase Client ==============

class MockQueryBuilder:
    """Mock Supabase query builder."""
    
    def __init__(self, table_name: str, data: List[Dict]):
        self._table_name = table_name
        self._data = data.copy()
        self._filters = []
        self._select_fields = None
        self._order_by = None
        self._order_desc = False
        self._limit_value = None
        self._single = False
        self._maybe_single = False
    
    def select(self, fields: str = '*'):
        self._select_fields = fields
        return self
    
    def eq(self, column: str, value: Any):
        self._filters.append(('eq', column, value))
        return self
    
    def neq(self, column: str, value: Any):
        self._filters.append(('neq', column, value))
        return self
    
    def gt(self, column: str, value: Any):
        self._filters.append(('gt', column, value))
        return self
    
    def gte(self, column: str, value: Any):
        self._filters.append(('gte', column, value))
        return self
    
    def lt(self, column: str, value: Any):
        self._filters.append(('lt', column, value))
        return self
    
    def lte(self, column: str, value: Any):
        self._filters.append(('lte', column, value))
        return self
    
    def or_(self, conditions: str):
        self._filters.append(('or', conditions, None))
        return self
    
    def ilike(self, column: str, value: str):
        self._filters.append(('ilike', column, value))
        return self
    
    def order(self, column: str, desc: bool = False):
        self._order_by = column
        self._order_desc = desc
        return self
    
    def limit(self, count: int):
        self._limit_value = count
        return self
    
    def single(self):
        self._single = True
        return self
    
    def maybe_single(self):
        self._maybe_single = True
        return self
    
    def _apply_filters(self, data: List[Dict]) -> List[Dict]:
        """Apply filters to data."""
        result = data.copy()
        
        for filter_type, column, value in self._filters:
            if filter_type == 'eq':
                result = [r for r in result if r.get(column) == value]
            elif filter_type == 'neq':
                result = [r for r in result if r.get(column) != value]
            elif filter_type == 'gt':
                result = [r for r in result if r.get(column, '') > value]
            elif filter_type == 'gte':
                result = [r for r in result if r.get(column, '') >= value]
            elif filter_type == 'lt':
                result = [r for r in result if r.get(column, '') < value]
            elif filter_type == 'lte':
                result = [r for r in result if r.get(column, '') <= value]
            elif filter_type == 'or':
                # Simple or handling for ilike
                if 'ilike' in column:
                    parts = column.split(',')
                    filtered = []
                    for item in result:
                        for part in parts:
                            field, pattern = part.split('.ilike.')
                            search = pattern.replace('%', '').lower()
                            if search in str(item.get(field, '')).lower():
                                filtered.append(item)
                                break
                    result = filtered
            elif filter_type == 'ilike':
                search = value.replace('%', '').lower()
                result = [r for r in result if search in str(r.get(column, '')).lower()]
        
        return result
    
    def execute(self):
        """Execute query and return mock response."""
        result = self._apply_filters(self._data)
        
        if self._order_by:
            result = sorted(
                result, 
                key=lambda x: x.get(self._order_by, ''),
                reverse=self._order_desc
            )
        
        if self._limit_value:
            result = result[:self._limit_value]
        
        if self._single or self._maybe_single:
            result = result[0] if result else None
        
        return MockResponse(result)
    
    def insert(self, data: Dict):
        """Mock insert."""
        if isinstance(data, list):
            for item in data:
                self._data.append(item)
            return MockResponse(data)
        
        # Add ID if not present
        if 'id' not in data:
            data['id'] = f"new-{len(self._data) + 1}"
        
        self._data.append(data)
        return MockResponse([data])
    
    def update(self, data: Dict):
        """Mock update - returns self for chaining."""
        self._update_data = data
        return self
    
    def upsert(self, data: Dict):
        """Mock upsert."""
        return self.insert(data)


class MockResponse:
    """Mock Supabase response."""
    
    def __init__(self, data: Any):
        self.data = data


class MockSupabaseClient:
    """Mock Supabase client for testing."""
    
    def __init__(self):
        self._tables = {
            'customers': MOCK_CUSTOMERS.copy(),
            'orders': MOCK_ORDERS.copy(),
            'order_items': MOCK_ORDER_ITEMS.copy(),
            'services': MOCK_SERVICES.copy(),
            'customer_points': []
        }
    
    def table(self, name: str) -> MockQueryBuilder:
        """Get table query builder."""
        data = self._tables.get(name, [])
        return MockQueryBuilder(name, data)
    
    def rpc(self, function_name: str, params: Dict = None):
        """Mock RPC call."""
        return MockResponse([])


# ============== Fixtures ==============

@pytest.fixture
def mock_supabase():
    """Create mock Supabase client."""
    return MockSupabaseClient()


@pytest.fixture
def mock_http_client():
    """Create mock HTTP client."""
    client = Mock()
    
    # Default successful response
    response = Mock()
    response.status_code = 200
    response.text = '{"success": true}'
    
    client.post.return_value = response
    client.get.return_value = response
    
    return client


@pytest.fixture
def mock_gemini_client():
    """Create mock Gemini client."""
    client = Mock()
    
    response = Mock()
    response.text = "Ini adalah respons dari AI."
    
    client.generate_content.return_value = response
    
    return client


@pytest.fixture
def sample_customer():
    """Return sample customer data."""
    return MOCK_CUSTOMERS[0].copy()


@pytest.fixture
def sample_order():
    """Return sample order data."""
    return MOCK_ORDERS[0].copy()


@pytest.fixture
def sample_services():
    """Return sample services."""
    return MOCK_SERVICES.copy()


@pytest.fixture
def sample_order_items():
    """Return sample order items."""
    return [
        {"service_name": "Cuci Kering", "price": 10000, "quantity": 3},
        {"service_name": "Cuci Setrika", "price": 15000, "quantity": 2}
    ]


# ============== Flask Test Client ==============

@pytest.fixture
def test_client(mock_supabase):
    """Create Flask test client."""
    from src.api.routes import create_app
    
    app = create_app({'TESTING': True})
    
    with app.test_client() as client:
        yield client


# ============== Helper Functions ==============

def get_past_date(days: int) -> str:
    """Get ISO date string for X days ago."""
    dt = datetime.now(timezone.utc) - timedelta(days=days)
    return dt.isoformat()


def get_today_date() -> str:
    """Get today's date string."""
    return datetime.now(timezone.utc).strftime('%Y-%m-%d')
