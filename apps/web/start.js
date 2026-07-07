// Railway's own healthcheck prober hits whatever PORT value the platform
// injects (observed: 8080) — not the public domain's manually-configured
// Target Port. The app must listen on Railway's injected PORT for the
// healthcheck to pass; only fall back to 3001 for non-Railway (local) runs
// where PORT is genuinely unset. The public domain's Target Port setting
// must be kept in sync with whatever value Railway actually injects here.
process.env.PORT = process.env.PORT || "3001";
process.env.HOSTNAME = "0.0.0.0";

require("./apps/web/server.js");
