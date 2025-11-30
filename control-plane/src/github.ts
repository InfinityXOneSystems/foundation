import fs from "fs";
import jwt from "jsonwebtoken";
import fetch from "node-fetch";

const GITHUB_API = "https://api.github.com";

export function createAppJWT(appId: string, privateKeyPath: string): string {
  const now = Math.floor(Date.now() / 1000);
  const privateKey = fs.readFileSync(privateKeyPath, "utf-8");
  const payload = { iat: now - 60, exp: now + 600, iss: appId };
  return jwt.sign(payload, privateKey, { algorithm: "RS256" });
}

export async function exchangeInstallationToken(jwtToken: string, installationId: string): Promise<string> {
  const url = `${GITHUB_API}/app/installations/${installationId}/access_tokens`;
  const r = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${jwtToken}`, Accept: "application/vnd.github+json" },
  });
  if (!r.ok) throw new Error(`Installation token exchange failed: ${r.status} ${await r.text()}`);
  const body = (await r.json()) as { token: string };
  return body.token;
}
