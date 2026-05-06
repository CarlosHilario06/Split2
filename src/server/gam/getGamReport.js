import fs from "fs";
import { google } from "googleapis";
import { parseGamRows } from "./parseGamRows.js";

const NETWORK_CODE = "23174459617";
const REPORT_ID = "7460106012";

const credentials = JSON.parse(
  fs.readFileSync(new URL("./oauth.json", import.meta.url), "utf8")
);

const token = JSON.parse(
  fs.readFileSync(new URL("./token.json", import.meta.url), "utf8")
);

const { client_id, client_secret, redirect_uris } = credentials.installed;

const auth = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uris[0]
);

auth.setCredentials(token);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getGamReportRows() {
  console.log("⏳ Rodando relatório GAM...");

  const runResponse = await auth.request({
    url: `https://admanager.googleapis.com/v1/networks/${NETWORK_CODE}/reports/${REPORT_ID}:run`,
    method: "POST",
    data: {},
  });

  const operationName = runResponse.data.name;

  console.log("📄 Operação:", operationName);

  let operation;

  for (let i = 0; i < 20; i++) {
    const statusResponse = await auth.request({
      url: `https://admanager.googleapis.com/v1/${operationName}`,
      method: "GET",
    });

    operation = statusResponse.data;

    if (operation.done) {
      break;
    }

    console.log("⏳ Aguardando relatório ficar pronto...");
    await sleep(3000);
  }

  if (!operation?.done) {
    throw new Error("Relatório GAM não ficou pronto a tempo");
  }

  const reportResult = operation.response?.reportResult;

  if (!reportResult) {
    throw new Error("GAM não retornou reportResult");
  }

  console.log("✅ Relatório pronto:", reportResult);

  const rowsResponse = await auth.request({
    url: `https://admanager.googleapis.com/v1/${reportResult}:fetchRows?pageSize=10000`,
    method: "GET",
  });

  return parseGamRows(rowsResponse.data.rows || []);
}

export function parseGamCsv(filePath) {
  const content = fs.readFileSync(filePath, "utf8");

  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const result = [];

  for (const line of lines) {
    if (line.toLowerCase().startsWith("chaves-valor")) continue;

    const [keyValue, impressionsRaw, ecpmRaw, revenueRaw] = line
      .split(",")
      .map((item) => item.trim());

    if (!keyValue?.startsWith("utm_campaign=")) continue;

    result.push({
      key: "utm_campaign",
      value: keyValue.replace("utm_campaign=", ""),
      impressions: Number(impressionsRaw || 0),
      ecpm: Number(ecpmRaw || 0),
      revenue: Number(revenueRaw || 0),
    });
  }

  return result;
}