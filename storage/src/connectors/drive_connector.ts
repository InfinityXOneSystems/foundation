import { google } from "googleapis";
import * as fs from "fs";
import * as path from "path";

const drive = google.drive("v3");

/**
 * Initialize Google Drive API client with service account or OAuth2 credentials
 * Expects GOOGLE_APPLICATION_CREDENTIALS env var or GCP_AUTH_JSON
 */
function initializeDriveClient() {
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (!credentialsPath) {
    throw new Error(
      "GOOGLE_APPLICATION_CREDENTIALS environment variable not set"
    );
  }

  const auth = new google.auth.GoogleAuth({
    keyFile: credentialsPath,
    scopes: ["https://www.googleapis.com/auth/drive"],
  });

  return auth;
}

/**
 * Upload file to Google Drive
 * @param fileName - Name of the file
 * @param content - File content as Buffer or Base64 string
 * @param mimeType - MIME type of the file
 * @param parentFolderId - Optional parent folder ID
 * @returns Promise<{fileId, name, webViewLink}>
 */
export async function uploadFile(
  fileName: string,
  content: Buffer | string,
  mimeType: string,
  parentFolderId?: string
): Promise<{ fileId: string; name: string; webViewLink: string }> {
  try {
    const auth = initializeDriveClient();

    // Convert base64 string to Buffer if needed
    const fileContent =
      typeof content === "string" ? Buffer.from(content, "base64") : content;

    const fileMetadata: any = {
      name: fileName,
      mimeType,
    };

    if (parentFolderId) {
      fileMetadata.parents = [parentFolderId];
    }

    const media = {
      mimeType,
      body: fileContent,
    };

    const response = await drive.files.create({
      auth: auth,
      requestBody: fileMetadata,
      media,
      fields: "id, name, webViewLink",
    });

    console.log(`File uploaded: ${fileName} (ID: ${response.data.id})`);

    return {
      fileId: response.data.id || "",
      name: response.data.name || "",
      webViewLink: response.data.webViewLink || "",
    };
  } catch (error) {
    console.error("Error uploading file to Google Drive:", error);
    throw new Error("File upload failed");
  }
}

/**
 * Download file from Google Drive
 * @param fileId - Google Drive file ID
 * @returns Promise<{fileId, name, content (base64), mimeType}>
 */
export async function downloadFile(
  fileId: string
): Promise<{
  fileId: string;
  name: string;
  content: string;
  mimeType: string;
}> {
  try {
    const auth = initializeDriveClient();

    // Get file metadata
    const metadataResponse = await drive.files.get({
      auth: auth,
      fileId,
      fields: "id, name, mimeType",
    });

    // Get file content
    const contentResponse = await drive.files.get({
      auth: auth,
      fileId,
      alt: "media",
    });

    const content = Buffer.from(contentResponse.data as any).toString("base64");

    return {
      fileId,
      name: metadataResponse.data.name || "",
      content,
      mimeType: metadataResponse.data.mimeType || "application/octet-stream",
    };
  } catch (error) {
    console.error("Error downloading file from Google Drive:", error);
    throw new Error("File download failed");
  }
}

/**
 * List files in Google Drive (with optional query)
 * @param query - Optional search query (e.g., "name='myfile.pdf'")
 * @param pageSize - Number of results to return (default: 10)
 * @returns Promise<{files: Array<{fileId, name, mimeType, createdTime}>, nextPageToken}>
 */
export async function listFiles(
  query?: string,
  pageSize: number = 10
): Promise<{
  files: Array<{
    fileId: string;
    name: string;
    mimeType: string;
    createdTime: string;
  }>;
  nextPageToken?: string;
}> {
  try {
    const auth = initializeDriveClient();

    const response = await drive.files.list({
      auth: auth,
      spaces: "drive",
      fields: "files(id, name, mimeType, createdTime), nextPageToken",
      pageSize,
      q: query,
    });

    const files = (response.data.files || []).map((file: any) => ({
      fileId: file.id,
      name: file.name,
      mimeType: file.mimeType,
      createdTime: file.createdTime,
    }));

    return {
      files,
      nextPageToken: response.data.nextPageToken,
    };
  } catch (error) {
    console.error("Error listing files from Google Drive:", error);
    throw new Error("File listing failed");
  }
}

/**
 * Delete file from Google Drive
 * @param fileId - Google Drive file ID
 * @returns Promise<{fileId, status}>
 */
export async function deleteFile(
  fileId: string
): Promise<{ fileId: string; status: string }> {
  try {
    const auth = initializeDriveClient();

    await drive.files.delete({
      auth: auth,
      fileId,
    });

    console.log(`File deleted: ${fileId}`);

    return {
      fileId,
      status: "deleted",
    };
  } catch (error) {
    console.error("Error deleting file from Google Drive:", error);
    throw new Error("File deletion failed");
  }
}

/**
 * Search for files in Google Drive with advanced filters
 * @param options - { query, mimeType, createdAfter, createdBefore }
 * @returns Promise<{files: Array<{fileId, name, mimeType, createdTime}>}>
 */
export async function searchFiles(options: {
  query?: string;
  mimeType?: string;
  createdAfter?: string;
  createdBefore?: string;
}): Promise<
  Array<{ fileId: string; name: string; mimeType: string; createdTime: string }>
> {
  try {
    const auth = initializeDriveClient();

    let q = "";
    if (options.query) q += `name contains '${options.query}' and `;
    if (options.mimeType) q += `mimeType='${options.mimeType}' and `;
    if (options.createdAfter)
      q += `createdTime>='${options.createdAfter}' and `;
    if (options.createdBefore)
      q += `createdTime<='${options.createdBefore}' and `;

    // Remove trailing " and "
    q = q.replace(/ and $/, "");

    const response = await drive.files.list({
      auth: auth,
      spaces: "drive",
      fields: "files(id, name, mimeType, createdTime)",
      pageSize: 100,
      q,
    });

    return (response.data.files || []).map((file: any) => ({
      fileId: file.id,
      name: file.name,
      mimeType: file.mimeType,
      createdTime: file.createdTime,
    }));
  } catch (error) {
    console.error("Error searching files in Google Drive:", error);
    throw new Error("File search failed");
  }
}

/**
 * Get storage quota information
 * @returns Promise<{storageQuotaBytes, usedBytes, freeBytes, percentageUsed}>
 */
export async function getStorageQuota(): Promise<{
  storageQuotaBytes: number;
  usedBytes: number;
  freeBytes: number;
  percentageUsed: number;
}> {
  try {
    const auth = initializeDriveClient();

    const response = await drive.about.get({
      auth: auth,
      fields: "storageQuota",
    });

    const quota = response.data.storageQuota;
    const storageQuotaBytes = quota?.limit || 15 * 1024 * 1024 * 1024;
    const usedBytes = quota?.usage || 0;
    const freeBytes = storageQuotaBytes - usedBytes;
    const percentageUsed = (usedBytes / storageQuotaBytes) * 100;

    return {
      storageQuotaBytes,
      usedBytes,
      freeBytes,
      percentageUsed: Math.round(percentageUsed),
    };
  } catch (error) {
    console.error("Error fetching storage quota from Google Drive:", error);
    throw new Error("Quota retrieval failed");
  }
}
