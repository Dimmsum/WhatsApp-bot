# Google Docs Quick Start Examples

## Simple Usage Examples for WhatsApp Bot

### 1. Create a New Document

**You:** "Create a new Google Doc called 'My Notes'"

**Bot:**

```
✅ Document "My Notes" created successfully
📄 Document ID: 1abc123xyz...
🔗 URL: https://docs.google.com/document/d/1abc123xyz.../edit
```

---

### 2. Write to a Document

**You:** "Add this text to document 1abc123xyz: 'This is my first entry. Today I learned about Google Docs API.'"

**Bot:**

```
✅ Text added to document successfully
🔗 https://docs.google.com/document/d/1abc123xyz.../edit
```

---

### 3. Read Document Content

**You:** "Read document 1abc123xyz"

**Bot:**

```
📄 Document: My Notes

Content:
This is my first entry. Today I learned about Google Docs API.
```

---

### 4. Search for Documents

**You:** "Search for documents with 'notes' in the name"

**Bot:**

```
Found 3 documents matching "notes":

1. My Notes
   ID: 1abc123xyz...
   🔗 https://docs.google.com/document/d/1abc123xyz.../edit

2. Meeting Notes
   ID: 2def456uvw...
   🔗 https://docs.google.com/document/d/2def456uvw.../edit
```

---

### 5. List Recent Documents

**You:** "Show me my last 5 Google Docs"

**Bot:**

```
📄 Recent Google Docs:

1. My Notes (Modified: Today)
2. Project Plan (Modified: Yesterday)
3. Meeting Notes (Modified: 2 days ago)
```

---

### 6. Replace Text in Document

**You:** "In document 1abc123xyz, replace 'first entry' with 'initial note'"

**Bot:**

```
✅ Text replaced successfully in document
🔗 https://docs.google.com/document/d/1abc123xyz.../edit
```

---

### 7. Complex Workflow Example

**You:** "Create a document called 'Daily Log'"

**Bot:** ✅ Created! ID: 3ghi789rst...

**You:** "Add today's date and then write: 'Completed project setup. Integrated Google Docs API. Next: Test all features.'"

**Bot:** ✅ Text added!

**You:** "Share this document with colleague@example.com as writer"

**Bot:** ✅ Shared with colleague@example.com as writer

**You:** "Read my Daily Log and summarize it"

**Bot:**

```
📄 Daily Log Summary:

Your daily log shows that you completed project setup, successfully integrated the Google Docs API, and your next step is to test all features.
```

---

## Tips for Using Document IDs

### Method 1: Copy from URL

When you create or search for a document, the bot gives you the URL:

```
https://docs.google.com/document/d/1abc123xyz.../edit
                                  ↑ This is the ID
```

### Method 2: Store Common IDs

Keep a list of frequently used document IDs:

```
Daily Journal: 1abc123xyz...
Meeting Notes: 2def456uvw...
Project Plan: 3ghi789rst...
```

### Method 3: Use Natural Language

Instead of remembering IDs:

- "Read my Daily Journal" (bot searches first)
- "Add text to my meeting notes from yesterday"

---

## Common Patterns

### Daily Journaling

```
1. "Create a doc called 'Journal 2024'"
2. Every day: "Add to my journal: [today's entry]"
3. End of week: "Read my journal and create a weekly summary"
```

### Meeting Notes

```
1. "Create 'Team Meeting Dec 22'"
2. During meeting: "Add: Action item - Review PR #123"
3. After meeting: "Share Team Meeting with team@example.com"
```

### Document Templates

```
1. Create a template doc
2. Read it to get content
3. Create new docs and write template content
```

---

## Combining with Other Features

### With Google Drive

```
"List my recent docs, then read the most recent one"
"Create a folder called 'Projects' and create a doc inside it"
```

### With Linear

```
"Read my project doc and create Linear issues for each action item"
"Update my status doc: replace 'In Progress' with 'Completed'"
```

---

## Best Practices

1. **Use descriptive names:** Makes searching easier
2. **Keep document IDs handy:** Save commonly used IDs
3. **Read before replacing:** Verify content before find/replace
4. **Natural commands work:** Don't worry about exact syntax
5. **Chain operations:** The AI understands multi-step requests

---

## Need Help?

Send `/help` to your bot for a quick reference of all available commands!
