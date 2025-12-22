# Smart Laundry POS - AI Agent

AI-powered agents built with Google GenAI Toolbox and Gemini LLM for the Smart Laundry POS system.

## Overview

This module provides intelligent AI agents that enhance the Smart Laundry POS system with natural language processing capabilities:

| Agent | Description |
|-------|-------------|
| **Analytics Agent** | Business intelligence, revenue reports, trend analysis |
| **Customer Service Agent** | Customer inquiries, order status, points lookup |
| **WhatsApp Agent** | Automated WhatsApp-based customer interactions |

## Quick Start

### 1. Start the Toolbox Server (Database Tools)

```bash
cd ai-agent

# Make toolbox executable (first time only)
chmod +x toolbox

# Set database credentials
export SUPABASE_HOST=db.your-project.supabase.co
export SUPABASE_USER=postgres
export SUPABASE_PASSWORD=your-password

# Start toolbox server (runs on port 5000)
./toolbox --tools-file tools.yaml
```

### 2. Start the AI Agent API Server

```bash
# In a new terminal
cd ai-agent

# Activate virtual environment
source venv/bin/activate

# Start the Flask API server (runs on port 5001)
python run.py
```

### 3. Test the Agent

```bash
# Test analytics query
curl -X POST http://localhost:5001/api/analytics/query \
  -H "Content-Type: application/json" \
  -d '{"query": "laporan pendapatan hari ini"}'

# Test customer service
curl -X POST http://localhost:5001/api/customer/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "cek poin 081234567890"}'

# Test store listing
curl -X POST http://localhost:5001/api/analytics/query \
  -H "Content-Type: application/json" \
  -d '{"query": "daftar toko"}'
```

## Architecture

```
ai-agent/
├── toolbox                    # MCP Toolbox binary (database tool server)
├── tools.yaml                 # SQL tool definitions for Toolbox
├── run.py                     # Flask server entry point
├── requirements.txt           # Python dependencies
├── pytest.ini                 # Test configuration
│
├── src/
│   ├── config.py              # Environment configuration
│   ├── database.py            # Supabase client singleton
│   ├── toolbox_client.py      # MCP Toolbox API wrapper
│   │
│   ├── agents/                # AI Agent implementations
│   │   ├── analytics_agent_v2.py      # Business analytics (primary)
│   │   ├── customer_service_agent_v2.py
│   │   └── whatsapp_agent_v2.py
│   │
│   ├── tools/                 # Reusable tool implementations
│   │   ├── customer_tools.py
│   │   ├── order_tools.py
│   │   ├── analytics_tools.py
│   │   └── notification_tools.py
│   │
│   └── api/                   # REST API endpoints
│       └── routes_v2.py       # Flask routes (primary)
│
├── tests/                     # Unit tests (100% coverage)
│   ├── conftest.py
│   ├── test_*.py
│   └── ...
│
└── static/                    # Static web assets
```

## Installation

### Prerequisites

- Python 3.9 or higher
- Access to Supabase project (Smart Laundry POS database)
- Google Cloud API key (for Gemini LLM)

### Setup Steps

```bash
# 1. Navigate to ai-agent directory
cd ai-agent

# 2. Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate  # macOS/Linux
# venv\Scripts\activate   # Windows

# 3. Install dependencies
pip install -r requirements.txt
```

### Environment Variables

Create a `.env` file with the following:

```bash
# MCP Toolbox Server URL
TOOLBOX_URL=http://127.0.0.1:5000

# Supabase Database (required for Toolbox)
SUPABASE_HOST=db.your-project.supabase.co
SUPABASE_USER=postgres
SUPABASE_PASSWORD=your-db-password

# Google Gemini AI
GOOGLE_API_KEY=your-google-api-key
GEMINI_MODEL=gemini-2.5-flash-lite

# Flask API
API_PORT=5001
DEBUG=true

# Optional: WhatsApp Integration
WHATSAPP_API_URL=your-whatsapp-api-url
WHATSAPP_API_KEY=your-whatsapp-api-key
WHATSAPP_ENABLED=false
```

