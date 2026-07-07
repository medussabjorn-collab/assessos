// Railway's Metal builder injects PORT=8080 at the platform level, which
// wins over shell-level env assignments (e.g. `PORT=3001 node server.js`).
// Setting process.env synchronously here — before any require() runs — is
// the only reliable way to ensure the Next.js server binds to the correct
// port and hostname regardless of what the platform environment contains.
process.env.PORT = "3001";
process.env.HOSTNAME = "0.0.0.0";

require("./apps/web/server.js");
