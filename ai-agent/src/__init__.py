"""Smart Laundry POS AI Agent

An AI-powered backend for laundry POS system using Google Gemini and MCP Toolbox.
"""

__version__ = "2.0.0"
__author__ = "Smart Laundry POS"

# Core components
from .config import config, Config
from .toolbox_client import LaundryToolboxClient, create_toolbox_client

# Agents (Toolbox-based)
from .agents.customer_service_agent_v2 import CustomerServiceAgent
from .agents.analytics_agent_v2 import AnalyticsAgent
from .agents.whatsapp_agent_v2 import WhatsAppAgent, handle_whatsapp_webhook

__all__ = [
    # Config
    "config",
    "Config",
    # Toolbox
    "LaundryToolboxClient",
    "create_toolbox_client",
    # Agents
    "CustomerServiceAgent",
    "AnalyticsAgent", 
    "WhatsAppAgent",
    "handle_whatsapp_webhook",
]
