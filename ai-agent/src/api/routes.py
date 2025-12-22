"""API routes for AI Agent."""

from flask import Flask, request, jsonify
from flask_cors import CORS
from typing import Optional
from ..agents import CustomerServiceAgent, AnalyticsAgent, WhatsAppAgent
from ..config import config


def create_app(testing: bool = False) -> Flask:
    """
    Create and configure Flask application.
    
    Args:
        testing: If True, configure for testing
        
    Returns:
        Configured Flask app
    """
    app = Flask(__name__)
    
    # Enable CORS
    CORS(app, origins=["*"])
    
    # Configure app
    app.config['TESTING'] = testing
    app.config['JSON_SORT_KEYS'] = False
    
    # Initialize agents (lazy loading)
    agents = {}
    
    def get_customer_service_agent() -> CustomerServiceAgent:
        if 'customer_service' not in agents:
            agents['customer_service'] = CustomerServiceAgent()
        return agents['customer_service']
    
    def get_analytics_agent() -> AnalyticsAgent:
        if 'analytics' not in agents:
            agents['analytics'] = AnalyticsAgent()
        return agents['analytics']
    
    def get_whatsapp_agent() -> WhatsAppAgent:
        if 'whatsapp' not in agents:
            agents['whatsapp'] = WhatsAppAgent()
        return agents['whatsapp']
    
    # Health check endpoint
    @app.route('/health', methods=['GET'])
    def health_check():
        """Health check endpoint."""
        return jsonify({
            "status": "healthy",
            "version": "1.0.0",
            "service": "smart-laundry-ai-agent"
        })
    
    # Customer Service endpoints
    @app.route('/api/chat', methods=['POST'])
    def chat():
        """
        Handle customer chat message.
        
        Request body:
            - message: str (required)
            - phone: str (optional)
            - context: dict (optional)
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
        
        agent = get_customer_service_agent()
        result = agent.handle_inquiry(message, phone, context)
        
        return jsonify(result)
    
    @app.route('/api/order/status', methods=['GET'])
    def order_status():
        """
        Check order status by phone number.
        
        Query params:
            - phone: str (required)
        """
        phone = request.args.get('phone')
        
        if not phone:
            return jsonify({
                "success": False,
                "error": "Phone number is required"
            }), 400
        
        agent = get_customer_service_agent()
        result = agent.check_order_status(phone)
        
        return jsonify(result)
    
    @app.route('/api/services', methods=['GET'])
    def get_services():
        """
        Get available services and prices.
        
        Query params:
            - store_id: str (optional)
        """
        store_id = request.args.get('store_id')
        
        agent = get_customer_service_agent()
        result = agent.get_service_prices(store_id)
        
        return jsonify(result)
    
    @app.route('/api/points', methods=['GET'])
    def get_points():
        """
        Get customer points balance.
        
        Query params:
            - phone: str (required)
        """
        phone = request.args.get('phone')
        
        if not phone:
            return jsonify({
                "success": False,
                "error": "Phone number is required"
            }), 400
        
        agent = get_customer_service_agent()
        result = agent.check_points(phone)
        
        return jsonify(result)
    
    # Analytics endpoints
    @app.route('/api/analytics/query', methods=['POST'])
    def analytics_query():
        """
        Handle analytics query.
        
        Request body:
            - query: str (required)
            - store_id: str (optional)
        """
        data = request.get_json() or {}
        
        query = data.get('query', '')
        store_id = data.get('store_id')
        
        if not query:
            return jsonify({
                "success": False,
                "error": "Query is required"
            }), 400
        
        agent = get_analytics_agent()
        result = agent.handle_query(query, store_id)
        
        return jsonify(result)
    
    @app.route('/api/analytics/daily', methods=['GET'])
    def daily_report():
        """
        Get daily revenue report.
        
        Query params:
            - date: str (optional, YYYY-MM-DD)
            - store_id: str (optional)
        """
        date = request.args.get('date')
        store_id = request.args.get('store_id')
        
        agent = get_analytics_agent()
        result = agent.get_daily_report(date, store_id)
        
        return jsonify(result)
    
    @app.route('/api/analytics/period', methods=['GET'])
    def period_report():
        """
        Get period revenue report.
        
        Query params:
            - period: str (day, week, month, year)
            - store_id: str (optional)
        """
        period = request.args.get('period', 'week')
        store_id = request.args.get('store_id')
        
        agent = get_analytics_agent()
        result = agent.get_period_report(period, store_id)
        
        return jsonify(result)
    
    @app.route('/api/analytics/compare', methods=['GET'])
    def compare_periods():
        """
        Compare two periods.
        
        Query params:
            - period1: str (this_week, last_week, etc.)
            - period2: str
            - store_id: str (optional)
        """
        period1 = request.args.get('period1', 'last_week')
        period2 = request.args.get('period2', 'this_week')
        store_id = request.args.get('store_id')
        
        agent = get_analytics_agent()
        result = agent.compare_periods(period1, period2, store_id)
        
        return jsonify(result)
    
    @app.route('/api/analytics/churned', methods=['GET'])
    def churned_customers():
        """
        Get churned customers report.
        
        Query params:
            - days: int (default 30)
            - store_id: str (optional)
        """
        days = request.args.get('days', 30, type=int)
        store_id = request.args.get('store_id')
        
        agent = get_analytics_agent()
        result = agent.get_churned_customers_report(days, store_id)
        
        return jsonify(result)
    
    @app.route('/api/analytics/popular-services', methods=['GET'])
    def popular_services():
        """
        Get popular services report.
        
        Query params:
            - period: str (day, week, month, year)
            - store_id: str (optional)
        """
        period = request.args.get('period', 'month')
        store_id = request.args.get('store_id')
        
        agent = get_analytics_agent()
        result = agent.get_popular_services_report(period, store_id)
        
        return jsonify(result)
    
    # WhatsApp endpoints
    @app.route('/api/whatsapp/webhook', methods=['POST'])
    def whatsapp_webhook():
        """
        Handle incoming WhatsApp message webhook.
        
        Request body:
            - phone: str (required)
            - message: str (required)
            - context: dict (optional)
        """
        data = request.get_json() or {}
        
        phone = data.get('phone', '')
        message = data.get('message', '')
        context = data.get('context')
        
        if not phone:
            return jsonify({
                "success": False,
                "error": "Phone number is required"
            }), 400
        
        agent = get_whatsapp_agent()
        result = agent.handle_message(phone, message, context)
        
        return jsonify(result)
    
    @app.route('/api/whatsapp/notify/ready', methods=['POST'])
    def notify_ready_orders():
        """
        Send notifications for ready orders.
        
        Request body:
            - store_id: str (optional)
        """
        data = request.get_json() or {}
        store_id = data.get('store_id')
        
        agent = get_whatsapp_agent()
        result = agent.notify_ready_orders(store_id)
        
        return jsonify(result)
    
    @app.route('/api/whatsapp/notify/payment', methods=['POST'])
    def notify_pending_payments():
        """
        Send payment reminders.
        
        Request body:
            - hours_old: int (default 24)
            - store_id: str (optional)
        """
        data = request.get_json() or {}
        hours_old = data.get('hours_old', 24)
        store_id = data.get('store_id')
        
        agent = get_whatsapp_agent()
        result = agent.notify_pending_payments(hours_old, store_id)
        
        return jsonify(result)
    
    @app.route('/api/whatsapp/campaign', methods=['POST'])
    def send_campaign():
        """
        Send re-engagement campaign.
        
        Request body:
            - customers: list of {name, phone}
            - promo_message: str
        """
        data = request.get_json() or {}
        
        customers = data.get('customers', [])
        promo_message = data.get('promo_message', '')
        
        if not customers:
            return jsonify({
                "success": False,
                "error": "Customers list is required"
            }), 400
        
        if not promo_message:
            return jsonify({
                "success": False,
                "error": "Promo message is required"
            }), 400
        
        agent = get_whatsapp_agent()
        result = agent.send_reengagement_campaign(customers, promo_message)
        
        return jsonify(result)
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            "success": False,
            "error": "Endpoint not found"
        }), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({
            "success": False,
            "error": "Internal server error"
        }), 500
    
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
