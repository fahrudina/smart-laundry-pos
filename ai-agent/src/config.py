"""Configuration management for AI Agent."""

import os
from typing import Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class Config:
    """Application configuration with environment variable support."""
    
    # MCP Toolbox Configuration
    TOOLBOX_URL: str = os.getenv("TOOLBOX_URL", "http://127.0.0.1:5000")
    
    # Supabase Configuration (for Toolbox database source)
    SUPABASE_URL: str = os.getenv(
        "SUPABASE_URL", 
        "https://wdqxdiiohricwhcaedsn.supabase.co"
    )
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    SUPABASE_HOST: str = os.getenv("SUPABASE_HOST", "db.wdqxdiiohricwhcaedsn.supabase.co")
    SUPABASE_USER: str = os.getenv("SUPABASE_USER", "postgres")
    SUPABASE_PASSWORD: str = os.getenv("SUPABASE_PASSWORD", "")
    
    # Google AI Configuration
    GOOGLE_API_KEY: str = os.getenv("GOOGLE_API_KEY", "AIzaSyDgg0nv5Cold2JaZAxNkdd0GjizPyhivdE")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash-lite")
    
    # WhatsApp Configuration
    WHATSAPP_API_URL: str = os.getenv("WHATSAPP_API_URL", "")
    WHATSAPP_API_KEY: str = os.getenv("WHATSAPP_API_KEY", "")
    WHATSAPP_ENABLED: bool = os.getenv("WHATSAPP_ENABLED", "false").lower() == "true"
    
    # Business Configuration
    DEFAULT_INACTIVE_DAYS: int = int(os.getenv("DEFAULT_INACTIVE_DAYS", "30"))
    DEFAULT_CURRENCY: str = os.getenv("DEFAULT_CURRENCY", "IDR")
    TAX_RATE: float = float(os.getenv("TAX_RATE", "0.1"))  # 10% default
    
    # API Configuration
    API_HOST: str = os.getenv("API_HOST", "0.0.0.0")
    API_PORT: int = int(os.getenv("API_PORT", "8000"))  # Use 8000 to avoid conflict with Toolbox
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
    
    @classmethod
    def validate(cls, require_all: bool = False) -> tuple[bool, list[str]]:
        """
        Validate required configuration.
        
        Args:
            require_all: If True, require all config including optional ones
            
        Returns:
            Tuple of (is_valid, list of missing keys)
        """
        required = ["TOOLBOX_URL"]
        
        if require_all:
            required.extend([
                "GOOGLE_API_KEY", 
                "WHATSAPP_API_URL", 
                "WHATSAPP_API_KEY",
                "SUPABASE_PASSWORD"
            ])
        
        missing = [key for key in required if not getattr(cls, key)]
        
        return len(missing) == 0, missing
    
    @classmethod
    def get_toolbox_config(cls) -> dict:
        """Get Toolbox configuration as dictionary."""
        return {
            "url": cls.TOOLBOX_URL
        }
    
    @classmethod
    def get_supabase_config(cls) -> dict:
        """Get Supabase configuration as dictionary."""
        return {
            "url": cls.SUPABASE_URL,
            "key": cls.SUPABASE_KEY
        }
    
    @classmethod
    def get_gemini_config(cls) -> dict:
        """Get Google Gemini configuration as dictionary."""
        return {
            "api_key": cls.GOOGLE_API_KEY,
            "model": cls.GEMINI_MODEL
        }
    
    @classmethod
    def format_currency(cls, amount: float) -> str:
        """Format amount as currency string."""
        if cls.DEFAULT_CURRENCY == "IDR":
            return f"Rp {amount:,.0f}"
        return f"{cls.DEFAULT_CURRENCY} {amount:,.2f}"


# Singleton instance
config = Config()
