import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const {
  VERIFY_TOKEN,
  WHATSAPP_TOKEN,
  PHONE_NUMBER_ID,
  PORT = 3000,
} = process.env;

/**
 * ----------------------------------------------------
 * 1. Webhook Verification (Meta requirement)
 * ----------------------------------------------------
 */
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Webhook verified successfully");
    return res.status(200).send(challenge);
  }

  console.log("❌ Webhook verification failed");
  res.sendStatus(403);
});

/**
 * ----------------------------------------------------
 * 2. Receive WhatsApp Messages
 * ----------------------------------------------------
 */
app.post("/webhook", async (req, res) => {
  try {
    const entry = req.body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];

    // If no message, acknowledge webhook
    if (!message) {
      return res.sendStatus(200);
    }

    const from = message.from; // User phone number
    const messageType = message.type;

    // Only respond to text messages
    if (messageType !== "text") {
      console.log("ℹ️ Non-text message received");
      return res.sendStatus(200);
    }

    const text = message.text.body;

    console.log(`📩 Message from ${from}:`, text);

    // Reply to the same user
    await sendMessage(from, `👋 Hey! You said: "${text}"`);

    res.sendStatus(200);
  } catch (error) {
    console.error("❌ Webhook error:", error.response?.data || error.message);
    res.sendStatus(500);
  }
});

/**
 * ----------------------------------------------------
 * 3. Send Message Helper
 * ----------------------------------------------------
 */
async function sendMessage(to, body) {
  const url = `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`;

  await axios.post(
    url,
    {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body },
    },
    {
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  );

  console.log("✅ Reply sent to", to);
}

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