## Running the Agent

### Development Mode

**Terminal 1: Start Toolbox (database tools)**
```bash
cd ai-agent
export SUPABASE_HOST=db.xxx.supabase.co
export SUPABASE_USER=postgres
export SUPABASE_PASSWORD=your-password
./toolbox --tools-file tools.yaml
```

**Terminal 2: Start Flask API**
```bash
cd ai-agent
source venv/bin/activate
python run.py
```

### Verify Services

```bash
# Check Toolbox is running
curl -s http://localhost:5000/api/toolsets | jq

# Check Flask API
curl http://localhost:5001/api/health
```

### Available API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/analytics/query` | POST | Natural language analytics queries |
| `/api/customer/chat` | POST | Customer service chat |
| `/api/whatsapp/webhook` | POST | WhatsApp message webhook |
| `/api/health` | GET | Health check |

## Analytics Agent Features

### Hybrid Intent Detection

The Analytics Agent uses a **hybrid intent detection system**:

1. **Primary: Keyword-based detection** - Fast pattern matching for common queries
2. **Fallback: LLM-based detection** - Handles complex/ambiguous queries using Gemini

This provides the best of both worlds: speed for common queries and flexibility for edge cases.

```python
# In code, you can toggle LLM fallback
agent = AnalyticsAgent(use_llm_fallback=True)  # Default
agent = AnalyticsAgent(use_llm_fallback=False)  # Keywords only
```

### Supported Intents

| Intent | Example Queries (Indonesian) |
|--------|------------------------------|
| Daily Revenue | "laporan hari ini", "pendapatan harian", "omset hari ini" |
| Weekly Revenue | "laporan minggu ini", "weekly report" |
| Monthly Revenue | "laporan bulan ini", "pendapatan bulanan" |
| Compare Periods | "bandingkan minggu ini dengan minggu lalu" |
| Popular Services | "layanan terlaris", "top services", "servis populer" |
| Peak Hours | "jam sibuk", "jam ramai" |
| Points Summary | "total poin toko", "ringkasan poin" |
| Points Check | "cek poin 081234567890" |
| Points Info | "cara dapat poin", "cara tukar poin" |
| Store List | "daftar toko", "list cabang" |
| Churned Customers | "pelanggan churn", "customer hilang" |
| Inactive Customers | "pelanggan tidak aktif" |

### Multi-Store Support

The agent supports multi-tenant queries with intelligent store name resolution:

```bash
# Query specific store by name
curl -X POST http://localhost:5001/api/analytics/query \
  -d '{"query": "laporan harian toko ruang laundry villa asia"}'

# With explicit store_id
curl -X POST http://localhost:5001/api/analytics/query \
  -d '{"query": "laporan minggu ini", "store_id": "uuid-here"}'
```

The store matching algorithm uses:
- Word overlap scoring
- Bonus for unique identifiers (location names like "villa", "gaperi")
- Exact match bonus

### Loyalty Points System

```bash
# Check customer points by phone
curl -X POST http://localhost:5001/api/analytics/query \
  -d '{"query": "cek poin 081234567890"}'

# How to earn points
curl -X POST http://localhost:5001/api/analytics/query \
  -d '{"query": "cara dapat poin"}'

# How to redeem points
curl -X POST http://localhost:5001/api/analytics/query \
  -d '{"query": "cara tukar poin"}'

# Store points summary
curl -X POST http://localhost:5001/api/analytics/query \
  -d '{"query": "ringkasan poin toko villa asia"}'
```

## MCP Toolbox Configuration

The `tools.yaml` file defines SQL-based tools for database operations.

### Tool Categories

