const useRealMjml = process.env.USE_MJML === "true";

type MjmlRenderer = (template: string, options?: { beautify?: boolean; minify?: boolean }) => {
  html: string;
  errors: Array<{ message: string }>;
};

let mjmlRenderer: MjmlRenderer | null = null;

if (useRealMjml) {
  try {
    const mjmlModule = (await import("mjml")) as unknown;
    const resolved: MjmlRenderer | undefined =
      typeof mjmlModule === "function"
        ? (mjmlModule as MjmlRenderer)
        : (mjmlModule as { default?: MjmlRenderer }).default;

    if (resolved) {
      mjmlRenderer = (template, options) => resolved(template, options);
    }
  } catch (error) {
    console.warn("MJML dependency unavailable, falling back to basic HTML rendering.", error);
  }
}

export function renderMjml(template: string) {
  if (mjmlRenderer) {
    const { html, errors } = mjmlRenderer(template, {
      beautify: false,
      minify: true,
    });

    if (errors.length) {
      console.error("MJML render errors", errors);
    }

    return html;
  }

  return fallbackRender(template);
}

function fallbackRender(template: string): string {
  let content = template;
  const replacements: Array<[RegExp, string]> = [
    [/<\/\s*mjml\s*>/g, ""],
    [/<\s*mjml[^>]*>/g, ""],
    [/<\s*mj-head[^>]*>/g, "<head>"],
    [/<\s*\/\s*mj-head\s*>/g, "</head>"],
    [/<\s*mj-body[^>]*>/g, "<body style=\"margin:0;padding:0;background-color:#f6f7f9;\">"],
    [/<\s*\/\s*mj-body\s*>/g, "</body>"],
    [/<\s*mj-section[^>]*>/g, "<section style=\"margin:24px auto;max-width:640px;background-color:#ffffff;padding:32px;border-radius:24px;\">"],
    [/<\s*\/\s*mj-section\s*>/g, "</section>"],
    [/<\s*mj-column[^>]*>/g, "<div style=\"margin:0 auto;\">"],
    [/<\s*\/\s*mj-column\s*>/g, "</div>"],
    [/<\s*mj-text[^>]*>/g, "<p style=\"margin:0 0 16px 0;font-family:'Helvetica Neue',Arial,sans-serif;color:#161616;\">"],
    [/<\s*\/\s*mj-text\s*>/g, "</p>"],
    [/<\s*mj-button[^>]*href=\"([^\"]+)\"[^>]*>([\s\S]*?)<\s*\/\s*mj-button\s*>/g, "<p><a href=\"$1\" style=\"display:inline-block;padding:12px 24px;border-radius:9999px;background-color:#111827;color:#ffffff;text-decoration:none;\">$2</a></p>"],
    [/<\s*mj-button[^>]*>([\s\S]*?)<\s*\/\s*mj-button\s*>/g, "<p><span style=\"display:inline-block;padding:12px 24px;border-radius:9999px;background-color:#111827;color:#ffffff;\">$1</span></p>"],
    [/<\s*mj-style[^>]*>([\s\S]*?)<\s*\/\s*mj-style\s*>/g, "<style>$1</style>"],
    [/<\s*mj-title\s*>([\s\S]*?)<\s*\/\s*mj-title\s*>/g, "<title>$1</title>"],
  ];

  for (const [pattern, replacement] of replacements) {
    content = content.replace(pattern, replacement);
  }

  const headMatch = content.match(/<head>[\s\S]*?<\/head>/i);
  const head = headMatch ? headMatch[0] : "<head></head>";
  const withoutHead = headMatch ? content.replace(headMatch[0], "") : content;
  const bodyMatch = withoutHead.match(/<body[\s\S]*?<\/body>/i);
  const body = bodyMatch ? bodyMatch[0] : `<body>${withoutHead}</body>`;

  return `<!doctype html><html>${head}${body}</html>`;
}
