import { chromium } from "playwright";

async function run() {
  console.log("Launching browser in visible mode...");
  // Launch in non-headless mode so the user can see it
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log("Navigating to localhost:3000...");
    await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
    
    // Wait a bit for the user to see the homepage
    await page.waitForTimeout(3000);
    
    // Check if there is a login link and click it
    const loginButton = page.locator('text="Giriş Yap"');
    if (await loginButton.isVisible()) {
        console.log("Clicking Login...");
        await loginButton.click();
        await page.waitForTimeout(3000);
    } else {
        await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
        await page.waitForTimeout(3000);
    }
    
    // Check register
    const registerLink = page.locator('text="Kayıt Ol"');
    if (await registerLink.isVisible()) {
        console.log("Clicking Register...");
        await registerLink.click();
        await page.waitForTimeout(3000);
    } else {
        await page.goto("http://localhost:3000/register", { waitUntil: "networkidle" });
        await page.waitForTimeout(3000);
    }

    console.log("Navigation complete. Browser will close in 5 seconds...");
    await page.waitForTimeout(5000);
  } catch (err) {
    console.error("Error during playwright run:", err);
  } finally {
    await browser.close();
  }
}

run();