| Category | Tools |
|----------|-------|
| **Customer** | `search-customer`, `get-customer-by-phone`, `get-customer-points`, `get-customer-points-history` |
| **Orders** | `check-order-status`, `get-recent-orders`, `get-order-status-summary` |
| **Analytics** | `get-daily-revenue`, `get-weekly-revenue`, `get-monthly-revenue`, `get-popular-services` |
| **Store** | `list-stores`, `get-store-by-name` |
| **Points** | `get-customer-points`, `get-points-summary-by-store`, `get-customer-points-history` |

### Adding New SQL Tools

Edit `tools.yaml`:

```yaml
tools:
  my-custom-tool:
    kind: postgres-sql
    source: laundry-db
    description: Description of what this tool does
    parameters:
      - name: param1
        type: string
        description: Parameter description
    statement: |
      SELECT * FROM table WHERE column = $1;

# Add to toolset
toolsets:
  analytics-tools:
    - my-custom-tool
```

### Testing Tools Directly

```bash
# List available tools
curl http://localhost:5000/api/toolsets

# Call a tool directly
curl -X POST http://localhost:5000/api/tool/list-stores \
  -H "Content-Type: application/json" \
  -d '{}'

# Tool with parameters
curl -X POST http://localhost:5000/api/tool/get-customer-points \
  -H "Content-Type: application/json" \
  -d '{"phone": "081234567890"}'
```

## Testing

### Run All Tests

```bash
cd ai-agent
source venv/bin/activate

# Run tests with coverage
pytest --cov=src --cov-report=html

# Run specific test file
pytest tests/test_analytics_agent.py -v

# Run with verbose output
pytest -v --tb=short
```

### View Coverage Report

```bash
# After running pytest with --cov-report=html
open htmlcov/index.html
```

### Manual API Testing

```bash
# 1. Revenue reports
curl -X POST http://localhost:5001/api/analytics/query \
  -H "Content-Type: application/json" \
  -d '{"query": "laporan pendapatan minggu ini"}'

# 2. Store listing
curl -X POST http://localhost:5001/api/analytics/query \
  -H "Content-Type: application/json" \
  -d '{"query": "daftar toko"}'

# 3. Customer points
curl -X POST http://localhost:5001/api/analytics/query \
  -H "Content-Type: application/json" \
  -d '{"query": "cek poin 081234567890"}'

# 4. Period comparison
curl -X POST http://localhost:5001/api/analytics/query \
  -H "Content-Type: application/json" \
  -d '{"query": "bandingkan minggu ini dengan minggu lalu"}'
```

## Troubleshooting

### Common Issues

#### Toolbox Connection Failed
```
Error: Failed to connect to toolbox server
```
**Solution**: Ensure toolbox is running:
```bash
./toolbox --tools-file tools.yaml
# Check: curl http://localhost:5000/api/toolsets
```

#### Database Connection Error
```
Error: Invalid password for user postgres
```
**Solution**: Set correct environment variables:
```bash
export SUPABASE_HOST=db.xxx.supabase.co
export SUPABASE_USER=postgres
export SUPABASE_PASSWORD=correct-password
```

#### LLM API Error
```
Error: Google API key invalid
```
**Solution**: Verify `GOOGLE_API_KEY` in `.env` or environment.

#### UUID Format Error
```
Error: invalid input syntax for type uuid
```
**Solution**: The agent handles UUID byte array conversion automatically via `_format_uuid()`. If issues persist, check database return format.

### Debug Mode

```bash
# Enable debug logging
export DEBUG=true
python run.py
```

### Service Health Check

```bash
# Toolbox health
curl http://localhost:5000/api/toolsets

# Flask API health
curl http://localhost:5001/api/health
```

## API Reference

### POST /api/analytics/query

Process natural language analytics queries.

**Request:**
```json
{
  "query": "laporan pendapatan hari ini",
  "store_id": "optional-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "response": "📊 *Laporan Harian - 14 Des 2024*\n\n💰 Total: Rp 1.500.000\n📦 Pesanan: 25\n✅ Lunas: 20\n⏳ Pending: 5",
  "data": {
    "total_revenue": 1500000,
    "total_orders": 25,
    "paid_orders": 20
  }
}
```

