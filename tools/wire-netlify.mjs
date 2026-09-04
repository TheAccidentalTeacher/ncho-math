/**
 * wire-netlify.mjs — connect this Netlify site to its GitHub repo so PUSH IS THE DEPLOY.
 *
 *     node tools/wire-netlify.mjs
 *
 * `netlify init` cannot do this headlessly — it wants interactive GitHub OAuth and dies on a
 * closed stdin. So it goes through the API in four steps:
 *
 *   1. ask Netlify for a deploy key          POST /api/v1/deploy_keys
 *   2. install the public half on the repo   gh api repos/<o>/<r>/keys  (read_only)
 *   3. point the site at the repo            PATCH /api/v1/sites/<id>
 *   4. add the push webhook                  gh api repos/<o>/<r>/hooks
 *
 * ⚠️ A CLI-only site is HALF a deploy. `netlify deploy` ships once, by hand, and a site that only
 * redeploys by hand rots. This finishes the wiring so a plain `git push` is enough.
 *
 * The token is read from the Netlify CLI's own config and is never printed.
 */
import { readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { homedir } from "node:os";
import { join } from "node:path";

const SITE_ID = "2aab7c66-df33-4c5f-8d26-ce02e5c33043";
const REPO = "TheAccidentalTeacher/ncho-math";
const BRANCH = "master";
const PUBLISH_DIR = "site";

/* ------------------------------------------------- the token, never printed */
function token() {
  const candidates = [
    join(homedir(), "AppData", "Roaming", "netlify", "Config", "config.json"),
    join(homedir(), ".netlify", "config.json"),
  ];
  for (const f of candidates) {
    if (!existsSync(f)) continue;
    const cfg = JSON.parse(readFileSync(f, "utf8"));
    const user = Object.values(cfg.users || {})[0];
    const t = user?.auth?.token;
    if (t) return t;
  }
  throw new Error("No Netlify token found. Run `netlify login` first.");
}
const TOKEN = token();

async function netlify(method, path, body) {
  const res = await fetch("https://api.netlify.com/api/v1" + path, {
    method,
    headers: {
      Authorization: "Bearer " + TOKEN,
      ...(body ? { "Content-Type": "application/json" } : { "Content-Length": "0" }),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : {};
}

const gh = (args) =>
  JSON.parse(execFileSync("gh", args, { encoding: "utf8", maxBuffer: 1 << 22 }) || "{}");

/* ---------------------------------------------------------------- the wiring */
console.log(`wiring ${REPO} → Netlify site ${SITE_ID}\n`);

// 1 ---------------------------------------------------------------------------
const key = await netlify("POST", "/deploy_keys");
console.log(`1. netlify deploy key created   id ${key.id}`);

// 2 --- install the PUBLIC half on the repo, read-only. Netlify keeps the private half.
const existing = gh(["api", `repos/${REPO}/keys`]);
const already = Array.isArray(existing) && existing.find((k) => k.key === key.public_key.trim());
let ghKeyId;
if (already) {
  ghKeyId = already.id;
  console.log(`2. github deploy key already present   id ${ghKeyId}`);
} else {
  const added = gh(["api", `repos/${REPO}/keys`,
    "-f", `title=Netlify ${REPO.split("/")[1]}`,
    "-f", `key=${key.public_key}`,
    "-F", "read_only=true"]);
  ghKeyId = added.id;
  console.log(`2. github deploy key installed   id ${ghKeyId}   read_only ${added.read_only}`);
}

// 3 --- point the site at the repo. cmd stays EMPTY: this site has no build step, on purpose.
const site = await netlify("PATCH", `/sites/${SITE_ID}`, {
  repo: {
    provider: "github",
    repo_path: REPO,
    repo_branch: BRANCH,
    deploy_key_id: key.id,
    dir: PUBLISH_DIR,
    cmd: "",
  },
});
const b = site.build_settings || {};
console.log(`3. site wired`);
console.log(`     repo      ${b.repo_url || "(none)"}`);
console.log(`     branch    ${b.repo_branch || "(none)"}`);
console.log(`     publish   ${b.dir || "(none)"}`);
console.log(`     build cmd ${JSON.stringify(b.cmd)}   ← empty is correct, there is no build`);

// 4 --- the push webhook, so a commit actually triggers a deploy
const hooks = gh(["api", `repos/${REPO}/hooks`]);
const hookUrl = "https://api.netlify.com/hooks/github";
const hasHook = Array.isArray(hooks) && hooks.some((h) => h.config?.url === hookUrl);
if (hasHook) {
  console.log("4. push webhook already present");
} else {
  const hook = gh(["api", `repos/${REPO}/hooks`,
    "-f", "name=web",
    "-f", "events[]=push",
    "-F", "active=true",
    "-f", `config[url]=${hookUrl}`,
    "-f", "config[content_type]=json"]);
  console.log(`4. push webhook created   id ${hook.id}`);
}

console.log(`\nDone. Now prove it: make a real commit, push, and watch the deploy fire.`);
console.log(`     https://app.netlify.com/projects/ncho-math/deploys`);
