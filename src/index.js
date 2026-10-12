// src/index.ts
interface Env {
  MY_BUCKET: R2Bucket;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Route: /secure/${COUNTRY}
    const countryMatch = path.match(/^\/secure\/([A-Za-z]{2})$/);
    if (countryMatch) {
      const country = countryMatch[1].toUpperCase();
      try {
        const object = await env.MY_BUCKET.get(`${country}.png`);
        if (!object) {
          return new Response("Flag not found", { status: 404 });
        }

        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set("Content-Type", "image/png");

        return new Response(object.body, {
          headers,
        });
      } catch (error) {
        console.error("R2 fetch error:", error);
        return new Response("Internal Server Error", { status: 500 });
      }
    }

    // Route: /secure
    if (path === "/secure" || path === "/secure/") {
      // Extract authentication metadata provided by Cloudflare Access
      const email = request.headers.get("cf-access-authenticated-user-email") || "user@cloudflare.com";
      const country = request.headers.get("cf-ipcountry") || "US";
      const timestamp = new Date().toISOString();

      const html = `<!DOCTYPE html>
      <html>
      <head>
          <meta charset="utf-8">
          <title>Secure Identity</title>
      </head>
      <body>
          <p>${email} authenticated at ${timestamp} from <a href="/secure/${country}">${country}</a></p>
      </body>
      </html>`;

      return new Response(html, {
        headers: { "Content-Type": "text/html;charset=UTF-8" },
      });
    }

    return new Response("Not Found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
