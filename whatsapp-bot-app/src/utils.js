// Utility functions for message handling and storage

/**
 * Format message data for storage
 */
function formatMessageForStorage(message) {
  return {
    id: message.id.id,
    from: message.from,
    author: message.author || null,
    body: message.body,
    timestamp: new Date(message.timestamp * 1000).toISOString(),
    isGroupMsg: message.isGroupMsg,
    type: message.type,
    hasMedia: message.hasMedia,
    deviceType: message.deviceType,
    isForwarded: message.isForwarded,
  };
}

/**
 * Extract phone number from chat ID
 */
function extractPhoneNumber(chatId) {
  // Chat IDs are in format: 1234567890@c.us (for individuals)
  // or 120363...@g.us (for groups)
  const phoneMatch = chatId.match(/^(\d+)@/);
  return phoneMatch ? phoneMatch[1] : null;
}

/**
 * Format phone number to international format
 */
function formatPhoneNumber(phoneNumber) {
  // Remove any non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, "");

  // Add country code if not present (assumes +1 for example)
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }

  return `+${cleaned}`;
}

/**
 * Send a message to a specific number
 */
async function sendMessageToNumber(client, phoneNumber, message) {
  try {
    const chatId = `${phoneNumber}@c.us`;
    await client.sendMessage(chatId, message);
    console.log(`✅ Message sent to ${phoneNumber}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send message to ${phoneNumber}:`, error);
    return false;
  }
}

/**
 * Get all chats for the authenticated user
 */
async function getAllChats(client) {
  try {
    const chats = await client.getChats();
    console.log(`Found ${chats.length} chats`);
    return chats;
  } catch (error) {
    console.error("❌ Failed to get chats:", error);
    return [];
  }
}

/**
 * Get messages from a specific chat by phone number
 */
async function getMessagesByPhoneNumber(client, phoneNumber, limit = 50) {
  try {
    const chatId = `${phoneNumber}@c.us`;
    const chat = await client.getChatById(chatId);

    if (!chat) {
      console.log(`⚠️  No chat found for ${phoneNumber}`);
      return [];
    }

    const messages = await chat.fetchMessages({ limit });
    console.log(`✅ Retrieved ${messages.length} messages from ${phoneNumber}`);
    return messages;
  } catch (error) {
    console.error(`❌ Failed to get messages from ${phoneNumber}:`, error);
    return [];
  }
}

/**
 * Get contact info by phone number
 */
async function getContactInfo(client, phoneNumber) {
  try {
    const contact = await client.getContactById(`${phoneNumber}@c.us`);
    return {
      name: contact.name || "Unknown",
      number: contact.number,
      pushname: contact.pushname,
      isMe: contact.isMe,
    };
  } catch (error) {
    console.error(`❌ Failed to get contact info for ${phoneNumber}:`, error);
    return null;
  }
}

module.exports = {
  formatMessageForStorage,
  extractPhoneNumber,
  formatPhoneNumber,
  sendMessageToNumber,
  getAllChats,
  getMessagesByPhoneNumber,
  getContactInfo,
};
