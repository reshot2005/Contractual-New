import fs from "fs"
import path from "path"

export function getAdminCreds() {
  const envEmail = process.env.ADMIN_EMAIL
  const envHash = process.env.ADMIN_PASSWORD_HASH
  
  if (envEmail && envHash) {
    return { email: envEmail, hash: envHash }
  }
  
  // Fallback for cases where .env is not picking up during runtime
  try {
    const configPath = path.join(process.cwd(), "config", "admin-config.json")
    if (fs.existsSync(configPath)) {
      const data = JSON.parse(fs.readFileSync(configPath, "utf8"))
      return { email: data.email, hash: data.hash }
    }
  } catch (e) {
    console.error("[getAdminCreds] fallback failed", e)
  }
  
  return { email: null, hash: null }
}
