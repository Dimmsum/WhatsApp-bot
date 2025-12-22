// aiHandler.js (UPDATED)

const { GoogleGenerativeAI } = require("@google/generative-ai");
const googleDrive = require("./googleDrive");
const linear = require("./linear");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * ✅ FIX #1: Every tool takes a single "args" object (no Object.values / positional args).
 * ✅ Guard unknown tools.
 * ✅ Add max tool-iteration safety to prevent infinite loops.
 * ✅ Enforce delete confirmation in code (optional but recommended).
 */
const availableFunctions = {
  // Google Drive
  list_google_drive_files: async (args = {}) =>
    googleDrive.listFiles(args.maxResults),

  search_google_drive_files: async (args = {}) =>
    googleDrive.searchFiles(args.query),

  create_google_drive_folder: async (args = {}) =>
    googleDrive.createFolder(args.folderName, args.parentFolderId),

  get_file_metadata: async (args = {}) =>
    googleDrive.getFileMetadata(args.fileId),

  share_google_drive_file: async (args = {}) =>
    googleDrive.shareFile(args.fileId, args.email, args.role),

  // ✅ safety: confirm deletes in code, not only prompt
  delete_google_drive_file: async (args = {}) => {
    if (!args?.confirm) {
      return {
        success: false,
        message:
          "Delete is a destructive action. Reply again with: `delete <fileId> confirm` (or provide confirm: true) to proceed.",
      };
    }
    return googleDrive.deleteFile(args.fileId);
  },

  // Google Docs
  create_google_doc: async (args = {}) => googleDrive.createDoc(args.title),

  read_google_doc: async (args = {}) => googleDrive.readDoc(args.documentId),

  write_to_google_doc: async (args = {}) =>
    googleDrive.writeToDoc(args.documentId, args.text, args.location ?? "end"),

  replace_text_in_google_doc: async (args = {}) =>
    googleDrive.replaceTextInDoc(
      args.documentId,
      args.searchText,
      args.replacementText
    ),

  search_google_docs: async (args = {}) => googleDrive.searchDocs(args.query),

  list_google_docs: async (args = {}) => googleDrive.listDocs(args.maxResults),

  // Linear
  list_linear_teams: async (_args = {}) => linear.listTeams(),

  list_linear_projects: async (args = {}) =>
    linear.listProjects(args.teamId ?? null),

  list_linear_issue_states: async (args = {}) =>
    linear.listIssueStates(args.teamId),

  search_linear_issues: async (args = {}) =>
    linear.searchIssues(args.query, args.first ?? 10),

  get_linear_issue: async (args = {}) => linear.getIssue(args.issueIdOrKey),

  create_linear_issue: async (args = {}) =>
    linear.createIssue(
      args.teamId,
      args.title,
      args.description ?? null,
      args.projectId ?? null,
      args.stateId ?? null,
      args.assigneeId ?? null,
      args.labelIds ?? null
    ),

  update_linear_issue_status: async (args = {}) =>
    linear.updateIssueStatus(args.issueIdOrKey, args.stateId),
};

