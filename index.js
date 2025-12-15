import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const { VERIFY_TOKEN, WHATSAPP_TOKEN, PHONE_NUMBER_ID, PORT } = process.env;

console.log("🔧 ENV CHECK");
console.log({
  HAS_VERIFY_TOKEN: !!VERIFY_TOKEN,
  HAS_WHATSAPP_TOKEN: !!WHATSAPP_TOKEN,
  PHONE_NUMBER_ID,
  PORT,
});

/**
 * ----------------------------------------------------
 * 1. Webhook Verification (Meta requirement)
 * ----------------------------------------------------
 */
app.get("/webhook", (req, res) => {
  console.log("🔍 Webhook verification request:", req.query);

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
  console.log("🔥 RAW WEBHOOK PAYLOAD");
  console.dir(req.body, { depth: null });

  try {
    const change = req.body.entry?.[0]?.changes?.[0];
    const value = change?.value;

    if (!value?.messages) {
      console.log("ℹ️ No messages in payload (status update)");
      return res.sendStatus(200);
    }

    const message = value.messages[0];

    const from = message.from;
    const text = message.text?.body;
    const messageId = message.id;

    console.log("📩 Parsed message:");
    console.log({ from, text, messageId });

    await sendMessage(from, messageId, `You said: "${text}"`);

    res.sendStatus(200);
  } catch (error) {
    console.error("❌ Webhook handler error");
    console.error(error.response?.data || error.message);
    res.sendStatus(500);
  }
});

/**
 * ----------------------------------------------------
 * 3. Send Message Helper (FIXED + LOGGED)
 * ----------------------------------------------------
 */
async function sendMessage(to, messageId, body) {
  const url = `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    context: {
      message_id: messageId,
    },
    type: "text",
    text: {
      preview_url: false,
      body,
    },
  };

  console.log("📤 Sending payload to Meta:");
  console.dir(payload, { depth: null });

  try {
    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    console.log("✅ Meta send success:");
    console.dir(response.data, { depth: null });
  } catch (error) {
    console.error("❌ Meta send FAILED");
    console.error("Status:", error.response?.status);
    console.error("Data:", error.response?.data);
    throw error;
  }
}

app.listen(PORT || 3000, () => {
  console.log(`🚀 Server running on port ${PORT || 3000}`);
});