### POST /api/customer/chat

Handle customer service chat messages.

**Request:**
```json
{
  "message": "cek status pesanan saya",
  "customer_phone": "081234567890"
}
```

**Response:**
```json
{
  "success": true,
  "response": "Pesanan Anda sedang dalam proses...",
  "data": null
}
```

## Development Guide

### Project Structure

```
src/
├── agents/
│   └── analytics_agent_v2.py    # Main analytics agent
│       ├── process_query()       # Entry point
│       ├── _classify_intent_with_keywords()  # Primary
│       ├── _classify_intent_with_llm()       # Fallback
│       ├── get_daily_report()    
│       ├── get_customer_points()
│       └── ...
│
├── toolbox_client.py            # Toolbox API wrapper
│   ├── execute_tool()           # Generic tool execution
│   ├── get_daily_revenue()      
│   └── list_stores()
│
└── api/routes_v2.py             # Flask endpoints
```

### Adding New Features

1. **Add SQL tool** in `tools.yaml`
2. **Add wrapper method** in `toolbox_client.py`
3. **Add keyword detection** in `_classify_intent_with_keywords()`
4. **Update LLM prompt** in `INTENT_CLASSIFICATION_PROMPT`
5. **Add handler method** in agent
6. **Add routing** in `process_query()`
7. **Write tests** in `tests/`

### Code Style

- Use type hints for all functions
- Follow PEP 8 guidelines  
- Write docstrings for public methods
- Maintain async/await patterns
- Keep 100% test coverage

## WhatsApp Integration (WhatsPoints)

