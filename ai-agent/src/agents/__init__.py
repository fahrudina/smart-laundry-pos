"""AI Agents for Smart Laundry POS using MCP Toolbox."""

# Toolbox-based agents (recommended)
from .customer_service_agent_v2 import CustomerServiceAgent
from .analytics_agent_v2 import AnalyticsAgent
from .whatsapp_agent_v2 import WhatsAppAgent, handle_whatsapp_webhook

# Legacy agents (deprecated - for backward compatibility)
from .customer_service_agent import CustomerServiceAgent as CustomerServiceAgentLegacy
from .analytics_agent import AnalyticsAgent as AnalyticsAgentLegacy
from .whatsapp_agent import WhatsAppAgent as WhatsAppAgentLegacy

__all__ = [
    # Toolbox-based (recommended)
    "CustomerServiceAgent",
    "AnalyticsAgent",
    "WhatsAppAgent",
    "handle_whatsapp_webhook",
    # Legacy (deprecated)
    "CustomerServiceAgentLegacy",
    "AnalyticsAgentLegacy",
    "WhatsAppAgentLegacy",
]
