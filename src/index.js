const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const fs = require("fs");
const path = require("path");

// Initialize the WhatsApp client
const client = new Client({
  authStrategy: new LocalAuth({
    clientId: "default-client",
  }),
  puppeteer: {
    headless: true,
    timeout: 60000, // Increased timeout to 60 seconds
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--disable-software-rasterizer",
      "--disable-extensions",
      "--disable-default-apps",
    ],
  },
});

// QR Code generation for authentication
client.on("qr", (qr) => {
  console.log("\n=== SCAN THIS QR CODE WITH YOUR PHONE ===\n");
  qrcode.generate(qr, { small: true });
  console.log("\n=========================================\n");
});

// Client is ready
client.on("ready", () => {
  console.log("✅ WhatsApp Bot is ready!");
  console.log("Client is ready. Listening for messages...\n");
});

// Message received
client.on("message", (message) => {
  console.log(`\n📱 New Message:`);
  console.log(`From: ${message.from}`);
  console.log(`Author: ${message.author || "N/A"}`);
  console.log(`Body: ${message.body}`);
  console.log(
    `Timestamp: ${new Date(message.timestamp * 1000).toLocaleString()}`
  );
  console.log(`---\n`);

  // Example: Auto-reply to specific keywords
  if (message.body.toLowerCase() === "hello") {
    message.reply("Hello! I am a WhatsApp bot. How can I help you?");
  }

  if (message.body.toLowerCase() === "ping") {
    message.reply("Pong! 🏓");
  }
});

// Message acknowledged
client.on("message_ack", (message, ack) => {
  /*
    === ACK VALUES ===
    ACK_ERROR: -1
    ACK_PENDING: 0
    ACK_SERVER: 1
    ACK_DEVICE: 2
    ACK_READ: 3
    ACK_PLAYED: 4
  */
  if (ack === 3) {
    console.log(`✓ Message read: ${message.body}`);
  }
});

// Client authenticated
client.on("authenticated", () => {
  console.log("✅ Authentication successful!");
});

// Authentication failure
client.on("auth_failure", (msg) => {
  console.error("❌ Authentication failed:", msg);
  process.exit(1);
});

// Client disconnected
client.on("disconnected", (reason) => {
  console.log("⚠️  Client disconnected:", reason);
  process.exit(1);
});

// Error handling
client.on("error", (error) => {
  console.error("❌ Client error:", error);
});

// Initialize the client
client.initialize();

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n\nShutting down gracefully...");
  await client.destroy();
  process.exit(0);
});

module.exports = client;
