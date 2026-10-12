export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    const email = request.headers.get("cf-access-authenticated-user-email") || "user@example.com";
    const timestamp = new Date().toUTCString();
    const country = (request.cf && request.cf.country) ? request.cf.country : "US";

    if (pathname === "/secure" || pathname === "/secure/") {
      const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Secure Identity Information</title>
</head>
<body>
    <p>${email} authenticated at ${timestamp} from <a href="/secure/${country}">${country}</a></p>
</body>
</html>`;

      return new Response(html, {
        headers: { "Content-Type": "text/html;charset=UTF-8" },
      });
    }

    if (pathname.startsWith("/secure/")) {
      const parts = pathname.split("/");
      const requestedCountry = parts[2] ? parts[2].toUpperCase() : "";

      if (!requestedCountry) {
        return new Response("Country not specified", { status: 400 });
      }

      const flagKey = `${requestedCountry}.png`;
      const object = await env.MY_BUCKET.get(flagKey);

      if (object === null) {
        return new Response(`Flag for ${requestedCountry} not found`, { status: 404 });
      }

      const contentType = object.httpMetadata?.contentType || "image/png";
      return new Response(object.body, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=86400",
        },
      });
    }

    return new Response("Not Found", { status: 404 });
  },
};
