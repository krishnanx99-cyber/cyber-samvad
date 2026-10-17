import json
from pathlib import Path

from playwright.sync_api import sync_playwright


def main() -> None:
    errors: list[str] = []
    checks: dict[str, bool] = {}
    screenshot_path = Path("qa-dashboard.png").resolve()

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 1000})
        page.on("console", lambda message: errors.append(f"console:{message.type}: {message.text}") if message.type == "error" else None)
        page.on("pageerror", lambda error: errors.append(f"pageerror: {error}"))

        page.goto("http://127.0.0.1:4173/", wait_until="networkidle")
        checks["dashboard_heading"] = page.get_by_role("heading", name="Crowd Command Center").is_visible()
        checks["forecast"] = page.get_by_text("10-minute forecast").is_visible()
        checks["simulated_badge"] = page.get_by_text("SIMULATED DATA").is_visible()
        checks["schematic_context"] = page.get_by_text("Four-zone operational flow", exact=False).is_visible()
        checks["schematic_disclaimer"] = page.get_by_text("ROUTE GEOMETRY REQUIRES", exact=False).is_visible()

        page.locator("select").nth(0).select_option("observations")
        checks["observation_badge"] = page.get_by_text("STAFF OBSERVATIONS", exact=True).is_visible()
        page.get_by_role("button", name="Synthetic gate +10").click()
        checks["observation_audit"] = page.get_by_text("Synthetic gate", exact=False).last.is_visible()

        page.screenshot(path=str(screenshot_path), full_page=True)
        browser.close()

    result = {"checks": checks, "console_errors": errors, "screenshot": str(screenshot_path)}
    print(json.dumps(result, indent=2))
    if not all(checks.values()) or errors:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
