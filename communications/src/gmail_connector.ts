import { google } from "googleapis";
import { GaxiosResponse } from "gaxios";
import { gmail_v1 as GmailV1 } from "googleapis/build/src/apis/gmail";

// Define the assumed environment variable for service account credentials
const KEYFILE =
  process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  "./google-service-account-key.json";
const USER_EMAIL = "me"; // Special value for the authenticated service account user

/**
 * Manages autonomous read/write operations for Gmail, enabling deep intelligence ingestion.
 * Uses a Google Service Account for 24/7 non-interactive access.
 */
export class GmailConnector {
  private gmail: GmailV1.Gmail;

  constructor() {
    console.log("Initializing GmailConnector...");
    const auth = new google.auth.GoogleAuth({
      keyFile: KEYFILE,
      // Required scopes for read, write, and modifying emails (e.g., marking as read/archived)
      scopes: [
        "https://www.googleapis.com/auth/gmail.modify",
        "https://www.googleapis.com/auth/gmail.send",
      ],
    });

    // The auth client must be acquired asynchronously, but we initialize the Gmail object
    // using the configured auth object which handles the token flow internally.
    this.gmail = google.gmail({ version: "v1", auth: auth as any });
    console.log(
      "GmailConnector initialized with service account authentication."
    );
  }

  /**
   * Retrieves and parses new emails matching a specific Gmail query.
   * @param query - A standard Gmail search query (e.g., "subject:SGP unread after:2025/11/01").
   * @returns A promise resolving to an array of parsed email objects.
   */
  public async ingest(query: string): Promise<any[]> {
    try {
      const listResponse: GaxiosResponse<GmailV1.Schema$ListMessagesResponse> =
        await this.gmail.users.messages.list({
          userId: USER_EMAIL,
          q: query,
          maxResults: 10,
        });

      const messages = listResponse.data.messages || [];
      if (messages.length === 0) {
        console.log(`No emails found matching query: ${query}`);
        return [];
      }

      const parsedEmails = await Promise.all(
        messages.map(async (message) => {
          const getResponse = await this.gmail.users.messages.get({
            userId: USER_EMAIL,
            id: message.id!,
            format: "full", // 'full' or 'raw' for content
          });

          // Simplified parsing to extract basic details and body (Vision Subsystem handles deep parsing)
          const headers = getResponse.data.payload?.headers;
          const body = getResponse.data.snippet;
          const subject = headers?.find((h) => h.name === "Subject")?.value;
          const from = headers?.find((h) => h.name === "From")?.value;

          return {
            id: message.id,
            threadId: message.threadId,
            subject: subject,
            from: from,
            snippet: body, // The snippet is used for initial Vision processing
            date: headers?.find((h) => h.name === "Date")?.value,
            rawContent: getResponse.data.raw, // Provide raw content for deep processing if needed
          };
        })
      );

      console.log(
        `Successfully ingested and parsed ${parsedEmails.length} emails.`
      );
      return parsedEmails;
    } catch (error) {
      console.error("Error during Gmail ingestion:", error);
      throw new Error("Failed to ingest emails from Gmail.");
    }
  }

  /**
   * Sends an email autonomously from the service account user.
   * @param to - Recipient email address.
   * @param subject - Email subject line.
   * @param body - Plain text or HTML body of the email.
   */
  public async send(
    to: string,
    subject: string,
    body: string
  ): Promise<GaxiosResponse<GmailV1.Schema$Message>> {
    try {
      const emailContent = [
        `To: ${to}`,
        `Subject: ${subject}`,
        'Content-Type: text/plain; charset="UTF-8"',
        "",
        body,
      ].join("\n");

      const encodedMessage = Buffer.from(emailContent)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");

      const response = await this.gmail.users.messages.send({
        userId: USER_EMAIL,
        requestBody: {
          raw: encodedMessage,
        },
      });

      console.log(
        `Successfully sent email to ${to} with ID: ${response.data.id}`
      );
      return response;
    } catch (error) {
      console.error("Error sending email:", error);
      throw new Error("Failed to send email via Gmail.");
    }
  }

  /**
   * Marks a specific email as processed (e.g., removing the 'UNREAD' label and adding a 'PROCESSED' label).
   * @param emailId - The ID of the email to mark.
   */
  public async markAsProcessed(emailId: string): Promise<void> {
    try {
      await this.gmail.users.messages.modify({
        userId: USER_EMAIL,
        id: emailId,
        requestBody: {
          removeLabelIds: ["UNREAD"],
          addLabelIds: ["INBOX_PROCESSED_BY_AGI"], // Example label for tracking autonomous activity
        },
      });
      console.log(`Email ${emailId} marked as processed.`);
    } catch (error) {
      console.error(`Error marking email ${emailId} as processed:`, error);
      throw new Error("Failed to modify email labels.");
    }
  }
}
