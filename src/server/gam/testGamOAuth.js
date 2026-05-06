import fs from "fs";
import readline from "readline";
import { google } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/dfp"];

const credentials = JSON.parse(
  fs.readFileSync(new URL("./oauth.json", import.meta.url), "utf8")
);

const { client_secret, client_id, redirect_uris } = credentials.installed;

const oAuth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uris[0]
);

const tokenPath = new URL("./token.json", import.meta.url);

const authUrl = oAuth2Client.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: SCOPES,
});

console.log("👉 Abra este link no navegador:");
console.log(authUrl);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("Cole o código aqui: ", async (code) => {
  try {
    const { tokens } = await oAuth2Client.getToken(code.trim());

    fs.writeFileSync(tokenPath, JSON.stringify(tokens, null, 2), "utf8");

    console.log("✅ Autenticado com sucesso!");
    console.log("✅ token.json salvo em:");
    console.log(tokenPath.pathname);
  } catch (error) {
    console.error("❌ Erro ao gerar token:");
    console.error(error.response?.data || error.message || error);
  }

  rl.close();
});