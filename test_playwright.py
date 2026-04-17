import asyncio
from playwright.async_api import async_playwright
import json


async def test_generation():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Navigate to the app
        await page.goto("http://localhost:3000")
        await page.wait_for_load_state("networkidle")

        # Make the API request
        api_data = {
            "adInputType": "image_url",
            "adInputValue": "https://kl1szfmzmsf1xmat.public.blob.vercel-storage.com/ad-images/1776429367513-Gemini_Generated_Image_laeivilaeivilaei%20%281%29.png",
            "targetUrl": "https://www.doordash.com/",
        }

        response = await page.request.post("/api/generate", data=json.dumps(api_data))
        result = await response.json()

        print(f"Status: {response.status}")
        print(f"Success: {result.get('success', False)}")
        if "errors" in result:
            print(f"Errors: {result['errors']}")
        if "gcm" in result and result["gcm"]:
            print(
                f"Semantic drift score: {result['gcm'].get('semantic_drift_score', 'N/A')}"
            )

        await browser.close()


asyncio.run(test_generation())
