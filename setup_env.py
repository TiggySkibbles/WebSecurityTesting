import os
import secrets

def create_backend_env():
    env_path = os.path.join('backend', '.env')
    if os.path.exists(env_path):
        print(f"[INFO] {env_path} already exists. Skipping.")
        return

    # Generate a cryptographically secure random secret key for Django
    secret_key = secrets.token_urlsafe(50)
    
    content = f"""# backend/.env

# Security Settings
# Automatically generated secure key for Django
SECRET_KEY={secret_key}
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Cookie Settings (Set to True in Production with HTTPS)
SECURE_COOKIES=False

# HTTPS Security Settings (Enable in Production)
SECURE_SSL_REDIRECT=False
SECURE_HSTS_SECONDS=0

# CORS Origins
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
"""
    with open(env_path, 'w') as f:
        f.write(content)
    print(f"[SUCCESS] Created {env_path} with a newly generated SECRET_KEY.")

def create_frontend_env():
    env_path = os.path.join('frontend', '.env')
    if os.path.exists(env_path):
        print(f"[INFO] {env_path} already exists. Skipping.")
        return

    content = """# frontend/.env

# The base URL for the backend API
VITE_API_URL=http://localhost:8000/api/
"""
    with open(env_path, 'w') as f:
        f.write(content)
    print(f"[SUCCESS] Created {env_path}.")

if __name__ == '__main__':
    print("==========================================")
    print("  Generating Environment Files (.env)     ")
    print("==========================================")
    
    # Ensure directories exist (they should, but just in case)
    os.makedirs('backend', exist_ok=True)
    os.makedirs('frontend', exist_ok=True)
    
    create_backend_env()
    create_frontend_env()
    
    print("==========================================")
    print("Environment setup complete.               ")
    print("==========================================")