// Keep your existing functionDeclarations as-is (you can add confirm to delete later if you want)
const functionDeclarations = [
  {
    name: "list_google_drive_files",
    description:
      "List files in the user's Google Drive. Returns up to the specified number of recent files.",
    parameters: {
      type: "object",
      properties: {
        maxResults: {
          type: "number",
          description: "Maximum number of files to return (default: 10)",
        },
      },
    },
  },
  {
    name: "search_google_drive_files",
    description: "Search for files in Google Drive by name or content.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query to find files",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "create_google_drive_folder",
    description: "Create a new folder in Google Drive.",
    parameters: {
      type: "object",
      properties: {
        folderName: {
          type: "string",
          description: "Name of the folder to create",
        },
        parentFolderId: {
          type: "string",
          description: "Optional parent folder ID",
        },
      },
      required: ["folderName"],
    },
  },
  {
    name: "delete_google_drive_file",
    description: "Delete a file from Google Drive. Use this carefully.",
    parameters: {
      type: "object",
      properties: {
        fileId: {
          type: "string",
          description: "ID of the file to delete",
        },
      },
      required: ["fileId"],
    },
  },
  {
    name: "get_file_metadata",
    description:
      "Get detailed information about a specific file in Google Drive.",
    parameters: {
      type: "object",
      properties: {
        fileId: {
          type: "string",
          description: "ID of the file to get metadata for",
        },
      },
      required: ["fileId"],
    },
  },
  {
    name: "share_google_drive_file",
    description: "Share a file with another user via email.",
    parameters: {
      type: "object",
      properties: {
        fileId: {
          type: "string",
          description: "ID of the file to share",
        },
        email: {
          type: "string",
          description: "Email address of the person to share with",
        },
        role: {
          type: "string",
          enum: ["reader", "writer", "commenter"],
          description: "Permission level (reader, writer, or commenter)",
        },
      },
      required: ["fileId", "email"],
    },
  },
  {
    name: "create_google_doc",
    description: "Create a new Google Doc with a specified title.",
    parameters: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Title for the new Google Doc",
        },
      },
      required: ["title"],
    },
  },
  {
    name: "read_google_doc",
    description:
      "Read the content from a Google Doc. Returns the full text content of the document.",
    parameters: {
      type: "object",
      properties: {
        documentId: {
          type: "string",
          description: "ID of the Google Doc to read",
        },
      },
      required: ["documentId"],
    },
  },
  {
    name: "write_to_google_doc",
    description:
      "Write or append text to a Google Doc. Can add text at the start or end of the document.",
    parameters: {
      type: "object",
      properties: {
        documentId: {
          type: "string",
          description: "ID of the Google Doc to write to",
        },
        text: {
          type: "string",
          description: "Text content to add to the document",
        },
        location: {
          type: "string",
          enum: ["start", "end"],
          description: "Where to add the text (start or end of document)",
        },
      },
      required: ["documentId", "text"],
    },
  },
  {
    name: "replace_text_in_google_doc",
    description:
      "Find and replace text in a Google Doc. Replaces all occurrences of the search text.",
    parameters: {
      type: "object",
      properties: {
        documentId: {
          type: "string",
          description: "ID of the Google Doc",
        },
        searchText: {
          type: "string",
          description: "Text to search for",
        },
        replacementText: {
          type: "string",
          description: "Text to replace with",
        },
      },
      required: ["documentId", "searchText", "replacementText"],
    },
  },
  {
    name: "search_google_docs",
    description: "Search for Google Docs by name.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query to find documents",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "list_google_docs",
    description: "List recent Google Docs in the user's Drive.",
    parameters: {
      type: "object",
      properties: {
        maxResults: {
          type: "number",
          description: "Maximum number of documents to return (default: 10)",
        },
      },
    },
  },
  {
    name: "list_linear_teams",
    description: "List teams in Linear.",
    parameters: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "list_linear_projects",
    description:
      "List projects in Linear. You can filter by team by passing teamId as a team key (e.g. INT), name, or UUID.",
    parameters: {
      type: "object",
      properties: {
        teamId: {
          type: "string",
          description:
            "Optional team key/name/UUID to filter projects (e.g. INT)",
        },
      },
    },
  },
  {
    name: "list_linear_issue_states",
    description: "List issue states for a Linear team.",
    parameters: {
      type: "object",
      properties: {
        teamId: {
          type: "string",
          description: "Team name, key, or ID to list issue states for",
        },
      },
      required: ["teamId"],
    },
  },
  {
    name: "search_linear_issues",
    description: "Search for Linear issues using a text query.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search text or issue identifier (e.g. ENG-123)",
        },
        first: {
          type: "number",
          description: "Maximum number of issues to return (default: 10)",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "get_linear_issue",
    description: "Get a Linear issue by ID or identifier (e.g. ENG-123).",
    parameters: {
      type: "object",
      properties: {
        issueIdOrKey: {
          type: "string",
          description: "Issue UUID or identifier",
        },
      },
      required: ["issueIdOrKey"],
    },
  },
  {
    name: "create_linear_issue",
    description: "Create a new Linear issue.",
    parameters: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Issue title",
        },
        description: {
          type: "string",
          description: "Issue description (optional)",
        },
        teamId: {
          type: "string",
          description: "Team name, key, or ID to create the issue in",
        },
        projectId: {
          type: "string",
          description: "Optional project ID",
        },
        stateId: {
          type: "string",
          description: "Optional issue state ID",
        },
        assigneeId: {
          type: "string",
          description: "Optional assignee ID",
        },
        labelIds: {
          type: "array",
          items: { type: "string" },
          description: "Optional list of label IDs",
        },
      },
      required: ["title", "teamId"],
    },
  },
  {
    name: "update_linear_issue_status",
    description: "Update a Linear issue status by issue ID/key and state ID.",
    parameters: {
      type: "object",
      properties: {
        issueIdOrKey: {
          type: "string",
          description: "Issue UUID or identifier (e.g. ENG-123)",
        },
        stateId: {
          type: "string",
          description: "Target state ID",
        },
      },
      required: ["issueIdOrKey", "stateId"],
    },
  },
];

