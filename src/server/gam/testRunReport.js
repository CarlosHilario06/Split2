import fs from "fs";
import { google } from "googleapis";

const NETWORK_CODE = "23174459617";
const REPORT_ID = "7460106012";
const RESULT_ID = "9685530131";

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

async function fetchRows() {
  try {
    console.log("⏳ Buscando linhas do relatório...");

    const res = await auth.request({
      url: `https://admanager.googleapis.com/v1/networks/${NETWORK_CODE}/reports/${REPORT_ID}/results/${RESULT_ID}:fetchRows?pageSize=10000`,
      method: "GET",
    });

    console.log("✅ Linhas recebidas:");
    console.log(JSON.stringify(res.data, null, 2));
  } catch (error) {
    console.error("❌ Erro:");
    console.error(error.response?.data || error.message || error);
  }
}

fetchRows();