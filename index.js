import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const { VERIFY_TOKEN, WHATSAPP_TOKEN, PHONE_NUMBER_ID, PORT } = process.env;

// Webhook verification endpoint
app.get("/webhook", (req, res) => {
  console.log("🔍 Webhook verification request:", req.query);

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Webhook verified successfully");
    // Must return challenge as plain text
    return res.status(200).type("text/plain").send(challenge);
  }

  console.log("❌ Webhook verification failed");
  console.log(`Expected: ${VERIFY_TOKEN}, Got: ${token}`);
  res.sendStatus(403);
});

// Webhook to receive messages
app.post("/webhook", async (req, res) => {
  console.log("🔥 RAW WEBHOOK PAYLOAD");
  console.dir(req.body, { depth: null });

  try {
    const change = req.body.entry?.[0]?.changes?.[0];
    const value = change?.value;

    if (!value?.messages) {
      console.log("ℹ️ No messages in payload (status update or other event)");
      return res.sendStatus(200);
    }

    const message = value.messages[0];
    const from = message.from;
    const text = message.text?.body;
    const messageId = message.id;

    console.log("📩 Parsed message:");
    console.log({ from, text, messageId });

    // Only respond to "hello" messages
    if (text && text.toLowerCase().trim() === "hello") {
      console.log("✨ Responding to 'hello' message");
      await sendMessage(from, messageId, "Hello! 👋 How can I help you today?");
    } else {
      console.log("ℹ️ Message ignored (not 'hello')");
    }

    res.sendStatus(200);
  } catch (error) {
    console.error(
      "❌ Webhook handler error:",
      error.response?.data || error.message
    );
    res.sendStatus(500);
  }
});

// Function to send a message
async function sendMessage(to, replyToMessageId, body) {
  const url = `https://graph.facebook.com/v24.0/${PHONE_NUMBER_ID}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    context: {
      message_id: replyToMessageId,
    },
    type: "text",
    text: {
      preview_url: false,
      body,
    },
  };

  console.log("📤 Sending message to Meta:");
  console.dir(payload, { depth: null });

  try {
    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    console.log("✅ Message sent successfully:");
    console.dir(response.data, { depth: null });
  } catch (error) {
    console.error("❌ Failed to send message");
    console.error("Status:", error.response?.status);
    console.error("Data:", error.response?.data);
    throw error;
  }
}

app.listen(PORT || 3000, () => {
  console.log(`🚀 Server running on port ${PORT || 3000}`);
});