The AI Agent integrates with [WhatsPoints](https://github.com/fahrudina/whatspoints) - a WhatsApp messaging service built with Go and Clean Architecture.

### WhatsPoints Overview

WhatsPoints provides:
- **REST API** for sending WhatsApp messages
- **Multiple sender support** - Register multiple WhatsApp numbers
- **PostgreSQL session storage** - Persistent WhatsApp sessions
- **Basic Auth security** - HTTP Basic Authentication

### Setup WhatsPoints

#### 1. Clone and Configure WhatsPoints

```bash
# Clone WhatsPoints repository
git clone https://github.com/fahrudina/whatspoints.git
cd whatspoints

# Create .env file
cat > .env << EOF
# Database (same Supabase as Smart Laundry POS)
SUPABASE_HOST=db.your-project.supabase.co
SUPABASE_PORT=6543
SUPABASE_USER=postgres
SUPABASE_PASSWORD=your-password
SUPABASE_DB=postgres
SUPABASE_SSLMODE=require

# API Configuration
API_HOST=0.0.0.0
API_PORT=8080
API_USERNAME=admin
API_PASSWORD=your-secure-password
EOF

# Build and run
go build -o whatspoints
./whatspoints
```

#### 2. Register WhatsApp Sender

```bash
# Method 1: QR Code (visual)
./whatspoints -add-sender

# Method 2: SMS Pairing Code
./whatspoints -add-sender-code=+628123456789
```

Follow the prompts to scan QR code or enter pairing code on your WhatsApp mobile app.

#### 3. Configure AI Agent

Add WhatsPoints credentials to AI Agent `.env`:

```bash
# WhatsApp Integration via WhatsPoints
WHATSAPP_ENABLED=true
WHATSAPP_API_URL=http://localhost:8080/api/send-message
WHATSAPP_API_KEY=admin:your-secure-password
```

Or update `src/config.py` directly:

```python
WHATSAPP_API_URL = "http://localhost:8080/api/send-message"
WHATSAPP_API_KEY = "admin:your-secure-password"  # username:password for Basic Auth
WHATSAPP_ENABLED = True
```

### WhatsPoints API Reference

#### Send Message (Default Sender)

```bash
curl -X POST http://localhost:8080/api/send-message \
  -u admin:your-secure-password \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+628123456789",
    "message": "Hello from Smart Laundry!"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "id": "3EB0..."
}
```

#### Send Message (Specific Sender)

```bash
curl -X POST http://localhost:8080/api/send-message \
  -u admin:your-secure-password \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+628123456789",
    "message": "Hello!",
    "from": "sender_id_here"
  }'
```

#### List Available Senders

```bash
curl -X GET http://localhost:8080/api/senders \
  -u admin:your-secure-password
```

**Response:**
```json
{
  "count": 2,
  "senders": [
    {
      "id": "628111222333",
      "phone_number": "628111222333",
      "is_default": true,
      "is_active": true
    }
  ]
}
```

#### Check Service Status

```bash
curl -X GET http://localhost:8080/api/status \
  -u admin:your-secure-password
```

**Response:**
```json
{
  "whatsapp": {
    "connected": true,
    "logged_in": true,
    "jid": "628123456789@s.whatsapp.net"
  }
}
```

### Integration Architecture

The recommended architecture is **WhatsPoints calling AI Agent** (not the other way around):

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Message Flow                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Customer        WhatsPoints         AI Agent          Toolbox          │
│      │               (Go)              (Flask)           (MCP)           │
│      │                │                  │                 │             │
│      │  1. Send WA    │                  │                 │             │
│      │  ─────────────▶│                  │                 │             │
│      │                │  2. HTTP POST    │                 │             │
│      │                │  /api/chat       │                 │             │
│      │                │  ────────────────▶│                │             │
│      │                │                  │  3. Query DB    │             │
│      │                │                  │  ────────────────▶│           │
│      │                │                  │  4. Results     │             │
│      │                │                  │◀────────────────│             │
│      │                │  5. AI Response  │                 │             │
│      │                │◀─────────────────│                 │             │
│      │  6. Reply WA   │                  │                 │             │
│      │◀───────────────│                  │                 │             │
│      │                │                  │                 │             │
└─────────────────────────────────────────────────────────────────────────┘
```

**Why this architecture?**
1. **WhatsPoints** handles WhatsApp connections, sessions, QR codes
2. **AI Agent** is stateless - processes queries and returns responses
3. **Separation of concerns** - WhatsApp logic vs AI logic
4. **Scalability** - Can have multiple WhatsPoints instances calling one AI Agent

### WhatsPoints → AI Agent Integration

#### 1. AI Agent Endpoints for WhatsPoints

The AI Agent exposes these endpoints for WhatsPoints to call:

| Endpoint | Method | Use Case |
|----------|--------|----------|
| `/api/chat` | POST | Customer service (order status, help) |
| `/api/analytics` | POST | Business reports (owner queries) |
| `/api/whatsapp/webhook` | POST | Generic WhatsApp message processing |

#### 2. Implement Webhook in WhatsPoints

Add a message handler in WhatsPoints that calls AI Agent:

```go
// In WhatsPoints: internal/delivery/whatsapp_handler.go

func (h *WhatsAppHandler) HandleIncomingMessage(msg *waProto.Message) {
    // Extract message details
    sender := msg.GetKey().GetRemoteJid()
    text := msg.GetConversation()
    
    // Call AI Agent
    response, err := h.callAIAgent(sender, text)
    if err != nil {
        log.Printf("AI Agent error: %v", err)
        response = "Maaf, terjadi kesalahan. Silakan coba lagi."
    }
    
    // Send reply
    h.SendMessage(sender, response)
}

func (h *WhatsAppHandler) callAIAgent(phone, message string) (string, error) {
    payload := map[string]interface{}{
        "message": message,
        "phone":   phone,
    }
    
    jsonData, _ := json.Marshal(payload)
    
    req, _ := http.NewRequest("POST", 
        "http://ai-agent:5001/api/chat", 
        bytes.NewBuffer(jsonData))
    req.Header.Set("Content-Type", "application/json")
    
    client := &http.Client{Timeout: 30 * time.Second}
    resp, err := client.Do(req)
    if err != nil {
        return "", err
    }
    defer resp.Body.Close()
    
    var result struct {
        Success  bool   `json:"success"`
        Response string `json:"response"`
    }
    json.NewDecoder(resp.Body).Decode(&result)
    
    return result.Response, nil
}
```

#### 3. Configure WhatsPoints Environment

```bash
# In WhatsPoints .env
AI_AGENT_URL=http://localhost:5001
AI_AGENT_ENABLED=true
```

#### 4. AI Agent Chat Endpoint Details

**POST /api/chat**

```bash
curl -X POST http://localhost:5001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "cek status pesanan saya",
    "phone": "081234567890",
    "context": {
      "source": "whatsapp",
      "sender_name": "Budi"
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "response": "📋 *Status Pesanan Anda*\n\n1. ORD-001 - Cuci Setrika\n   Status: Dalam Proses\n   Estimasi: 2 hari\n\n2. ORD-002 - Cuci Kering\n   Status: Siap Diambil ✅",
  "data": {
    "orders": [...]
  }
}
```

**POST /api/analytics** (for owner queries)

```bash
curl -X POST http://localhost:5001/api/analytics \
  -H "Content-Type: application/json" \
  -d '{
    "query": "laporan pendapatan hari ini",
    "store_id": "optional-uuid"
  }'
