import fs from "fs";
import readline from "readline";
import { google } from "googleapis";

const credentials = JSON.parse(
  fs.readFileSync(new URL("./oauth.json", import.meta.url), "utf8")
);

const { client_id, client_secret, redirect_uris } =
  credentials.installed;

const auth = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uris[0]
);

const SCOPES = [
  "https://www.googleapis.com/auth/admanager",
];

const authUrl = auth.generateAuthUrl({
  access_type: "offline",
  scope: SCOPES,
});

console.log("\nAbra esta URL:\n");
console.log(authUrl);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("\nCole o código aqui: ", async (code) => {
  const { tokens } = await auth.getToken(code);

  fs.writeFileSync(
    "./token.json",
    JSON.stringify(tokens, null, 2)
  );

  console.log("\n✅ token.json gerado!");
  rl.close();
});