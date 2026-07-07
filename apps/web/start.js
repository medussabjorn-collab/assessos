// Railway injects PORT at the platform level (typically 8080). We respect
// that value so the healthcheck probe and the app listen on the same port.
// Falling back to 3001 preserves the existing behaviour for local development.
process.env.PORT = process.env.PORT || "3001";
process.env.HOSTNAME = "0.0.0.0";

require("./apps/web/server.js");
