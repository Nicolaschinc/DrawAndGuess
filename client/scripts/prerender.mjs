import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientRoot = path.resolve(__dirname, "..");
const distDir = path.join(clientRoot, "dist");
const ssrBundlePath = path.join(clientRoot, "dist-ssr", "entry-server.js");

const staticRoutes = [
  "/en",
  "/zh",
  "/en/about",
  "/zh/about",
  "/en/privacy",
  "/zh/privacy",
  "/en/contact",
  "/zh/contact",
];

const originalConsoleError = console.error;
console.error = (...args) => {
  const firstMessage = String(args[0] ?? "");
  if (firstMessage.includes("Warning: useLayoutEffect does nothing on the server")) {
    return;
  }
  originalConsoleError(...args);
};

function injectRoot(template, appHtml) {
  return template.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`);
}

function stripSeoHead(template) {
  return template
    .replace(/<title>[\s\S]*?<\/title>/i, "")
    .replace(/<meta[^>]+name="description"[^>]*>\n?/gi, "")
    .replace(/<meta[^>]+name="robots"[^>]*>\n?/gi, "")
    .replace(/<meta[^>]+property="og:[^"]+"[^>]*>\n?/gi, "")
    .replace(/<meta[^>]+name="twitter:[^"]+"[^>]*>\n?/gi, "")
    .replace(/<link[^>]+rel="canonical"[^>]*>\n?/gi, "")
    .replace(/<link[^>]+rel="alternate"[^>]+hreflang="[^"]+"[^>]*>\n?/gi, "");
}

function applyHelmet(template, helmet) {
  const cleanedTemplate = stripSeoHead(template);
  const htmlAttrs = helmet?.htmlAttributes?.toString?.() || "";
  const bodyAttrs = helmet?.bodyAttributes?.toString?.() || "";
  const headTags = [
    helmet?.title?.toString?.() || "",
    helmet?.priority?.toString?.() || "",
    helmet?.meta?.toString?.() || "",
    helmet?.link?.toString?.() || "",
    helmet?.script?.toString?.() || "",
  ]
    .filter(Boolean)
    .join("\n");

  return cleanedTemplate
    .replace(/<html[^>]*>/i, htmlAttrs ? `<html ${htmlAttrs}>` : "<html>")
    .replace(/<body[^>]*>/i, bodyAttrs ? `<body ${bodyAttrs}>` : "<body>")
    .replace("</head>", `${headTags}\n</head>`);
}

async function writeRouteHtml(route, html) {
  const outputDir = path.join(distDir, route.replace(/^\/+/, ""));
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(path.join(outputDir, "index.html"), html, "utf8");
}

async function main() {
  const template = await fs.readFile(path.join(distDir, "index.html"), "utf8");
  const { render } = await import(pathToFileURL(ssrBundlePath).href);

  for (const route of staticRoutes) {
    const publicPath = `/drawguess${route}`;
    const rendered = await render(publicPath);
    const withApp = injectRoot(template, rendered.appHtml);
    const finalHtml = applyHelmet(withApp, rendered.helmet);
    await writeRouteHtml(route, finalHtml);
  }
}

main().catch((error) => {
  console.error("[prerender] Failed to prerender static routes.");
  console.error(error);
  process.exitCode = 1;
});
