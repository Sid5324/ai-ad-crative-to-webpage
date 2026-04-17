import requests
import json

# Test the deployed generation API
url = "https://ai-ad-creative-five.vercel.app/api/generate"
data = {
    "adInputType": "image_url",
    "adInputValue": "https://kl1szfmzmsf1xmat.public.blob.vercel-storage.com/ad-images/1776429367513-Gemini_Generated_Image_laeivilaeivilaei%20%281%29.png",
    "targetUrl": "https://www.doordash.com/",
}

print("Testing deployed generation API...")
try:
    headers = {"Content-Type": "application/json", "Accept": "application/json"}
    response = requests.post(url, json=data, headers=headers, timeout=120)

    print(f"Status Code: {response.status_code}")
    print(f"Content-Type: {response.headers.get('Content-Type', 'unknown')}")

    if response.status_code == 200:
        try:
            result = response.json()
            print("Success:", result.get("success"))
            if result.get("errors"):
                print("Errors:", result.get("errors"))
            if result.get("gcm"):
                print(
                    "Semantic drift score:", result["gcm"].get("semantic_drift_score")
                )
                print("QA gate status:", result["gcm"].get("qa_gate_status"))
                print("Agent trace length:", len(result["gcm"].get("agent_trace", [])))
        except json.JSONDecodeError as e:
            print("JSON decode error:", e)
            # Try to parse partial JSON
            import re

            success_match = re.search(r'"success":\s*(true|false)', response.text)
            if success_match:
                print("Success from regex:", success_match.group(1))
            drift_match = re.search(
                r'"semantic_drift_score":\s*([\d.]+)', response.text
            )
            if drift_match:
                print("Semantic drift score from regex:", drift_match.group(1))
    else:
        # Look for error details
        try:
            # Save response to file for inspection
            with open("response_debug.json", "wb") as f:
                f.write(response.content)
            print("Saved response to response_debug.json")

            response_text = response.content.decode("utf-8", errors="replace")
            print("Response preview (with replaced chars):")
            print(response_text[:2000])
        except Exception as e:
            print("Could not decode response:", e)
            print("Raw content length:", len(response.content))

        if "SEMANTIC_DRIFT" in response_text:
            print("Found SEMANTIC_DRIFT error in response")
            # Extract the semantic drift score
            import re

            score_match = re.search(r"(\d+\.\d+)", response_text)
            if score_match:
                print("Semantic drift score:", score_match.group(1))
        elif "success" in response_text:
            print("Response contains success field")
        else:
            print("Response preview:", response_text[:1000])
except Exception as e:
    print("Error:", e)
