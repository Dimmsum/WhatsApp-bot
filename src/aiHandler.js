const { GoogleGenerativeAI } = require("@google/generative-ai");
const googleDrive = require("./googleDrive");
const linear = require("./linear");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Define available functions for ChatGPT to call
const availableFunctions = {
  list_google_drive_files: googleDrive.listFiles,
  search_google_drive_files: googleDrive.searchFiles,
  create_google_drive_folder: googleDrive.createFolder,
  delete_google_drive_file: googleDrive.deleteFile,
  get_file_metadata: googleDrive.getFileMetadata,
  share_google_drive_file: googleDrive.shareFile,
  list_linear_teams: linear.listTeams,
  list_linear_projects: linear.listProjects,
  list_linear_issue_states: linear.listIssueStates,
  search_linear_issues: linear.searchIssues,
  get_linear_issue: linear.getIssue,
  create_linear_issue: linear.createIssue,
  update_linear_issue_status: linear.updateIssueStatus,
};

// Define the function declarations for Gemini
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
      "List projects in Linear. Optionally filter by team name, key, or ID.",
    parameters: {
      type: "object",
      properties: {
        teamId: {
          type: "string",
          description: "Optional team name, key, or ID to filter projects",
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
    // Initialize conversation history for new users
    if (!conversationHistory[userId]) {
      conversationHistory[userId] = [];
    }

    const systemPrompt =
      process.env.AI_SYSTEM_PROMPT ||
      "You are a helpful WhatsApp assistant that can interact with Google Drive and Linear. " +
        "When users ask about files, folders, or Google Drive operations, use the available functions. " +
        "When users ask about issues, projects, or status updates in Linear, use the Linear functions. " +
        "Be conversational and helpful. Always confirm before deleting files.";

    // Initialize Gemini model with function calling
    const model = genAI.getGenerativeModel({
      model: process.env.AI_MODEL || "gemini-1.5-flash",
      tools: [{ functionDeclarations }],
      systemInstruction: {
        role: "system",
        parts: [{ text: systemPrompt }],
      },
    });

    // Build chat history for Gemini
    const chat = model.startChat({
      history: conversationHistory[userId],
    });

    // Send message and get response
    let result = await chat.sendMessage(userMessage);
    let response = result.response;

    // Handle function calls
    while (response.functionCalls()) {
      const functionCalls = response.functionCalls();

      for (const call of functionCalls) {
        const functionName = call.name;
        const functionArgs = call.args;

        console.log(`🤖 AI calling function: ${functionName}`, functionArgs);

        // Execute the function
        const functionResponse = await availableFunctions[functionName](
          ...Object.values(functionArgs)
        );

        // Send function response back to Gemini
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

    // Update conversation history
    conversationHistory[userId] = await chat.getHistory();

    // Keep conversation history limited (last 20 exchanges)
    if (conversationHistory[userId].length > 40) {
      conversationHistory[userId] = conversationHistory[userId].slice(-40);
    }

    return {
      success: true,
      message: response.text(),
    };
  } catch (error) {
    console.error("Error processing message with AI:", error.message);
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
