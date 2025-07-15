from flask import Flask
import os

# Initialize the app package
app = Flask(__name__)
app.secret_key = os.urandom(24)

# Import routes after app is created
from app.routes import *  # Import routes at the end to avoid circular imports 