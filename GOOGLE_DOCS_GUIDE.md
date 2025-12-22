# Google Docs Integration Guide

## Overview

Your WhatsApp bot now has full Google Docs integration! You can create, read, write, and manage Google Docs directly through WhatsApp messages.

## Features Implemented

### 1. **Create Google Docs**

Create new documents with a specified title.

**Example commands:**

- "Create a new Google Doc called 'Meeting Notes'"
- "Make a document titled 'Project Plan 2024'"

**What happens:**

- A new Google Doc is created in your Google Drive
- Returns the document ID and URL
- Document is ready to be written to

### 2. **Read Google Docs**

Extract and read the full text content from any Google Doc.

**Example commands:**

- "Read the document with ID 1abc123..."
- "Show me the content of my 'Meeting Notes' doc"
- "What's in document ID xyz789..."

**What happens:**

- Fetches the document content
- Returns the full text from the document
- Preserves paragraph structure

### 3. **Write to Google Docs**

Add text to existing documents at the start or end.

**Example commands:**

- "Add 'Hello World' to document 1abc123..."
- "Append this text to my meeting notes: [text]"
- "Write at the start of document xyz789: Introduction"

**What happens:**

- Inserts text at specified location (start/end)
- Adds a newline after the text
- Returns the document URL

### 4. **Replace Text in Google Docs**

Find and replace all occurrences of text in a document.

**Example commands:**

- "Replace 'old text' with 'new text' in document 1abc123"
- "In my notes doc, change 'TODO' to 'DONE'"

**What happens:**

- Searches for all occurrences (case-insensitive)
- Replaces with new text
- Returns confirmation

### 5. **Search Google Docs**

Find documents by name.

**Example commands:**

- "Search for documents containing 'meeting'"
- "Find my docs with 'project' in the name"

**What happens:**

- Searches only Google Docs (not other Drive files)
- Returns list of matching documents with IDs and links
- Shows up to 10 results

### 6. **List Recent Google Docs**

View your most recently modified documents.

**Example commands:**

- "List my recent Google Docs"
- "Show me my last 5 documents"

**What happens:**

- Returns recently modified documents
- Ordered by modification date (newest first)
- Shows document names, IDs, and links

## How to Use

### Getting Document IDs

There are several ways to get a document ID:

1. **From the URL:**

   - Google Doc URL: `https://docs.google.com/document/d/[DOCUMENT_ID]/edit`
   - The long string between `/d/` and `/edit` is your document ID

2. **Search for it:**

   ```
   You: "Search for my document called 'Project Plan'"
   Bot: Found documents:
        - Project Plan (ID: 1abc123xyz...)
   ```

3. **List recent docs:**
   ```
   You: "List my recent Google Docs"
   Bot: Recent documents:
        1. Project Plan (ID: 1abc123...)
        2. Meeting Notes (ID: 2def456...)
   ```

### Natural Language Examples

The AI understands natural language, so you can ask in various ways:

**Creating Documents:**

```
- "Create a new doc called 'Q1 Report'"
- "Make me a Google Doc for meeting notes"
- "Start a new document titled 'Ideas'"
```

**Reading Documents:**

```
- "What's in my Project Plan document?"
- "Read document 1abc123..."
- "Show me the content of my meeting notes"
```

**Writing to Documents:**

```
- "Add this to my meeting notes: Action items from today's call"
- "Write 'Summary: Project completed successfully' to document xyz789"
- "Append these bullet points to my doc..."
```

**Replacing Text:**

```
- "In my project doc, replace 'In Progress' with 'Completed'"
- "Change all instances of 'TBD' to 'January 15' in document 1abc123"
```

**Combining Operations:**

```
- "Create a doc called 'Daily Log' and add today's summary"
- "Find my 'Meeting Notes' doc and append today's action items"
- "Search for 'Project Plan', read it, and summarize the content"
```

## Technical Details

### Authentication

- Uses the same OAuth2 credentials as Google Drive
- Requires the Google Docs API to be enabled in your Google Cloud project
- Uses your existing `GOOGLE_REFRESH_TOKEN` from `.env`

### Document Structure

- Documents are read as plain text
- Formatting (bold, italic, etc.) is not preserved when reading
- Text is written as plain text with newlines preserved

### Permissions

- Created documents have the same permissions as files created through Drive
- Use the existing `share_google_drive_file` function to share docs
- Document IDs work the same as file IDs in Google Drive

## API Scope Requirements

Make sure your Google Cloud project has these APIs enabled:

1. **Google Drive API** (already enabled)
2. **Google Docs API** (may need to enable)

The OAuth scopes you need:

- `https://www.googleapis.com/auth/drive` (you already have this)
- `https://www.googleapis.com/auth/documents` (included in drive scope)

## Example Workflows

### 1. Daily Journal

```
You: "Create a document called 'Daily Journal'"
Bot: ✅ Document created! ID: 1abc...

You: "Add today's entry: Had a productive meeting with the team."
Bot: ✅ Text added successfully!

You: "Read my Daily Journal"
Bot: Content: "Had a productive meeting with the team."
```

### 2. Collaborative Document

```
You: "Create a doc called 'Team Ideas'"
Bot: ✅ Created! ID: 2def...

You: "Write 'Brainstorming Session Ideas:\n- Idea 1\n- Idea 2' to document 2def"
Bot: ✅ Text added!

You: "Share document 2def with team@example.com as writer"
Bot: ✅ Shared with team@example.com as writer
```

### 3. Document Updates

```
You: "Search for 'Project Status'"
Bot: Found: Project Status (ID: 3ghi...)

You: "Replace 'Status: Planning' with 'Status: In Progress' in document 3ghi"
Bot: ✅ Text replaced successfully!
```

## Troubleshooting

### Common Issues:

1. **"Failed to read Google Doc"**

   - Verify the document ID is correct
   - Ensure the document exists and isn't trashed
   - Check that your OAuth token has access to the document

2. **"Failed to write to Google Doc"**

   - Verify you have write permissions
   - Check that the document isn't in read-only mode
   - Ensure the document ID is valid

3. **Authentication Errors**
   - Your refresh token may have expired
   - Re-run the authentication flow (see main README)
   - Verify Google Docs API is enabled in your project

## Best Practices

1. **Store Document IDs:** Keep track of frequently used document IDs
2. **Use Descriptive Names:** Name documents clearly for easy searching
3. **Read Before Replace:** Read document content before doing find/replace
4. **Backup Important Docs:** The bot can modify documents, so keep backups
5. **Use Search:** Search by name rather than remembering IDs

## Integration with Existing Features

Google Docs works seamlessly with your existing features:

- **Drive Integration:** Docs appear in file listings and searches
- **AI Assistant:** Natural language understanding for all operations
- **Linear Integration:** Create docs for project documentation
- **Conversation History:** The bot remembers context across messages

## Next Steps

Your bot is now ready to use Google Docs! Try:

1. Send `/help` to see all available commands
2. Create your first document
3. Try reading and writing to it
4. Experiment with natural language commands

Happy documenting! 📝
