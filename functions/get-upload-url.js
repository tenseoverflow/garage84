const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "https://iti0105-2025-henria-8677f9d4cfe568a44fbafb8744c2c2c9ff17e1c509f.pages.taltech.ee",
];

function getCorsHeaders(request) {
  const origin = request.headers.get("Origin");
  const allowOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : "*";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

export default {
  async fetch(request, env) {
    const corsHeaders = getCorsHeaders(request);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method === "POST") {
      return handleUpload(request, env, corsHeaders);
    }

    if (request.method === "DELETE") {
      return handleDelete(request, env, corsHeaders);
    }

    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders,
    });
  },
};

async function handleUpload(request, env, corsHeaders) {
  try {
    if (!env.BUCKET) {
      console.error("BUCKET binding not found");
      return new Response(
        JSON.stringify({ success: false, error: "R2 bucket not configured" }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    const contentType = request.headers.get("Content-Type");
    console.log("Upload request - Content-Type:", contentType);

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!contentType || !allowedTypes.includes(contentType)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Invalid content type: ${contentType}`,
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    const contentLength = request.headers.get("Content-Length");
    const maxSize = 5 * 1024 * 1024;
    if (contentLength && parseInt(contentLength) > maxSize) {
      return new Response(
        JSON.stringify({ success: false, error: "File too large (max 5MB)" }),
        {
          status: 413,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const extension = contentType.split("/")[1].replace("jpeg", "jpg");
    const filename = `rooms/${timestamp}-${randomStr}.${extension}`;

    console.log("Uploading to R2:", filename);

    await env.BUCKET.put(filename, request.body, {
      httpMetadata: {
        contentType: contentType,
      },
    });

    console.log("Upload successful!");

    const publicUrl = `${env.R2_PUBLIC_URL}/${filename}`;

    return new Response(
      JSON.stringify({ success: true, url: publicUrl, filename: filename }),
      {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error("Error uploading to R2:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Upload failed",
        details: String(error),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }
}

async function handleDelete(request, env, corsHeaders) {
  try {
    if (!env.BUCKET) {
      console.error("BUCKET binding not found");
      return new Response(
        JSON.stringify({ success: false, error: "R2 bucket not configured" }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    const url = new URL(request.url);
    const filename = url.searchParams.get("filename");

    if (!filename) {
      return new Response(
        JSON.stringify({ success: false, error: "Filename required" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    // Only allow deleting files in the rooms/ folder
    if (!filename.startsWith("rooms/")) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid filename" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    console.log("Deleting from R2:", filename);

    await env.BUCKET.delete(filename);

    console.log("Delete successful!");

    return new Response(JSON.stringify({ success: true, filename: filename }), {
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error("Error deleting from R2:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Delete failed",
        details: String(error),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }
}
