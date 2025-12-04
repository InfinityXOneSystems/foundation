import { google } from "googleapis";
import { GaxiosResponse } from "gaxios";
import { docs_v1 as DocsV1 } from "googleapis/build/src/apis/docs";
import { sheets_v4 as SheetsV4 } from "googleapis/build/src/apis/sheets";

const KEYFILE =
  process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  "./google-service-account-key.json";

/**
 * Manages autonomous write operations for Google Docs and Sheets, enabling persistent
 * documentation and structured data logging (metrics, VDB checks).
 * Uses a Google Service Account for 24/7 non-interactive access.
 */
export class DocsConnector {
  private docs: DocsV1.Docs;
  private sheets: SheetsV4.Sheets;

  constructor() {
    console.log("Initializing DocsConnector...");
    const auth = new google.auth.GoogleAuth({
      keyFile: KEYFILE,
      // Scopes for creating/editing Docs and Sheets
      scopes: [
        "https://www.googleapis.com/auth/documents",
        "https://www.googleapis.com/auth/spreadsheets",
      ],
    });

    this.docs = google.docs({ version: "v1", auth: auth as any });
    this.sheets = google.sheets({ version: "v4", auth: auth as any });
    console.log(
      "DocsConnector initialized with service account authentication."
    );
  }

  /**
   * Creates a new Google Document with initial content.
   * @param title - The title of the new document.
   * @param content - The initial text content.
   * @returns A promise resolving to the created document object.
   */
  public async createDoc(
    title: string,
    content: string
  ): Promise<GaxiosResponse<DocsV1.Schema$Document>> {
    try {
      // Create the new document
      const createResponse = await this.docs.documents.create({
        requestBody: {
          title: title,
        },
      });

      const documentId = createResponse.data.documentId!;

      // Insert content into the new document
      const updateResponse = await this.docs.documents.batchUpdate({
        documentId: documentId,
        requestBody: {
          requests: [
            {
              insertText: {
                text: content,
                location: {
                  index: 1, // Start after the document title
                },
              },
            },
          ],
        },
      });

      console.log(
        `Successfully created Google Doc: ${title} (ID: ${documentId})`
      );
      return createResponse;
    } catch (error) {
      console.error("Error creating Google Doc:", error);
      throw new Error("Failed to create or update Google Document.");
    }
  }

  /**
   * Appends a row of structured data (e.g., system metrics) to a Google Sheet.
   * @param spreadsheetId - The ID of the target spreadsheet.
   * @param sheetName - The name of the sheet (e.g., 'DailyMetrics').
   * @param data - An array of strings/numbers representing the row data.
   * @returns A promise resolving to the append response.
   */
  public async appendSheetRow(
    spreadsheetId: string,
    sheetName: string,
    data: (string | number)[]
  ): Promise<GaxiosResponse<SheetsV4.Schema$AppendValuesResponse>> {
    try {
      const range = `${sheetName}!A1`; // Appends to the first available row

      const response = await this.sheets.spreadsheets.values.append({
        spreadsheetId: spreadsheetId,
        range: range,
        valueInputOption: "USER_ENTERED", // Interprets values as text/formulas
        requestBody: {
          values: [data],
        },
      });

      console.log(`Successfully appended row to Sheet: ${sheetName}`);
      return response;
    } catch (error) {
      console.error("Error appending row to Google Sheet:", error);
      throw new Error("Failed to append data to Google Sheet.");
    }
  }
}
