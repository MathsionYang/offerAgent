const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Max-Age": "86400",
};

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    const requestUrl = new URL(request.url);
    if (requestUrl.pathname !== "/chat/completions") {
      return jsonResponse({ error: "Only /chat/completions is supported" }, 404);
    }

    const upstreamBaseUrl = (env.UPSTREAM_BASE_URL || "").replace(/\/$/, "");
    if (!upstreamBaseUrl) {
      return jsonResponse({ error: "Missing UPSTREAM_BASE_URL" }, 500);
    }

    const authorization = request.headers.get("authorization");
    if (!authorization) {
      return jsonResponse({ error: "Missing Authorization header" }, 401);
    }

    const upstreamResponse = await fetch(`${upstreamBaseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        authorization,
        "content-type": request.headers.get("content-type") || "application/json; charset=utf-8",
      },
      body: request.body,
    });

    const headers = new Headers(upstreamResponse.headers);
    Object.entries(corsHeaders).forEach(([key, value]) => headers.set(key, value));

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers,
    });
  },
};

function jsonResponse(payload, status) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "content-type": "application/json; charset=utf-8",
    },
  });
}
