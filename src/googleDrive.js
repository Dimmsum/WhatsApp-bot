const { google } = require("googleapis");
require("dotenv").config();

/**
 * Initialize Google Drive API client
 */
function getGoogleDriveClient() {
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

  return google.drive({ version: "v3", auth: oauth2Client });
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

module.exports = {
  listFiles,
  searchFiles,
  createFolder,
  deleteFile,
  getFileMetadata,
  shareFile,
};
