const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const fs = require("fs");
const path = require("path");
const aiHandler = require("./aiHandler");
require("dotenv").config();

// Bot start time - only process messages after this
const botStartTime = Date.now();
const allowedNumber = (process.env.TEST_ALLOWED_NUMBER || "+1 (876) 844-5789").replace(
  /\D/g,
  ""
);
const allowedName = (process.env.TEST_ALLOWED_NAME || "Carlyon").toLowerCase();

function isAllowedSender(message, displayName) {
  const senderId = message.from || "";
  const senderNumber = senderId.split("@")[0].replace(/\D/g, "");
  const normalizedName = (displayName || "").toLowerCase();
  return senderNumber === allowedNumber || normalizedName === allowedName;
}

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
client.on("message", async (message) => {
  // Filter out status broadcasts
  if (message.from === "status@broadcast") {
    return; // Ignore status updates
  }

  // Only process messages sent after bot started (ignore old/historical messages)
  const messageTime = message.timestamp * 1000; // Convert to milliseconds
  if (messageTime < botStartTime) {
    return; // Ignore old messages
  }

  // Filter out group messages - only process personal chats
  const isGroupMsg = message.from.endsWith("@g.us");
  if (isGroupMsg) {
    return; // Ignore group messages
  }

  const isFromMe = message.fromMe;
  let displayName = "Unknown";

  try {
    // For individual chats
    const chat = await message.getChat();
    displayName = chat.name || "Unknown";
  } catch (error) {
    // Fallback: extract phone number from chat ID
    displayName = message.from.split("@")[0];
  }

  // Display message with contact name
  if (isFromMe) {
    console.log(`\n📤 Message Sent by You:`);
    console.log(`To: ${displayName}`);
  } else {
    console.log(`\n📱 Message Received:`);
    console.log(`From: ${displayName}`);
  }

  console.log(`Body: ${message.body}`);
  console.log(
    `Timestamp: ${new Date(message.timestamp * 1000).toLocaleString()}`
  );
  console.log(`---\n`);

  // Process messages with AI (only for received messages)
  if (!isFromMe) {
    if (!isAllowedSender(message, displayName)) {
      return;
    }

    // Special commands
    if (message.body.toLowerCase() === "/clear") {
      aiHandler.clearHistory(message.from);
      message.reply("✅ Conversation history cleared!");
      return;
    }

    if (message.body.toLowerCase() === "/help") {
      const helpText =
        `🤖 *AI WhatsApp Assistant*\n\n` +
        `I can help you with Google Drive and Linear!\n\n` +
        `*Google Drive:*\n` +
        `• List files\n` +
        `• Search for files\n` +
        `• Create folders\n` +
        `• Get file info\n` +
        `• Share files\n` +
        `• Delete files\n\n` +
        `*Linear:*\n` +
        `• List teams and projects\n` +
        `• Create issues\n` +
        `• Read issues\n` +
        `• Update issue status\n\n` +
        `*Special commands:*\n` +
        `/help - Show this message\n` +
        `/clear - Clear conversation history\n\n` +
        `Just chat naturally, and I'll help you with Google Drive and Linear!`;
      message.reply(helpText);
      return;
    }

    // Process message with AI
    try {
      console.log(`🤖 Processing with AI...`);
      const aiResponse = await aiHandler.processMessage(
        message.from,
        message.body
      );

      if (aiResponse.success && aiResponse.message) {
        await message.reply(aiResponse.message);
        console.log(`✅ AI Response sent`);
      } else {
        await message.reply("Sorry, I couldn't process that request.");
      }
    } catch (error) {
      console.error("Error processing AI message:", error);
      await message.reply("An error occurred while processing your message.");
    }
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
