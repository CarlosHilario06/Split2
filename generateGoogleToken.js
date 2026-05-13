import "dotenv/config";
import readline from "readline";
import { google } from "googleapis";

const credentials = JSON.parse(process.env.GAM_OAUTH_JSON);

const { client_id, client_secret, redirect_uris } =
  credentials.installed;

const auth = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uris[0]
);

const SCOPES = [
  "https://www.googleapis.com/auth/dfp",
  "https://www.googleapis.com/auth/analytics.readonly",
];

const authUrl = auth.generateAuthUrl({
  access_type: "offline",
  scope: SCOPES,
});

console.log("\n🔗 Autorize aqui:\n");
console.log(authUrl);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("\nCole o código aqui: ", async (code) => {
  try {
    const { tokens } = await auth.getToken(code);

    console.log("\n✅ TOKEN:\n");
    console.log(JSON.stringify(tokens));

    rl.close();
  } catch (error) {
    console.error("Erro:", error);
    rl.close();
  }
});