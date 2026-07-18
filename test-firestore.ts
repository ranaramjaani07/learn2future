import fetch from "node-fetch";
import fs from "fs";

async function main() {
  const firebaseConfig = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
  const REST_PROJECT_ID = firebaseConfig.projectId;
  const REST_DATABASE_ID = firebaseConfig.firestoreDatabaseId || "(default)";
  const REST_API_KEY = firebaseConfig.apiKey;
  const REST_BASE_URL = `https://firestore.googleapis.com/v1/projects/${REST_PROJECT_ID}/databases/${REST_DATABASE_ID}/documents`;

  const url = `${REST_BASE_URL}/settings/paymentGateway?key=${REST_API_KEY}`;
  const response = await fetch(url);
  if (response.ok) {
    const data = await response.json();
    console.log("FIRESTORE PAYMENTGATEWAY CURRENT VALUE:");
    console.log(JSON.stringify(data, null, 2));
  } else {
    console.error("Failed to fetch settings/paymentGateway:", response.status, await response.text());
  }
}

main().catch(console.error);
