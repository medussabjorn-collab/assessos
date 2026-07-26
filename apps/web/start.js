// Railway's own healthcheck prober hits whatever PORT value the platform
// injects (observed: 8080) -- not the public domain's manually-configured
// Target Port. The app must listen on Railway's injected PORT for the
// healthcheck to pass; only fall back to 3001 for non-Railway (local) runs
// where PORT is genuinely unset. The public domain's Target Port setting
// must be kept in sync with whatever value Railway actually injects here.
process.env.PORT = process.env.PORT || "3001";
process.env.HOSTNAME = "0.0.0.0";

const fs = require("fs");
const path = require("path");

// The standalone server.js location differs depending on how this app is
// built/run: a Docker image that flattens `.next/standalone` into the
// image root puts it at <root>/apps/web/server.js, while running directly
// from the monorepo (cwd = apps/web, e.g. `pnpm --filter @assessos/web
// start`) keeps it at apps/web/.next/standalone/apps/web/server.js. Try
// both, relative to this file, so it works in either environment.
const candidates = [
    path.join(__dirname, "apps/web/server.js"),
    path.join(__dirname, ".next/standalone/apps/web/server.js"),
  ];

const serverPath = candidates.find((p) => fs.existsSync(p));

if (!serverPath) {
    console.error("Could not locate standalone server.js. Checked:", candidates);
    process.exit(1);
}

require(serverPath);
