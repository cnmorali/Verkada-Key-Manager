// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Supabase admin client
const supabaseUrl = Deno.env.get("PROJECT_URL")!;
const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, serviceRoleKey);

console.log("refresh-verkada-token loaded");

console.log("Loaded VERKADA_API_KEY =", Deno.env.get("VERKADA_API_KEY"));

Deno.serve(async () => {
  const apiKey = Deno.env.get("VERKADA_API_KEY");

  if (!apiKey) {
    console.error("Missing VERKADA_API_KEY in secrets");
    return new Response(
      JSON.stringify({ error: "Missing VERKADA_API_KEY" }),
      { status: 500 }
    );
  }

  console.log("Requesting Verkada token…");

  const resp = await fetch("https://api.verkada.com/token", {
    method: "POST",
    headers: {
      accept: "application/json",
      "x-api-key": apiKey,
    },
  });

  if (!resp.ok) {
    const err = await resp.text();
    console.error("Verkada token request failed:", err);
    return new Response(
      JSON.stringify({ error: "Verkada token request failed", detail: err }),
      { status: 500 }
    );
  }

  const json = await resp.json();
  const token = json.token;
  const expiresAt = Date.now() + 25 * 60 * 1000; // expires in ~25 min

  // Store in DB
  const insert = await supabase
    .from("verkada_tokens")
    .insert({
      token,
      expires_at: expiresAt,
    });

  if (insert.error) {
    console.error("DB insert error:", insert.error);
    return new Response(
      JSON.stringify({ error: "Failed storing token", detail: insert.error }),
      { status: 500 }
    );
  }

  console.log("Token stored successfully.");

  return new Response(
    JSON.stringify({ success: true, token, expiresAt }),
    { headers: { "Content-Type": "application/json" } }
  );
});


/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/refresh-verkada-token' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
