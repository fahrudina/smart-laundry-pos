#!/usr/bin/env python
"""Run the Smart Laundry POS AI Agent Flask server."""

import sys
import os

# Add the ai-agent directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.api.routes_v2 import create_app

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5001, debug=True)
