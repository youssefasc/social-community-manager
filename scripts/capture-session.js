/**
 * Manual session capture helper for Connected Accounts.
 *
 * Run: node scripts/capture-session.js <platform-login-url>
 *
 * Opens a real, visible Chromium window so YOU log in by hand (including
 * any 2FA/captcha the platform requires). Once you're logged in and see
 * your account's home/feed, press Enter in this terminal — the script
 * then saves Playwright's `storageState` (cookies + local storage) to
 * ./session-output.json.
 *
 * Upload that file to the private "sessions" Supabase Storage bucket
 * under `${your_user_id}/${account_id}.json` and set the matching
 * `connected_accounts.storage_state_ref` to that path. The app will
 * reuse this session to publish content you schedule — it never
 * automates the login step itself.
 */
const { chromium } = require("playwright");
const readline = require("readline");

async function main() {
  const url = process.argv[2];
  if (!url) {
    console.error("Usage: node scripts/capture-session.js <login-url>");
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(url);

  console.log("Log in manually in the opened browser window.");
  console.log("Once you're fully logged in, press Enter here to save the session...");

  await new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question("", () => {
      rl.close();
      resolve();
    });
  });

  await context.storageState({ path: "session-output.json" });
  console.log("Saved session-output.json — upload this to the 'sessions' storage bucket.");

  await browser.close();
}

main();
