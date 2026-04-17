import requests
import json

# Test the generation API
url = "http://localhost:3000/api/generate"
data = {
    "adInputType": "image_url",
    "adInputValue": "https://kl1szfmzmsf1xmat.public.blob.vercel-storage.com/ad-images/1776429367513-Gemini_Generated_Image_laeivilaeivilaei%20%281%29.png",
    "targetUrl": "https://www.doordash.com/",
}

print("Testing generation API...")
response = requests.post(url, json=data)

print(f"Status Code: {response.status_code}")
if response.status_code == 200:
    result = response.json()
    print("Success:", result.get("success"))
    if result.get("errors"):
        print("Errors:", result.get("errors"))
    if result.get("gcm"):
        print("Semantic drift score:", result["gcm"].get("semantic_drift_score"))
else:
    print("Response:", response.text)
