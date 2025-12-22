const { google } = require("googleapis");
require("dotenv").config();

/**
 * Get OAuth2 client for Google APIs
 */
function getOAuth2Client() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  // Set credentials with refresh token
  if (process.env.GOOGLE_REFRESH_TOKEN) {
    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    });
  }

  return oauth2Client;
}

/**
 * Initialize Google Drive API client
 */
function getGoogleDriveClient() {
  return google.drive({ version: "v3", auth: getOAuth2Client() });
}

/**
 * Initialize Google Docs API client
 */
function getGoogleDocsClient() {
  return google.docs({ version: "v1", auth: getOAuth2Client() });
}

/**
 * List files in Google Drive
 */
async function listFiles(maxResults = 10) {
  try {
    const drive = getGoogleDriveClient();
    const response = await drive.files.list({
      pageSize: maxResults,
      fields: "files(id, name, mimeType, createdTime, modifiedTime, size)",
    });

    return {
      success: true,
      files: response.data.files,
      message: `Found ${response.data.files.length} files`,
    };
  } catch (error) {
    console.error("Error listing files:", error.message);
    return {
      success: false,
      error: error.message,
      message: "Failed to list files from Google Drive",
    };
  }
}

/**
 * Search for files in Google Drive
 */
async function searchFiles(query) {
  try {
    const drive = getGoogleDriveClient();
    const response = await drive.files.list({
      q: `name contains '${query}' and trashed=false`,
      pageSize: 10,
      fields: "files(id, name, mimeType, createdTime, webViewLink)",
    });

    return {
      success: true,
      files: response.data.files,
      message: `Found ${response.data.files.length} files matching "${query}"`,
    };
  } catch (error) {
    console.error("Error searching files:", error.message);
    return {
      success: false,
      error: error.message,
      message: "Failed to search files in Google Drive",
    };
  }
}

/**
 * Create a new folder in Google Drive
 */
async function createFolder(folderName, parentFolderId = null) {
  try {
    const drive = getGoogleDriveClient();
    const fileMetadata = {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
    };

    if (parentFolderId) {
      fileMetadata.parents = [parentFolderId];
    }

    const response = await drive.files.create({
      resource: fileMetadata,
      fields: "id, name, webViewLink",
    });

    return {
      success: true,
      folder: response.data,
      message: `Folder "${folderName}" created successfully`,
    };
  } catch (error) {
    console.error("Error creating folder:", error.message);
    return {
      success: false,
      error: error.message,
      message: "Failed to create folder in Google Drive",
    };
  }
}

/**
 * Delete a file from Google Drive
 */
async function deleteFile(fileId) {
  try {
    const drive = getGoogleDriveClient();
    await drive.files.delete({ fileId });

    return {
      success: true,
      message: `File deleted successfully`,
    };
  } catch (error) {
    console.error("Error deleting file:", error.message);
    return {
      success: false,
      error: error.message,
      message: "Failed to delete file from Google Drive",
    };
  }
}

/**
 * Get file metadata
 */
async function getFileMetadata(fileId) {
  try {
    const drive = getGoogleDriveClient();
    const response = await drive.files.get({
      fileId,
      fields:
        "id, name, mimeType, size, createdTime, modifiedTime, webViewLink, owners",
    });

    return {
      success: true,
      file: response.data,
      message: "File metadata retrieved successfully",
    };
  } catch (error) {
    console.error("Error getting file metadata:", error.message);
    return {
      success: false,
      error: error.message,
      message: "Failed to get file metadata",
    };
  }
}

/**
 * Share a file with someone
 */
async function shareFile(fileId, email, role = "reader") {
  try {
    const drive = getGoogleDriveClient();
    const response = await drive.permissions.create({
      fileId,
      requestBody: {
        type: "user",
        role, // 'reader', 'writer', 'commenter'
        emailAddress: email,
      },
      sendNotificationEmail: true,
    });

    return {
      success: true,
      permission: response.data,
      message: `File shared with ${email} as ${role}`,
    };
  } catch (error) {
    console.error("Error sharing file:", error.message);
    return {
      success: false,
      error: error.message,
      message: "Failed to share file",
    };
  }
}

/**
 * Create a new Google Doc
 */
async function createDoc(title) {
  try {
    const docs = getGoogleDocsClient();
    const response = await docs.documents.create({
      requestBody: {
        title: title,
      },
    });

    return {
      success: true,
      document: {
        id: response.data.documentId,
        title: response.data.title,
        url: `https://docs.google.com/document/d/${response.data.documentId}/edit`,
      },
      message: `Document "${title}" created successfully`,
    };
  } catch (error) {
    console.error("Error creating document:", error.message);
    return {
      success: false,
      error: error.message,
      message: "Failed to create Google Doc",
    };
  }
}

