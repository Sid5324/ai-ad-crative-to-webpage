from playwright.sync_api import sync_playwright


def test_vision_api():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            print("Navigating to deployed app...")
            page.goto("https://skill-deploy-nlax2jalt4-agent-skill-vercel.vercel.app")
            page.wait_for_load_state("networkidle")

            print("Page loaded. Checking if app is working...")

            # Check if the page has the expected content
            title = page.title()
            print(f"Page title: {title}")

            # Look for the input form
            forms = page.locator("form").all()
            print(f"Found {len(forms)} forms on the page")

            input_form = page.locator("form").first
            if input_form.is_visible():
                print("[OK] Input form found - app is loading")
                # Print form HTML
                form_html = input_form.inner_html()
                print(f"Form content: {form_html[:200]}...")
            else:
                print("[ERROR] Input form not found")

            # Look for input fields
            inputs = page.locator("input").all()
            print(f"Found {len(inputs)} input fields")
            for i, inp in enumerate(inputs):
                input_type = inp.get_attribute("type")
                print(f"  Input {i + 1}: type='{input_type}'")

            # Try to find error messages or check console
            console_messages = []

            def log_console(msg):
                console_messages.append(f"{msg.type}: {msg.text}")
                print(f"[CONSOLE] {msg.type}: {msg.text}")

            page.on("console", log_console)

            # Check for any error text on the page
            error_text = page.locator(
                "text=/error|Error|failed|Failed/i"
            ).all_text_contents()
            if error_text:
                print(f"[ERROR] Found error messages: {error_text}")
            else:
                print("[OK] No error messages visible")

            # Take a screenshot for inspection
            page.screenshot(path="deployed_app_screenshot.png")
            print("[SCREENSHOT] Screenshot saved as deployed_app_screenshot.png")

            print("\n[TEST] Testing vision API functionality...")
            print(
                "Note: Vision API requires GOOGLE_GENERATIVE_AI_API_KEY to be configured"
            )
            print("Since API keys are empty, the vision analysis will fail")

            # Check if we can switch to image upload mode
            image_tab = page.locator('button:has-text("Ad Image")').first
            if image_tab.is_visible():
                print(
                    "[TAB] Found Ad Image tab - clicking to switch to image upload mode"
                )
                image_tab.click()
                page.wait_for_timeout(1000)  # Wait for UI to update

                # Check which tab is now active
                active_tab = page.locator(
                    'button[style*="background: rgb(39, 39, 42)"]'
                ).first
                if active_tab.is_visible():
                    try:
                        active_text = active_tab.text_content()
                        print(f"[TAB] Active tab after click: {active_text}")
                    except:
                        print("[TAB] Active tab found but couldn't read text")

                # Now check for file upload
                file_input = page.locator('input[type="file"]').first
                if file_input.is_visible():
                    print("[UPLOAD] File upload input now visible")
                    print(
                        "Note: Would upload an image here, but API keys are missing so vision API will fail"
                    )
                else:
                    print("[UPLOAD] File upload input still not visible")
                    # Check if there's a file upload area
                    upload_area = page.locator('div[style*="dashed"]').first
                    if upload_area.is_visible():
                        print("[UPLOAD] Found dashed border upload area")
                        try:
                            upload_text = upload_area.text_content()
                            print(f"[UPLOAD] Upload area text: {upload_text[:100]}...")
                        except:
                            print("[UPLOAD] Upload area found but couldn't read text")
                    else:
                        print("[UPLOAD] No upload area found")

            # Check for URL input
            url_input = page.locator('input[type="url"]').first
            if url_input.is_visible():
                print("[URL] Target URL input found")
                # Try to fill it
                url_input.fill("https://example.com")
                print("[URL] Filled target URL with example.com")
            else:
                print("[URL] Target URL input not found")

            # Check for generate button
            generate_btn = page.locator(
                'button:has-text("Generate Landing Page")'
            ).first
            if generate_btn.is_visible():
                print("[GENERATE] Generate button found")
                print(
                    "Note: Would click generate here, but without API keys, it will fail"
                )
            else:
                print("[GENERATE] Generate button not found")

        except Exception as e:
            print(f"[ERROR] Error testing app: {e}")

        finally:
            browser.close()


if __name__ == "__main__":
    test_vision_api()
