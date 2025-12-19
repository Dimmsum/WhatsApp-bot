# WhatsApp Bot with AI & Google Drive Integration

An intelligent WhatsApp bot that connects to your WhatsApp account and uses Google's Gemini AI to process messages and perform Google Drive operations through natural language commands.

## 🚀 Features

- **WhatsApp Integration**: Connect via QR code using whatsapp-web.js
- **AI-Powered Responses**: Uses Google Gemini for intelligent conversation
- **Google Drive Functions**: List, search, create, share, and delete files
- **Function Calling**: AI automatically calls appropriate Drive functions
- **Message Filtering**: Only processes recent personal chats (ignores old messages and groups)
- **Session Persistence**: Stores WhatsApp session to avoid repeated QR scans
- **Conversation Context**: Maintains chat history per user

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js** 14 or higher ([Download](https://nodejs.org/))
- **Active WhatsApp Account** on your phone
- **Google Gemini API Key** ([Get one free](https://aistudio.google.com/app/apikey))
- **Google Cloud Project** with Drive API enabled (optional, for Drive features)

## 🛠️ Developer Setup

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd whatsapp-bot
npm install
```

### 2. Configure Environment Variables

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Required: Get from https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Only needed for Google Drive features
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/oauth2callback
GOOGLE_REFRESH_TOKEN=your_refresh_token

# Bot Configuration
ALLOWED_PHONE_NUMBER=your_phone_number  # Optional: restrict to specific number
AI_MODEL=gemini-2.0-flash-exp
AI_SYSTEM_PROMPT=You are a helpful WhatsApp assistant that can interact with Google Drive.
```

### 3. Get Google Drive Credentials (Optional)

If you want Google Drive integration:

**A. Create Google Cloud Project:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google Drive API

**B. Create OAuth Credentials:**
1. Go to APIs & Services → Credentials
2. Create OAuth 2.0 Client ID (Web application)
3. Add redirect URI: `http://localhost:3000/oauth2callback`
4. Copy Client ID and Client Secret to `.env`

**C. Get Refresh Token:**
```bash
node getToken.js
```
- Browser will open for authorization
- Copy the refresh token displayed in terminal
- Add it to your `.env` file

Full instructions: [GOOGLE_DRIVE_SETUP.md](GOOGLE_DRIVE_SETUP.md)

### 4. Start the Bot

```bash
npm start
```

**First Run:**
1. QR code appears in terminal
2. Open WhatsApp on phone → Settings → Linked Devices → Link a Device
3. Scan the QR code
4. Bot connects and starts listening

**Subsequent Runs:**
- No QR code needed (session persisted in `.wwebjs_cache/`)

## 📁 Project Structure

```
whatsapp-bot/
├── src/
│   ├── index.js         # Main bot logic & WhatsApp client
│   ├── aiHandler.js     # Gemini AI integration & function calling
│   ├── googleDrive.js   # Google Drive API functions
│   └── utils.js         # Utility functions (deprecated)
├── .wwebjs_cache/       # WhatsApp session data (auto-generated)
├── .env                 # Your credentials (DO NOT COMMIT)
├── .env.example         # Template for credentials
├── .gitignore           # Excludes secrets from git
├── getToken.js          # Script to generate Google refresh token
├── package.json         # Dependencies
└── README.md            # This file
```

## 🔧 Development

### Running with Auto-Reload

```bash
npm run dev
```

Uses `nodemon` to restart on file changes.

### Key Configuration Options

**Message Filtering** (`src/index.js`):
- `botStartTime`: Ignores messages sent before bot started
- Group messages are filtered out automatically
- Status broadcasts are ignored

**AI Model** (`.env`):
- `gemini-2.0-flash-exp`: Fastest, experimental features
- `gemini-1.5-flash`: Stable, fast responses
- `gemini-1.5-pro`: Most capable, slower

### Testing the Bot

Send a message to yourself or any WhatsApp contact:

**Basic Commands:**
- `Hello` - Simple greeting
- `/help` - Show available commands
- `/clear` - Clear conversation history

**Google Drive Commands:**
- "List my files"
- "Search for tax documents"
- "Create a folder called Projects"
- "Share file <fileId> with email@example.com"

## 🏗️ Architecture

### Message Flow

```
WhatsApp Message → index.js (filters) → aiHandler.js (Gemini) → googleDrive.js (if needed) → Response
```

1. **index.js**: Receives WhatsApp messages, filters groups/old messages
2. **aiHandler.js**: Sends to Gemini, handles function calling
3. **googleDrive.js**: Executes Drive operations
4. **Response**: AI formats results, sends back to WhatsApp

### Adding New Drive Functions

Edit `src/googleDrive.js`:

```javascript
async function yourNewFunction(param1, param2) {
  try {
    const drive = getGoogleDriveClient();
    // Your Drive API logic here
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = { ...existing, yourNewFunction };
```

Edit `src/aiHandler.js`:

```javascript
// Add to availableFunctions
const availableFunctions = {
  // ...existing functions
  your_new_function: googleDrive.yourNewFunction,
};

// Add to functionDeclarations
{
  name: "your_new_function",
  description: "What this function does",
  parameters: {
    type: "object",
    properties: {
      param1: { type: "string", description: "Description" },
    },
    required: ["param1"],
  },
}
```

## 🐛 Troubleshooting

### QR Code Not Appearing
```bash
# Clear session and restart
rm -rf .wwebjs_cache
npm start
```

### "Quota Exceeded" Error
- You're using an OpenAI key instead of Gemini
- Update `.env` with `GEMINI_API_KEY`

### "Model Overloaded" Error
- Gemini's free tier is busy
- Wait a few seconds and try again
- Or switch to `gemini-1.5-flash` in `.env`

### Bot Not Responding
- Check console for errors
- Verify `.env` has correct `GEMINI_API_KEY`
- Ensure messages are from personal chats (not groups)
- Check bot is still connected to WhatsApp

### Google Drive Functions Failing
- Verify refresh token in `.env`
- Refresh token might be expired - run `node getToken.js` again
- Check Google Cloud Console for API limits

## 🔒 Security Best Practices

1. **Never commit `.env`** - Already in `.gitignore`
2. **Rotate API keys** if accidentally exposed
3. **Use environment-specific credentials** for dev/prod
4. **Limit OAuth scopes** to only what you need
5. **Review Google Drive permissions** regularly

## 📚 Additional Resources

- [Gemini API Docs](https://ai.google.dev/docs)
- [whatsapp-web.js Guide](https://wwebjs.dev/)
- [Google Drive API Reference](https://developers.google.com/drive/api/v3/reference)
- [Usage Examples](USAGE_EXAMPLES.md)
- [Google Drive Setup Guide](GOOGLE_DRIVE_SETUP.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m "Add your feature"`
4. Push to branch: `git push origin feature/your-feature`
5. Submit a pull request

## 📝 Development Workflow

### Making Changes

1. **Edit code** in `src/` directory
2. **Test locally** with `npm start`
3. **Check for errors** in console
4. **Test with real WhatsApp messages**
5. **Commit with clear messages**

### Before Pushing to GitHub

**Remove secrets from commits:**
```bash
# Check what will be committed
git status

# Never commit .env file (already in .gitignore)
# If you accidentally added secrets, reset:
git reset HEAD~1
```

### Git Best Practices

- Never commit `.env` (already in `.gitignore`)
- Use placeholder values in `.env.example`
- Clear commit messages: `"Add feature X"` not `"changes"`
- Test before pushing

## 🚀 Deployment

### Hosting Options

**Local Development:**
- Run on your machine: `npm start`
- Keep terminal open

**Cloud Hosting:**
- **Heroku**: Use Heroku Buildpacks for Puppeteer
- **Railway**: Simple deployment with environment variables
- **DigitalOcean**: Deploy on a droplet
- **VPS**: Any Linux server with Node.js

### Deployment Considerations

- WhatsApp session expires if bot is offline for 14+ days
- Use process managers like `pm2` for auto-restart
- Set up logging for production
- Monitor API usage limits (Gemini, Google Drive)

## 📊 Roadmap

- [ ] Database storage for messages (MongoDB/PostgreSQL)
- [ ] Web dashboard for management
- [ ] Multi-user support
- [ ] More Google Workspace integrations (Gmail, Calendar, Docs)
- [ ] Voice message support
- [ ] Media file handling (images, videos, documents)
- [ ] Scheduled messages
- [ ] Analytics and usage tracking

## 📄 License

ISC

## 🙏 Acknowledgments

- [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js) - WhatsApp client
- [Google Gemini](https://ai.google.dev/) - AI model
- [Puppeteer](https://pptr.dev/) - Browser automation
