"""Database connection management."""

from typing import Optional, Any
from supabase import create_client, Client
from .config import config


class DatabaseManager:
    """Manages Supabase database connections."""
    
    _instance: Optional['DatabaseManager'] = None
    _client: Optional[Client] = None
    
    def __new__(cls) -> 'DatabaseManager':
        """Singleton pattern."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    @property
    def client(self) -> Client:
        """Get or create Supabase client."""
        if self._client is None:
            self._client = create_client(
                config.SUPABASE_URL, 
                config.SUPABASE_KEY
            )
        return self._client
    
    def reset(self) -> None:
        """Reset client for testing purposes."""
        self._client = None
    
    def set_client(self, client: Client) -> None:
        """Set a custom client (for testing)."""
        self._client = client
    
    def table(self, name: str) -> Any:
        """Get a table reference."""
        return self.client.table(name)
    
    def rpc(self, function_name: str, params: dict = None) -> Any:
        """Call a stored procedure."""
        return self.client.rpc(function_name, params or {})


def get_database() -> DatabaseManager:
    """Get the database manager instance."""
    return DatabaseManager()


def get_supabase_client() -> Client:
    """Get the Supabase client directly."""
    return get_database().client


def reset_database() -> None:
    """Reset database connection (for testing)."""
    DatabaseManager._instance = None
    DatabaseManager._client = None
