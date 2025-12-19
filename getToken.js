const { google } = require("googleapis");
const http = require("http");
const url = require("url");
require("dotenv").config();

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/oauth2callback";

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const scopes = ["https://www.googleapis.com/auth/drive"];

const authorizeUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  scope: scopes,
});

console.log("\n=== GOOGLE DRIVE AUTHORIZATION ===");
console.log("\nCopy and paste this URL in your browser:\n");
console.log(authorizeUrl);
console.log("\n==================================\n");

const server = http
  .createServer(async (req, res) => {
    if (req.url.indexOf("/oauth2callback") > -1) {
      const qs = new url.URL(req.url, "http://localhost:3000").searchParams;
      const code = qs.get("code");

      res.end("Authentication successful! Check your terminal.");

      const { tokens } = await oauth2Client.getToken(code);
      console.log("\n\n=== SAVE THIS REFRESH TOKEN ===");
      console.log(tokens.refresh_token);
      console.log("================================\n");

      server.close();
      process.exit(0);
    }
  })
  .listen(3000, async () => {
    console.log("Waiting for authorization...\n");
    // Try to open browser automatically using dynamic import
    try {
      const open = (await import("open")).default;
      await open(authorizeUrl);
    } catch (err) {
      // If auto-open fails, user can copy the URL manually (already printed above)
    }
  });
