"""Flask API routes using MCP Toolbox for Smart Laundry POS AI Agent."""

import asyncio
import threading
from functools import wraps
from flask import Flask, Blueprint, request, jsonify
from flask_cors import CORS

from ..config import config
from ..toolbox_client import LaundryToolboxClient
from ..agents import CustomerServiceAgent, AnalyticsAgent, WhatsAppAgent


# Create a dedicated event loop for async operations
_loop = None
_loop_thread = None


def get_event_loop():
    """Get or create the dedicated event loop."""
    global _loop, _loop_thread
    if _loop is None or _loop.is_closed():
        _loop = asyncio.new_event_loop()
        _loop_thread = threading.Thread(target=_loop.run_forever, daemon=True)
        _loop_thread.start()
    return _loop


def run_async(coro):
    """Run async function in the dedicated event loop."""
    loop = get_event_loop()
    future = asyncio.run_coroutine_threadsafe(coro, loop)
    return future.result(timeout=60)  # 60 second timeout


def async_route(f):
    """Decorator to run async route handlers."""
    @wraps(f)
    def wrapper(*args, **kwargs):
        return run_async(f(*args, **kwargs))
    return wrapper


# Create Blueprint
api = Blueprint('api', __name__, url_prefix='/api')


# Global toolbox client (lazy initialized)
_toolbox_client = None


async def get_toolbox_client() -> LaundryToolboxClient:
    """Get or create the global toolbox client."""
    global _toolbox_client
    if _toolbox_client is None:
        _toolbox_client = LaundryToolboxClient()
        await _toolbox_client.connect()
    return _toolbox_client


@api.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        "status": "healthy",
        "version": "2.0.0",
        "toolbox_url": config.TOOLBOX_URL
    })


