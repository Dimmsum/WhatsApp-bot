# WhatsApp Bot with whatsapp-web-js

A WhatsApp bot built with whatsapp-web-js and Puppeteer that connects to your WhatsApp account via phone number authentication.

## Features

- ✅ QR code-based authentication
- ✅ Real-time message listening
- ✅ Message acknowledgment tracking
- ✅ Auto-reply capabilities
- ✅ Retrieve messages by phone number
- ✅ Get contact information
- ✅ Send messages to specific numbers
- 🔄 (Future) Message storage to database

## Prerequisites

- Node.js 14+ installed
- macOS, Linux, or Windows
- Active WhatsApp account on your phone

## Installation

1. Install dependencies:

```bash
npm install
```

2. Run the bot:

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

## How It Works

1. **Authentication**: When you start the bot, a QR code will be displayed in your terminal
2. **Scan QR Code**: Open WhatsApp on your phone → Settings → Linked Devices → Link a Device → Scan the QR code
3. **Connection**: Once scanned, the bot will authenticate and connect to your WhatsApp account
4. **Message Listening**: The bot will start listening for incoming messages

## Project Structure

```
whatsapp-bot/
├── src/
│   ├── index.js          # Main bot file
│   ├── utils.js          # Utility functions
│   └── messageHandler.js # (Future) Message handling
├── .wwebjs_cache/        # WhatsApp session cache
├── package.json
└── README.md
```

## Usage Examples

### Listen for messages (already in index.js)

```javascript
client.on("message", (message) => {
  console.log(`New message from ${message.from}: ${message.body}`);
});
```

### Send a message to a specific number

```javascript
const { sendMessageToNumber } = require("./src/utils");

// Send message to a phone number
await sendMessageToNumber(client, "1234567890", "Hello from bot!");
```

### Get messages from a specific contact

```javascript
const { getMessagesByPhoneNumber } = require("./src/utils");

// Retrieve last 50 messages from a contact
const messages = await getMessagesByPhoneNumber(client, "1234567890", 50);
messages.forEach((msg) => {
  console.log(`${msg.from}: ${msg.body}`);
});
```

### Get contact information

```javascript
const { getContactInfo } = require("./src/utils");

const contact = await getContactInfo(client, "1234567890");
console.log(`Contact name: ${contact.name}`);
```

## Important Notes

- The bot uses `LocalAuth` strategy which stores session data in `.wwebjs_cache/` directory
- Session data persists, so you only need to scan the QR code once
- Do not scan the QR code multiple times or it may cause authentication issues
- Keep your bot running to receive real-time messages
- The `headless: true` option runs Puppeteer in headless mode (no visible browser window)

## Environment Variables (Optional)

You can add a `.env` file for configuration:

```
BOT_ID=default-client
HEADLESS=true
```

## Troubleshooting

### QR Code not appearing?

- Make sure your terminal supports QR code display
- Try updating whatsapp-web.js: `npm install whatsapp-web.js@latest`

### Connection drops?

- The bot will automatically try to reconnect
- Check your internet connection
- Make sure your phone has active WhatsApp

### Session expired?

- Delete the `.wwebjs_cache` folder and scan the QR code again
- Make sure to keep the bot running to maintain the session

## Future Enhancements

- [ ] Database storage (MongoDB/SQLite)
- [ ] Message filtering and search
- [ ] Group chat support
- [ ] Media file handling
- [ ] Command processing system
- [ ] API endpoint for external integrations

## License

ISC
