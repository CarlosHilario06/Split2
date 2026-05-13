import { google } from "googleapis";
import { auth } from "./getGamReport.js";

export async function getGamCampaignSessions({
  propertyId = process.env.GA_PROPERTY_ID,
  startDate = "7daysAgo",
  endDate = "today",
} = {}) {
  if (!propertyId) {
    throw new Error("GA_PROPERTY_ID não configurado");
  }

  const analyticsData = google.analyticsdata({
    version: "v1beta",
    auth,
  });

  const response = await analyticsData.properties.runReport({
    property: `properties/${propertyId}`,
    requestBody: {
      dateRanges: [
        {
          startDate,
          endDate,
        },
      ],

      dimensions: [
        {
          name: "sessionCampaignName",
        },
      ],

      metrics: [
        {
          name: "sessions",
        },
      ],

      limit: 10000,
    },
  });

  return (response.data.rows || []).map((row) => ({
    campaign:
      row.dimensionValues?.[0]?.value || "",

    sessions: Number(
      row.metricValues?.[0]?.value || 0
    ),
  }));
}