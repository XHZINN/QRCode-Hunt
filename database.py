from supabase import Client, create_client
from dotenv import load_dotenv
import os

# Load environment variables from .env
load_dotenv()

url: str = os.getenv('SUPABASE_URL')
key: str = os.getenv("SUPABASE_KEY")
banco_dados: Client = create_client(url, key)