```

#### 5. Message Routing Logic

WhatsPoints should route messages based on content:

```go
func (h *WhatsAppHandler) routeMessage(phone, message string) (string, error) {
    msgLower := strings.ToLower(message)
    
    // Owner analytics queries (detected by keywords)
    if h.isOwnerQuery(msgLower) {
        return h.callAnalyticsAPI(phone, message)
    }
    
    // Customer service (default)
    return h.callChatAPI(phone, message)
}

func (h *WhatsAppHandler) isOwnerQuery(msg string) bool {
    ownerKeywords := []string{
        "laporan", "pendapatan", "revenue",
        "omset", "analytics", "statistik",
    }
    for _, kw := range ownerKeywords {
        if strings.Contains(msg, kw) {
            return true
        }
    }
    return false
}
```

### Sending Notifications (AI Agent → WhatsPoints)

For **outbound** messages (order notifications, promos), AI Agent calls WhatsPoints:

```python
# In AI Agent: send notification to customer
from src.tools.notification_tools import NotificationTools

tools = NotificationTools()
result = tools.send_whatsapp_message(
    phone="081234567890",
    message="Pesanan Anda siap diambil!"
)
```

This uses the existing WhatsPoints API:

```bash
curl -X POST http://whatspoints:8080/api/send-message \
  -u admin:password \
  -H "Content-Type: application/json" \
  -d '{"to": "+628123456789", "message": "Pesanan siap!"}'
```

### Complete Flow Example

```
┌──────────────────────────────────────────────────────────────────────┐
│ Customer: "cek status pesanan saya"                                  │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│ 1. WhatsApp → WhatsPoints (receives message)                         │
│                                                                       │
│ 2. WhatsPoints → AI Agent POST /api/chat                             │
│    {                                                                  │
│      "message": "cek status pesanan saya",                           │
│      "phone": "081234567890"                                         │
│    }                                                                  │
│                                                                       │
│ 3. AI Agent → Toolbox → Supabase (query orders)                      │
│                                                                       │
│ 4. AI Agent → WhatsPoints (returns response)                         │
│    {                                                                  │
│      "success": true,                                                │
│      "response": "📋 Status Pesanan:\n- ORD-001: Dalam Proses"       │
│    }                                                                  │
│                                                                       │
│ 5. WhatsPoints → WhatsApp → Customer (sends reply)                   │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

### Docker Compose (Recommended Setup)

