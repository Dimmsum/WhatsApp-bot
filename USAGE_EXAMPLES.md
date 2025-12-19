# WhatsApp Bot Usage Examples

## Natural Language Examples

The bot uses ChatGPT to understand your intent and automatically perform Google Drive operations.

### Listing Files

**You:** "Show me my files"
**Bot:** "Here are your recent files from Google Drive:

1. Project Report.pdf
2. Meeting Notes.docx
3. Budget 2025.xlsx
   ..."

**You:** "What files do I have?"
**Bot:** [Lists your files]

### Searching for Files

**You:** "Find files about taxes"
**Bot:** "I found 3 files matching 'taxes':

1. Tax Return 2024.pdf
2. Tax Documents folder
   ..."

**You:** "Search for presentation"
**Bot:** [Shows files with 'presentation' in the name]

### Creating Folders

**You:** "Create a folder called Projects 2025"
**Bot:** "✅ Folder 'Projects 2025' created successfully! Here's the link: [Google Drive link]"

**You:** "Make a new folder named Photos"
**Bot:** [Creates the folder]

### Getting File Information

**You:** "Tell me about file 1A2B3C4D5E"
**Bot:** "Here's the information for that file:

- Name: Important Document.pdf
- Size: 2.5 MB
- Created: Jan 15, 2025
- Last Modified: Jan 18, 2025
- Link: [Google Drive link]"

### Sharing Files

**You:** "Share file 1A2B3C4D5E with john@example.com"
**Bot:** "✅ File shared successfully with john@example.com as a reader."

**You:** "Give editor access to file 1A2B3C4D5E for sarah@example.com"
**Bot:** "✅ File shared with sarah@example.com as an editor."

### Deleting Files

**You:** "Delete file 1A2B3C4D5E"
**Bot:** "⚠️ Are you sure you want to delete this file? This action cannot be undone. Reply 'yes' to confirm."

**You:** "yes"
**Bot:** "✅ File deleted successfully."

### General Conversation

**You:** "Hello!"
**Bot:** "Hello! I'm your AI assistant. I can help you manage your Google Drive files. What would you like to do?"

**You:** "What can you do?"
**Bot:** "I can help you with:

- Listing and searching your files
- Creating folders
- Getting file information
- Sharing files with others
- Deleting files
  Just tell me what you need!"

## Special Commands

### /help Command

**You:** `/help`
**Bot:** Shows a help menu with all available features

### /clear Command

**You:** `/clear`
**Bot:** "✅ Conversation history cleared!"
This clears your conversation history with the AI, giving you a fresh start.

## How the AI Works

The bot uses ChatGPT's function calling feature:

1. You send a message
2. ChatGPT analyzes your intent
3. If you're asking about files, it calls the appropriate Google Drive function
4. The function executes and returns results
5. ChatGPT formats the results in a conversational way
6. You receive a helpful response

## Conversation Context

The bot maintains conversation history, so you can have multi-turn conversations:

**You:** "List my files"
**Bot:** [Shows files including "Report.pdf" with ID 123ABC]

**You:** "Share the report with john@example.com"
**Bot:** "✅ Report.pdf has been shared with john@example.com"

The AI remembers what you were talking about!

## Group Chats

The bot currently only responds to direct messages, not group chats. This prevents spam and maintains privacy.

## Example Workflow

Here's a typical workflow:

```
You: "Hey, can you find my tax documents?"
Bot: "I found 2 files related to taxes:
      1. Tax Return 2024.pdf (ID: 1A2B3C)
      2. Tax Receipts folder (ID: 4D5E6F)"

You: "Create a new folder called Taxes 2025"
Bot: "✅ Folder 'Taxes 2025' created successfully!"

You: "Move the tax return file to that folder"
Bot: "I can't move files yet, but I can help you access them.
      Would you like me to share the file with someone or get more info?"

You: "Share file 1A2B3C with my accountant at accountant@example.com"
Bot: "✅ Tax Return 2024.pdf has been shared with accountant@example.com as a reader."
```

## Tips for Best Results

1. **Be specific**: "Search for project reports" works better than "find stuff"
2. **Use file IDs**: When you get a list of files, you can refer to them by ID for actions
3. **Be conversational**: The AI understands natural language, no need for exact commands
4. **Confirm deletions**: The AI will ask for confirmation before deleting anything
5. **Clear history**: Use `/clear` if the bot seems confused or you want a fresh start
