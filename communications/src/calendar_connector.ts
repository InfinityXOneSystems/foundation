import { google } from "googleapis";
import { GaxiosResponse } from "gaxios";
import { calendar_v3 as CalendarV3 } from "googleapis/build/src/apis/calendar";

const KEYFILE =
  process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  "./google-service-account-key.json";
const DEFAULT_CALENDAR_ID = "primary"; // Target the user's primary calendar

/**
 * Manages autonomous read/write operations for Google Calendar, enabling strategic scheduling.
 * Uses a Google Service Account for 24/7 non-interactive access.
 */
export class CalendarConnector {
  private calendar: CalendarV3.Calendar;

  constructor() {
    console.log("Initializing CalendarConnector...");
    const auth = new google.auth.GoogleAuth({
      keyFile: KEYFILE,
      // Required scope for full read/write access to the user's calendar
      scopes: ["https://www.googleapis.com/auth/calendar"],
    });

    this.calendar = google.calendar({ version: "v3", auth: auth as any });
    console.log(
      "CalendarConnector initialized with service account authentication."
    );
  }

  /**
   * Creates a new calendar event based on strategic planning outputs.
   * @param summary - Event title.
   * @param start - Start date/time.
   * @param end - End date/time.
   * @param attendees - Array of attendee emails.
   */
  public async scheduleEvent(
    summary: string,
    start: Date,
    end: Date,
    attendees: string[]
  ): Promise<GaxiosResponse<CalendarV3.Schema$Event>> {
    try {
      const event: CalendarV3.Schema$Event = {
        summary: summary,
        start: { dateTime: start.toISOString(), timeZone: "America/New_York" },
        end: { dateTime: end.toISOString(), timeZone: "America/New_York" },
        attendees: attendees.map((email) => ({ email: email })),
        reminders: {
          useDefault: false,
          overrides: [{ method: "popup", minutes: 30 }],
        },
      };

      const response = await this.calendar.events.insert({
        calendarId: DEFAULT_CALENDAR_ID,
        requestBody: event,
        sendUpdates: "all", // Notify all attendees of the new event
      });

      console.log(`Event scheduled successfully: ${response.data.htmlLink}`);
      return response;
    } catch (error) {
      console.error("Error scheduling event:", error);
      throw new Error("Failed to schedule event in Google Calendar.");
    }
  }

  /**
   * Checks the free/busy status for a given user during a time window.
   * @param start - Start date/time.
   * @param end - End date/time.
   * @param userEmail - The email of the user whose calendar is being checked.
   * @returns A promise resolving to the Free/Busy data.
   */
  public async getFreeBusy(
    start: Date,
    end: Date,
    userEmail: string
  ): Promise<GaxiosResponse<CalendarV3.Schema$FreeBusyResponse>> {
    try {
      const response = await this.calendar.freebusy.query({
        requestBody: {
          timeMin: start.toISOString(),
          timeMax: end.toISOString(),
          items: [{ id: userEmail }],
        },
      });

      console.log(`Free/Busy data retrieved for ${userEmail}.`);
      return response;
    } catch (error) {
      console.error("Error retrieving Free/Busy data:", error);
      throw new Error("Failed to retrieve Free/Busy data.");
    }
  }

  /**
   * Retrieves all events for the current day for task prioritization.
   * @returns A promise resolving to an array of today's calendar events.
   */
  public async getTodayEvents(): Promise<CalendarV3.Schema$Event[]> {
    try {
      const now = new Date();
      const startOfDay = new Date(now.setHours(0, 0, 0, 0)).toISOString();
      const endOfDay = new Date(now.setHours(23, 59, 59, 999)).toISOString();

      const response = await this.calendar.events.list({
        calendarId: DEFAULT_CALENDAR_ID,
        timeMin: startOfDay,
        timeMax: endOfDay,
        singleEvents: true,
        orderBy: "startTime",
      });

      const events = response.data.items || [];
      console.log(`Retrieved ${events.length} events for today.`);
      return events;
    } catch (error) {
      console.error("Error retrieving today's events:", error);
      throw new Error(
        "Failed to retrieve today's events from Google Calendar."
      );
    }
  }
}