```yaml
version: '3.8'
services:
  toolbox:
    image: your-toolbox-image
    ports:
      - "5000:5000"
    environment:
      - SUPABASE_HOST=${SUPABASE_HOST}
      - SUPABASE_USER=${SUPABASE_USER}
      - SUPABASE_PASSWORD=${SUPABASE_PASSWORD}
    volumes:
      - ./ai-agent/tools.yaml:/app/tools.yaml

  ai-agent:
    build: ./ai-agent
    ports:
      - "5001:5001"
    environment:
      - TOOLBOX_URL=http://toolbox:5000
      - GOOGLE_API_KEY=${GOOGLE_API_KEY}
      - WHATSAPP_API_URL=http://whatspoints:8080/api/send-message
      - WHATSAPP_API_KEY=admin:${WHATSAPP_PASSWORD}
    depends_on:
      - toolbox

  whatspoints:
    build: ./whatspoints
    ports:
      - "8082:8080"
    environment:
      - SUPABASE_HOST=${SUPABASE_HOST}
      - SUPABASE_PORT=6543
      - SUPABASE_USER=${SUPABASE_USER}
      - SUPABASE_PASSWORD=${SUPABASE_PASSWORD}
      - SUPABASE_DB=postgres
      - SUPABASE_SSLMODE=require
      - API_USERNAME=admin
      - API_PASSWORD=${WHATSAPP_PASSWORD}
      - AI_AGENT_URL=http://ai-agent:5001
    depends_on:
      - ai-agent
```

### Using NotificationTools (Outbound Only)

The `NotificationTools` class sends **outbound** WhatsApp messages via WhatsPoints (for notifications, not replies):

```python
from src.tools.notification_tools import NotificationTools

tools = NotificationTools()

# Send simple message
result = tools.send_whatsapp_message(
    phone="081234567890",
    message="Pesanan Anda siap diambil!"
)

# Send order notification (uses templates)
result = tools.send_order_notification(
    order_id="ORD-001",
    notification_type="order_ready",  # order_created, order_ready, order_completed
    customer_name="Budi",
    customer_phone="081234567890",
    total_amount=150000
)

# Send promotional message
result = tools.send_promotional_message(
    phone="081234567890",
    customer_name="Budi",
    promo_message="Diskon 20% untuk cuci setrika!",
    expiry_date="31 Desember 2025"
)
```

### WhatsApp Agent

The `WhatsAppAgent` handles incoming WhatsApp messages:

```python
from src.agents.whatsapp_agent_v2 import WhatsAppAgent

agent = WhatsAppAgent()

# Process incoming message
result = await agent.process_message(
    message="CEK",  # or "HARGA", "POIN", "HELP"
    sender_phone="081234567890"
)

print(result['response'])
```

**Supported Commands:**
| Command | Description |
|---------|-------------|
| `CEK` / `STATUS` / `1` | Check order status |
| `HARGA` / `PRICE` / `2` | View price list |
| `POIN` / `POINTS` / `3` | Check loyalty points |
| `HELP` / `BANTUAN` / `4` | Show help menu |

### Troubleshooting WhatsApp Integration

#### WhatsApp Not Connected

```bash
# Check WhatsPoints status
curl http://localhost:8080/api/status -u admin:password

# If not connected, re-add sender
./whatspoints -add-sender
```

#### Message Send Failed

1. Check WhatsPoints logs for errors
2. Verify phone number format (with country code: `+628...`)
3. Ensure WhatsApp session is active
4. Check Basic Auth credentials

#### Session Expired

WhatsApp sessions may expire. Re-authenticate:

```bash
# Clear old sessions (optional)
./whatspoints -clear-sessions

# Add sender again
./whatspoints -add-sender
```

## License

Part of Smart Laundry POS project.

## Contributing

1. Create feature branch from `main`
2. Write tests for new features
3. Ensure all tests pass with coverage
4. Submit pull request

---

**Note**: This AI Agent is designed to work with the Smart Laundry POS Supabase database schema. Ensure database migrations are up to date before running.
