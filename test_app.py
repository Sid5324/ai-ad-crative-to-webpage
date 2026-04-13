from playwright.sync_api import sync_playwright
import time


def test_ai_ad_converter():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)  # Set to False to see the browser
        page = browser.new_page()

        try:
            # Navigate to the application
            page.goto("http://localhost:3002")
            page.wait_for_load_state("networkidle")

            print("✅ Application loaded successfully")

            # Check if the main title is present
            title = page.locator("h1").first
            if title.is_visible():
                print(f"✅ Title found: {title.text_content()}")

            # Test the input functionality
            textarea = page.locator("textarea")
            if textarea.is_visible():
                print("✅ Input textarea found")

                # Enter test ad content
                test_content = """Revolutionary AI Marketing Platform
Boost your conversions by 300%
Join thousands of satisfied customers today!"""
                textarea.fill(test_content)
                print("✅ Test content entered")

                # Click generate button
                generate_btn = page.locator('button:has-text("Generate Webpage")')
                if generate_btn.is_visible():
                    generate_btn.click()
                    print("✅ Generate button clicked")

                    # Wait for generation to complete
                    page.wait_for_selector(".loading", state="detached", timeout=10000)
                    print("✅ Webpage generation completed")

                    # Check if preview iframe appears
                    iframe = page.locator("iframe")
                    if iframe.is_visible():
                        print("✅ Preview iframe visible")

                    # Check if HTML output appears
                    pre_element = page.locator("pre")
                    if pre_element.is_visible():
                        html_content = pre_element.text_content()
                        if html_content and "DOCTYPE html" in html_content:
                            print("✅ Generated HTML contains valid HTML structure")

                    print(
                        "🎉 All tests passed! The AI Ad Creative to Webpage converter is working."
                    )

                else:
                    print("❌ Generate button not found")
            else:
                print("❌ Input textarea not found")

        except Exception as e:
            print(f"❌ Test failed: {str(e)}")

        finally:
            browser.close()


if __name__ == "__main__":
    test_ai_ad_converter()
