import json
import os
from pathlib import Path

from playwright.sync_api import sync_playwright


def main() -> None:
    errors: list[str] = []
    checks: dict[str, bool] = {}
    screenshot_path = Path("qa-dashboard.png").resolve()
    base_url = os.environ.get("QA_BASE_URL", "http://127.0.0.1:5173")

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 1000})
        page.on("console", lambda message: errors.append(f"console:{message.type}: {message.text}") if message.type == "error" else None)
        page.on("pageerror", lambda error: errors.append(f"pageerror: {error}"))

        page.goto(base_url, wait_until="networkidle")
        checks["dashboard_heading"] = page.get_by_role("heading", name="Crowd Command Center").is_visible()
        checks["command_center_is_focused"] = page.get_by_role("heading", name="Gate events").is_visible()
        checks["simulated_badge"] = page.get_by_text("SIMULATED INPUT", exact=False).is_visible()
        checks["flowboard"] = page.get_by_role("heading", name="Live movement across monitored zones").is_visible()
        checks["arrival_event"] = page.get_by_role("button", name="Record arrivals").is_visible()
        checks["live_alerts"] = page.get_by_text("ATTENTION", exact=True).is_visible()
        page.get_by_role("button", name="Edit layout").click()
        dialog = page.get_by_role("dialog")
        checks["layout_builder_opens"] = dialog.get_by_text("Display routes", exact=True).is_visible()
        page.locator("button[aria-label='Close setup modal']").click()
        page.get_by_role("button", name="Record arrivals").click()
        checks["arrival_switches_to_observations"] = page.get_by_text("STAFF OBSERVATIONS", exact=True).is_visible()

        page.get_by_role("button", name="Forecast engine").click()
        checks["forecast_workspace_opens"] = page.get_by_role("heading", name="Scenario projection workspace").is_visible()
        page.get_by_role("button", name="15 min").click()
        checks["forecast_metrics_visible"] = page.get_by_text("Completed visitors", exact=True).is_visible()
        page.get_by_role("button", name="Special operations").click()
        checks["operations_workspace_opens"] = page.get_by_role("heading", name="Prepare and apply a simulation action").is_visible()
        page.get_by_role("button", name="Activity log").click()
        checks["activity_log_opens"] = page.get_by_role("heading", name="Activity log").is_visible()
        checks["arrival_updates_audit"] = page.get_by_text("Synthetic gate", exact=False).last.is_visible()
        page.get_by_role("button", name="Command center").click()

        page.screenshot(path=str(screenshot_path), full_page=True)
        browser.close()

    result = {"checks": checks, "console_errors": errors, "screenshot": str(screenshot_path)}
    print(json.dumps(result, indent=2))
    if not all(checks.values()) or errors:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
