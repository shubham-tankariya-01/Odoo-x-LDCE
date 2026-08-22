import os
import traceback
from pathlib import Path
from dotenv import load_dotenv
import cloudinary
import cloudinary.uploader
import cloudinary.api

# Load backend/.env
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME", "").strip().strip('"').strip("'")
api_key = os.getenv("CLOUDINARY_API_KEY", "").strip().strip('"').strip("'")
api_secret = os.getenv("CLOUDINARY_API_SECRET", "").strip().strip('"').strip("'")

print("\n--- Testing Cloudinary Connection ---")
print(f"Cloud Name: {cloud_name}")
print(f"API Key:    {api_key}")
print(f"Secret:     {'*' * len(api_secret) if api_secret else 'MISSING'}")

cloudinary.config(
    cloud_name=cloud_name,
    api_key=api_key,
    api_secret=api_secret,
    secure=True,
)

# 1. Test API Ping (tests authentication with Cloudinary)
print("\n[1] Testing API Credentials (ping)...")
try:
    ping_res = cloudinary.api.ping()
    print("✅ Cloudinary Ping Successful:", ping_res)
except Exception as e:
    print("❌ Cloudinary Ping Failed:", e)

# 2. Test Image Upload via standard Data URI (1x1 red pixel)
print("\n[2] Testing Image Upload...")
try:
    test_image_data_uri = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
    upload_res = cloudinary.uploader.upload(
        test_image_data_uri,
        folder="globetrotter/test",
        public_id="ping_test",
        overwrite=True,
    )
    print("✅ Cloudinary Upload Successful!")
    print("Uploaded URL:", upload_res.get("secure_url"))
except Exception as e:
    print("❌ Cloudinary Upload Failed:")
    traceback.print_exc()

print()