// Conversation history per user (in-memory, can be replaced with database)
const conversationHistory = {};

/**
 * Process user message with Gemini and handle function calls
 */
async function processMessage(userId, userMessage) {
  try {
    if (!conversationHistory[userId]) conversationHistory[userId] = [];

    const systemPrompt =
      process.env.AI_SYSTEM_PROMPT ||
      "You are a helpful WhatsApp assistant that can interact with Google Drive, Google Docs, and Linear. " +
        "IMPORTANT DOCUMENT HANDLING RULES:\n" +
        "1. When a user mentions a document by name (e.g., 'atlas ai document', 'meeting notes', 'project plan'), ALWAYS use search_google_docs first to find matching documents.\n" +
        "2. If search returns MULTIPLE documents, list them all with their names and IDs, and let the user know there are multiple matches.\n" +
        "3. If search returns ONLY ONE document, automatically use that document's ID to perform the requested operation (read, write, etc.) without asking.\n" +
        "4. If the user provides a specific document ID, use it directly.\n" +
        "5. Extract key words from the user's message to search (e.g., 'atlas ai document' → search for 'atlas ai').\n\n" +
        "When users ask about files, folders, or Google Drive operations, use the available functions. " +
        "When users ask about issues, projects, or status updates in Linear, use the Linear functions. " +
        "Be conversational and helpful. Always confirm before deleting files.";

    const model = genAI.getGenerativeModel({
      model: process.env.AI_MODEL || "gemini-1.5-flash",
      tools: [{ functionDeclarations }],
      systemInstruction: {
        role: "system",
        parts: [{ text: systemPrompt }],
      },
    });

    const chat = model.startChat({
      history: conversationHistory[userId],
    });

    let result = await chat.sendMessage(userMessage);
    let response = result.response;

    // ✅ safety limit: prevent infinite tool-call loops
    let toolIterations = 0;
    const MAX_TOOL_ITERATIONS = 5;

    while (
      response.functionCalls?.() &&
      toolIterations++ < MAX_TOOL_ITERATIONS
    ) {
      const functionCalls = response.functionCalls();

      for (const call of functionCalls) {
        const functionName = call.name;
        const functionArgs = call.args || {};

        console.log(`🤖 AI calling function: ${functionName}`, functionArgs);

        let functionResponse;

        // ✅ guard: unknown function
        const fn = availableFunctions[functionName];
        if (!fn) {
          functionResponse = {
            success: false,
            message: `Unknown function: ${functionName}. Available: ${Object.keys(
              availableFunctions
            ).join(", ")}`,
          };
        } else {
          // ✅ FIX #1: pass args object directly (no Object.values)
          functionResponse = await fn(functionArgs);
        }

        // Send tool result back to Gemini
        result = await chat.sendMessage([
          {
            functionResponse: {
              name: functionName,
              response: functionResponse,
            },
          },
        ]);

        response = result.response;
      }
    }

    if (toolIterations >= MAX_TOOL_ITERATIONS) {
      console.warn("⚠️ Tool loop safety triggered (max iterations reached).");
    }

    conversationHistory[userId] = await chat.getHistory();

    if (conversationHistory[userId].length > 40) {
      conversationHistory[userId] = conversationHistory[userId].slice(-40);
    }

    const responseText = response.text();
    console.log(
      `✅ AI Response generated: ${responseText.substring(0, 100)}...`
    );

    return {
      success: true,
      message: responseText,
    };
  } catch (error) {
    console.error("Error processing message with AI:");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    return {
      success: false,
      message: `Sorry, I encountered an error: ${error.message}`,
    };
  }
}

/**
 * Clear conversation history for a user
 */
function clearHistory(userId) {
  delete conversationHistory[userId];
  return { success: true, message: "Conversation history cleared" };
}

module.exports = {
  processMessage,
  clearHistory,
};
