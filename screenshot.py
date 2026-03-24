from playwright.sync_api import sync_playwright
import os

url = "file:///var/lib/freelancer/projects/40322125/demo/index.html"
out_dir = "/var/lib/freelancer/projects/40322125/demo/screenshots"
os.makedirs(out_dir, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    page.set_viewport_size({"width": 1280, "height": 720})
    page.goto(url, wait_until="networkidle")
    page.wait_for_timeout(1000)

    # Hero section
    page.screenshot(path=f"{out_dir}/01-hero.png")

    # Scroll to About
    page.evaluate("document.getElementById('about').scrollIntoView()")
    page.wait_for_timeout(500)
    page.screenshot(path=f"{out_dir}/02-about.png")

    # Scroll to How it works
    page.evaluate("document.querySelector('.how').scrollIntoView()")
    page.wait_for_timeout(500)
    page.screenshot(path=f"{out_dir}/03-how.png")

    # Scroll to Classes
    page.evaluate("document.getElementById('classes').scrollIntoView()")
    page.wait_for_timeout(500)
    page.screenshot(path=f"{out_dir}/04-calendar.png")

    # Click a weekend day with class
    weekend_days = page.query_selector_all('.cal-day.has-class')
    if weekend_days:
        weekend_days[0].click()
        page.wait_for_timeout(600)
        page.screenshot(path=f"{out_dir}/05-slots.png")

        # Click first available slot
        slots = page.query_selector_all('.slot-card:not(.full)')
        if slots:
            slots[0].click()
            page.wait_for_timeout(600)
            page.evaluate("document.getElementById('bookingForm').scrollIntoView()")
            page.wait_for_timeout(300)
            page.screenshot(path=f"{out_dir}/06-booking-form.png")

            # Fill form and submit
            page.fill('#fname', 'Jane')
            page.fill('#lname', 'Doe')
            page.fill('#email', 'jane@example.com')
            page.fill('#phone', '(555) 123-4567')
            page.check('#waiver')
            page.fill('.card-input__number', '4242 4242 4242 4242')
            page.fill('.card-input__exp', '12/27')
            page.fill('.card-input__cvc', '123')
            page.screenshot(path=f"{out_dir}/07-form-filled.png")

            page.click('button[type="submit"]')
            page.wait_for_timeout(500)
            page.screenshot(path=f"{out_dir}/08-success.png")

    # FAQ
    page.evaluate("closeModal()")
    page.wait_for_timeout(300)
    page.evaluate("document.getElementById('faq').scrollIntoView()")
    page.wait_for_timeout(500)
    page.screenshot(path=f"{out_dir}/09-faq.png")

    # Contact
    page.evaluate("document.getElementById('contact').scrollIntoView()")
    page.wait_for_timeout(500)
    page.screenshot(path=f"{out_dir}/10-contact.png")

    # Mobile view
    page.set_viewport_size({"width": 390, "height": 844})
    page.goto(url, wait_until="networkidle")
    page.wait_for_timeout(1000)
    page.screenshot(path=f"{out_dir}/11-mobile-hero.png")

    page.evaluate("document.getElementById('classes').scrollIntoView()")
    page.wait_for_timeout(500)
    page.screenshot(path=f"{out_dir}/12-mobile-calendar.png")

    browser.close()
    print("Screenshots saved!")
