from playwright.sync_api import sync_playwright
import time


def test_deployed_vision_api():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            print("Navigating to deployed app...")
            page.goto("https://ai-ad-creative-five.vercel.app")
            page.wait_for_load_state("networkidle")

            print("Page loaded. Switching to image upload mode...")

            # Click on "Ad Image" tab
            image_tab = page.locator('button:has-text("Ad Image")').first
            if image_tab.is_visible():
                image_tab.click()
                time.sleep(1)  # Wait for UI update
                print("[OK] Switched to image upload mode")

                # Check if upload area is visible
                upload_area = page.locator('label[for="image-upload"]').first
                if upload_area.is_visible():
                    print("[OK] Upload area is visible")

                    # Fill target URL
                    url_input = page.locator('input[type="url"]').first
                    url_input.fill("https://example.com")
                    print("[OK] Filled target URL")

                    # Try to upload a small test image
                    # For testing, we'll create a simple 1x1 pixel image
                    import base64

                    # Small transparent PNG (1x1 pixel)
                    test_image_data = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
                    test_image_bytes = base64.b64decode(test_image_data)

                    # Write to temp file
                    with open("test_image.png", "wb") as f:
                        f.write(test_image_bytes)

                    # Upload the image
                    file_input = page.locator('input[type="file"]').first
                    file_input.set_input_files("test_image.png")
                    print("[OK] Uploaded test image")

                    # Check why generate button is disabled
                    generate_btn = page.locator(
                        'button:has-text("Generate Landing Page")'
                    ).first
                    if generate_btn.is_enabled():
                        generate_btn.click()
                        print("[OK] Clicked generate button")

                        # Wait for response
                        time.sleep(5)

                        # Check for success or error
                        success_indicator = page.locator(
                            "text=/success|Success|generated|Generated/i"
                        ).first
                        error_indicator = page.locator(
                            "text=/error|Error|failed|Failed/i"
                        ).first

                        if success_indicator.is_visible():
                            print(
                                "[SUCCESS] Vision API is working! Landing page generated successfully."
                            )
                            return True
                        elif error_indicator.is_visible():
                            error_text = error_indicator.text_content()
                            print(f"[ERROR] Vision API failed: {error_text}")
                            return False
                        else:
                            print("[UNKNOWN] No clear success or error message found")
                            return False
                    else:
                        print("[ERROR] Generate button is disabled")
                        # Check form validation
                        try:
                            file_input = page.locator('input[type="file"]').first
                            ad_input_value = (
                                file_input.input_value
                                if file_input.is_visible()
                                else ""
                            )
                            target_url_value = page.locator(
                                'input[type="url"]'
                            ).first.input_value
                            print(f"  File input has value: {bool(ad_input_value)}")
                            print(f"  URL input has value: {bool(target_url_value)}")

                            # Check if image preview appeared
                            preview_img = page.locator("img").first
                            if preview_img.is_visible():
                                print("  Image preview is visible")
                            else:
                                print("  Image preview is not visible")
                        except:
                            print("  Could not check form validation details")

                        return False
                else:
                    print("[ERROR] Upload area not visible")
                    return False
            else:
                print("[ERROR] Ad Image tab not found")
                return False

        except Exception as e:
            print(f"[ERROR] Test failed: {e}")
            return False

        finally:
            browser.close()


if __name__ == "__main__":
    result = test_deployed_vision_api()
    if result:
        print(
            "\n[SUCCESS] CONCLUSION: The Gemini Vision API is WORKING in the deployed app!"
        )
    else:
        print(
            "\n[FAILED] CONCLUSION: The Gemini Vision API is NOT working in the deployed app."
        )