/**
 * Read content from a Google Doc
 */
async function readDoc(documentId) {
  try {
    const docs = getGoogleDocsClient();
    const response = await docs.documents.get({
      documentId: documentId,
    });

    // Extract text from the document
    let text = "";
    const content = response.data.body.content;

    for (const element of content) {
      if (element.paragraph) {
        const paragraph = element.paragraph;
        for (const textElement of paragraph.elements || []) {
          if (textElement.textRun && textElement.textRun.content) {
            text += textElement.textRun.content;
          }
        }
      }
    }

    return {
      success: true,
      document: {
        id: response.data.documentId,
        title: response.data.title,
        content: text.trim(),
        url: `https://docs.google.com/document/d/${response.data.documentId}/edit`,
      },
      message: `Document read successfully`,
    };
  } catch (error) {
    console.error("Error reading document:", error.message);
    return {
      success: false,
      error: error.message,
      message: "Failed to read Google Doc",
    };
  }
}

/**
 * Write/append text to a Google Doc
 */
async function writeToDoc(documentId, text, location = "end") {
  try {
    const docs = getGoogleDocsClient();

    // First, get the document to find the end index
    const doc = await docs.documents.get({
      documentId: documentId,
    });

    const endIndex =
      doc.data.body.content[doc.data.body.content.length - 1].endIndex;

    // Determine insertion index based on location
    let insertIndex;
    if (location === "start") {
      insertIndex = 1; // Start of document (after title)
    } else {
      insertIndex = endIndex - 1; // End of document
    }

    // Insert text
    const requests = [
      {
        insertText: {
          location: {
            index: insertIndex,
          },
          text: text + "\n",
        },
      },
    ];

    await docs.documents.batchUpdate({
      documentId: documentId,
      requestBody: {
        requests: requests,
      },
    });

    return {
      success: true,
      message: `Text added to document successfully`,
      url: `https://docs.google.com/document/d/${documentId}/edit`,
    };
  } catch (error) {
    console.error("Error writing to document:", error.message);
    return {
      success: false,
      error: error.message,
      message: "Failed to write to Google Doc",
    };
  }
}

/**
 * Replace text in a Google Doc
 */
async function replaceTextInDoc(documentId, searchText, replacementText) {
  try {
    const docs = getGoogleDocsClient();

    const requests = [
      {
        replaceAllText: {
          containsText: {
            text: searchText,
            matchCase: false,
          },
          replaceText: replacementText,
        },
      },
    ];

    await docs.documents.batchUpdate({
      documentId: documentId,
      requestBody: {
        requests: requests,
      },
    });

    return {
      success: true,
      message: `Text replaced successfully in document`,
      url: `https://docs.google.com/document/d/${documentId}/edit`,
    };
  } catch (error) {
    console.error("Error replacing text in document:", error.message);
    return {
      success: false,
      error: error.message,
      message: "Failed to replace text in Google Doc",
    };
  }
}

/**
 * Search for Google Docs by name
 */
async function searchDocs(query) {
  try {
    const drive = getGoogleDriveClient();
    const response = await drive.files.list({
      q: `mimeType='application/vnd.google-apps.document' and name contains '${query}' and trashed=false`,
      pageSize: 10,
      fields: "files(id, name, createdTime, modifiedTime, webViewLink)",
    });

    return {
      success: true,
      documents: response.data.files,
      message: `Found ${response.data.files.length} documents matching "${query}"`,
    };
  } catch (error) {
    console.error("Error searching documents:", error.message);
    return {
      success: false,
      error: error.message,
      message: "Failed to search Google Docs",
    };
  }
}

/**
 * List recent Google Docs
 */
async function listDocs(maxResults = 10) {
  try {
    const drive = getGoogleDriveClient();
    const response = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.document' and trashed=false",
      pageSize: maxResults,
      orderBy: "modifiedTime desc",
      fields: "files(id, name, createdTime, modifiedTime, webViewLink)",
    });

    return {
      success: true,
      documents: response.data.files,
      message: `Found ${response.data.files.length} documents`,
    };
  } catch (error) {
    console.error("Error listing documents:", error.message);
    return {
      success: false,
      error: error.message,
      message: "Failed to list Google Docs",
    };
  }
}

module.exports = {
  // Drive functions
  listFiles,
  searchFiles,
  createFolder,
  deleteFile,
  getFileMetadata,
  shareFile,
  // Docs functions
  createDoc,
  readDoc,
  writeToDoc,
  replaceTextInDoc,
  searchDocs,
  listDocs,
};