@api.route('/chat', methods=['POST'])
@async_route
async def chat():
    """
    Customer service chat endpoint.
    
    Request body:
        {
            "message": "string",
            "phone": "string (optional)",
            "context": {} (optional)
        }
    """
    data = request.get_json() or {}
    message = data.get('message', '')
    phone = data.get('phone')
    context = data.get('context')
    
    if not message:
        return jsonify({
            "success": False,
            "error": "Message is required"
        }), 400
    
    try:
        client = await get_toolbox_client()
        agent = CustomerServiceAgent(toolbox_client=client)
        result = await agent.handle_inquiry(message, phone, context)
        return jsonify(result)
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@api.route('/analytics', methods=['POST'])
@async_route
async def analytics():
    """
    Analytics query endpoint.
    
    Request body:
        {
            "query": "string",
            "store_id": "string (optional, UUID)"
        }
    """
    data = request.get_json() or {}
    query = data.get('query', '')
    store_id = data.get('store_id', '')
    
    if not query:
        return jsonify({
            "success": False,
            "error": "Query is required"
        }), 400
    
    try:
        client = await get_toolbox_client()
        agent = AnalyticsAgent(toolbox_client=client, store_id=store_id)
        result = await agent.process_query(query, store_id=store_id)
        return jsonify(result)
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@api.route('/analytics/daily', methods=['GET'])
@async_route
async def daily_report():
    """Get daily revenue report."""
    date = request.args.get('date', '')
    store_id = request.args.get('store_id', '')
    
    try:
        client = await get_toolbox_client()
        agent = AnalyticsAgent(toolbox_client=client, store_id=store_id)
        result = await agent.get_daily_report(date if date else None, store_id=store_id)
        return jsonify(result)
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@api.route('/analytics/weekly', methods=['GET'])
@async_route
async def weekly_report():
    """Get weekly revenue report."""
    store_id = request.args.get('store_id', '')
    
    try:
        client = await get_toolbox_client()
        agent = AnalyticsAgent(toolbox_client=client, store_id=store_id)
        result = await agent.get_weekly_report(store_id=store_id)
        return jsonify(result)
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@api.route('/analytics/monthly', methods=['GET'])
@async_route
async def monthly_report():
    """Get monthly revenue report."""
    store_id = request.args.get('store_id', '')
    
    try:
        client = await get_toolbox_client()
        agent = AnalyticsAgent(toolbox_client=client, store_id=store_id)
        result = await agent.get_monthly_report(store_id=store_id)
        return jsonify(result)
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@api.route('/stores', methods=['GET'])
@async_route
async def list_stores():
    """List all available stores."""
    try:
        client = await get_toolbox_client()
        agent = AnalyticsAgent(toolbox_client=client)
        result = await agent.list_stores()
        return jsonify(result)
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@api.route('/analytics/churned', methods=['GET'])
@async_route
async def churned_customers():
    """Get churned customers analysis."""
    days = request.args.get('days', 30, type=int)
    
    try:
        client = await get_toolbox_client()
        agent = AnalyticsAgent(toolbox_client=client)
        result = await agent.get_churned_customers(days)
        return jsonify(result)
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@api.route('/analytics/inactive', methods=['GET'])
@async_route
async def inactive_customers():
    """Get inactive customers list."""
    days = request.args.get('days', 30, type=int)
    
    try:
        client = await get_toolbox_client()
        agent = AnalyticsAgent(toolbox_client=client)
        result = await agent.get_inactive_customers(days)
        return jsonify(result)
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@api.route('/whatsapp/webhook', methods=['POST'])
@async_route
async def whatsapp_webhook():
    """
    WhatsApp webhook endpoint.
    
    Request body:
        {
            "message": "string",
            "phone": "string",
            "metadata": {} (optional)
        }
    """
    data = request.get_json() or {}
    message = data.get('message', '')
    phone = data.get('phone', '')
    metadata = data.get('metadata')
    
    if not phone:
        return jsonify({
            "success": False,
            "error": "Phone number is required"
        }), 400
    
    try:
        client = await get_toolbox_client()
        agent = WhatsAppAgent(toolbox_client=client)
        result = await agent.process_message(message, phone, metadata)
        return jsonify(result)
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@api.route('/orders/status/<phone>', methods=['GET'])
@async_route
async def order_status(phone: str):
    """Get order status by customer phone."""
    limit = request.args.get('limit', 3, type=int)
    
    try:
        client = await get_toolbox_client()
        orders = await client.check_order_status(phone, limit)
        return jsonify({
            "success": True,
            "orders": orders
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@api.route('/orders/<order_id>', methods=['GET'])
@async_route
async def order_details(order_id: str):
    """Get order details by ID."""
    try:
        client = await get_toolbox_client()
        order = await client.get_order_by_id(order_id)
        if not order:
            return jsonify({
                "success": False,
                "error": "Order not found"
            }), 404
        return jsonify({
            "success": True,
            "order": order
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@api.route('/customers/search', methods=['GET'])
@async_route
async def search_customers():
    """Search customers by name or phone."""
    query = request.args.get('q', '')
    
    if not query:
        return jsonify({
            "success": False,
            "error": "Search query is required"
        }), 400
    
    try:
        client = await get_toolbox_client()
        customers = await client.search_customer(query)
        return jsonify({
            "success": True,
            "customers": customers
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@api.route('/customers/<phone>/points', methods=['GET'])
@async_route
async def customer_points(phone: str):
    """Get customer loyalty points."""
    try:
        client = await get_toolbox_client()
        customer = await client.get_customer_points(phone)
        if not customer:
            return jsonify({
                "success": False,
                "error": "Customer not found"
            }), 404
        return jsonify({
            "success": True,
            "customer": customer
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@api.route('/services', methods=['GET'])
@async_route
async def list_services():
    """List all available services."""
    store_id = request.args.get('store_id', '')
    
    try:
        client = await get_toolbox_client()
        services = await client.get_all_services(store_id)
        return jsonify({
            "success": True,
            "services": services
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


def create_app(testing: bool = False) -> Flask:
    """
    Create and configure the Flask application.
    
    Args:
        testing: Whether to run in testing mode
        
    Returns:
        Configured Flask app
    """
    import os
    
    # Get the static folder path
    static_folder = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
        'static'
    )
    
    app = Flask(__name__, static_folder=static_folder, static_url_path='/static')
    
    # Configure CORS
    CORS(app, resources={
        r"/api/*": {
            "origins": "*",
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })
    
    # Register blueprint
    app.register_blueprint(api)
    
    # Serve chat UI at root
    @app.route('/')
    def root():
        return app.send_static_file('index.html')
    
    # Health check at /health
    @app.route('/health')
    def health():
        return jsonify({
            "name": "Smart Laundry POS AI Agent",
            "version": "2.0.0",
            "status": "running",
            "docs": "/api/health"
        })
    
    if testing:
        app.config['TESTING'] = True
    
    return app


def run_server():
    """Run the Flask development server."""
    app = create_app()
    app.run(
        host=config.API_HOST,
        port=config.API_PORT,
        debug=config.DEBUG
    )


if __name__ == '__main__':
    run_server()
