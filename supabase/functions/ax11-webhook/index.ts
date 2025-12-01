// @ts-nocheck

//--------------------------------------------------------------
// Setup
//--------------------------------------------------------------
import { createClient } from "jsr:@supabase/supabase-js@2";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

console.log("AX11 Webhook Loaded");

//--------------------------------------------------------------
// Env
//--------------------------------------------------------------
const supabaseUrl = Deno.env.get("PROJECT_URL")!;
const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY")!;
const VERKADA_API_KEY = Deno.env.get("VERKADA_API_KEY")!;
const VERKADA_SHARED_SECRET = Deno.env.get("VERKADA_SHARED_SECRET")!;

const supabase = createClient(supabaseUrl, serviceRoleKey);

//--------------------------------------------------------------
// Constants
//--------------------------------------------------------------
// Your AX11 access controller ID
const ACCESS_CONTROLLER_ID = Deno.env.get("ACCESS_CONTROLLER_ID")!;

// Camera that captures snapshots of keybox ID
const CAMERA_ID = Deno.env.get("CAMERA_ID")!;

// AUX Input device -> Key number mapping
const keyMap = JSON.parse(Deno.env.get("KEYMAP") || "{}");
console.log("Loaded keyMap:", keyMap);

// Time window for badge events relative to AUX event in seconds before aux event
const BADGE_LOOKBACK = 900;
const BADGE_LOOKAHEAD = 15;

//--------------------------------------------------------------
// Verkada Token Cache
//--------------------------------------------------------------
let cachedToken: string | null = null;
let cachedExpiry = 0;

async function getVerkadaToken() {
  const now = Date.now();
  if (cachedToken && cachedExpiry > now) return cachedToken;

  console.log("[TOKEN] Refreshing Verkada token...");
  const resp = await fetch("https://api.verkada.com/token", {
    method: "POST",
    headers: { accept: "application/json", "x-api-key": VERKADA_API_KEY },
  });

  if (!resp.ok) {
    console.error("Failed to refresh token:", await resp.text());
    return null;
  }

  const json = await resp.json();
  cachedToken = json.token;
  cachedExpiry = now + 25 * 60 * 1000;

  console.log("[TOKEN] New token loaded");
  return cachedToken;
}

//--------------------------------------------------------------
// Normalize Verkada user object
//--------------------------------------------------------------
function normalizeUser(obj: any) {
  if (!obj) return null;

  const u =
    obj.userInfo ||
    obj.user_info ||
    obj ||
    null;

  if (!u) return null;

  const id = u.userId ?? u.user_id ?? null;
  const name =
    u.name ||
    u.fullName ||
    u.email ||
    u.displayName ||
    null;

  if (!id && !name) return null;

  return { userId: id, name };
}

//--------------------------------------------------------------
// Fetch most recent accepted keycard event & resolve when needed
//--------------------------------------------------------------
async function resolveMostRecentUser(auxTsSec: number) {
  console.log("Resolving user via Events API…");

  const token = await getVerkadaToken();
  if (!token) return null;

  // Search wide window
  const start = auxTsSec - 180;  // 3 minutes before
  const end   = auxTsSec + 5;    // small buffer after

  const url =
    `https://api.verkada.com/events/v1/access?` +
    `start_time=${start}` +
    `&end_time=${end}` +
    `&page_size=100`;

  console.log("User Search URL:", url);

  const resp = await fetch(url, {
    headers: { accept: "application/json", "x-verkada-auth": token },
  });

  if (!resp.ok) {
    console.error("Events API error:", await resp.text());
    return null;
  }

  const json = await resp.json();
  const events = json.events || [];

  const candidates = events.filter(evt => {
    const info = evt.event_info;
    if (!info) return false;

    // Must contain user
    if (!info.userId) return false;

    // Must come from AX11
    if (info.doorInfo?.accessControllerId !== ACCESS_CONTROLLER_ID) return false;

    const type = (evt.event_type || "").toLowerCase();
    const infoType = (info.type || "").toLowerCase();

    const accepted =
      info.accepted === true ||
      infoType.includes("accepted") ||
      type.includes("accepted");

    return accepted;
  });

  if (candidates.length === 0) {
    console.log("No badge events found");
    return null;
  }

  // Sort by timestamp descending to get most recent
  candidates.sort(
    (a, b) =>
      Date.parse(b.timestamp) -
      Date.parse(a.timestamp)
  );

  const evt = candidates[0];
  const info = evt.event_info;

  return {
    userId: info.userId,
    name: info.userName || info.name,
    accessEventTimestamp: Date.parse(evt.timestamp),
  };
}

//--------------------------------------------------------------
// Fetch user profile photo
//--------------------------------------------------------------
async function getUserPhoto(userId: string) {
  const token = await getVerkadaToken();
  if (!token) return null;

  const url =
    `https://api.verkada.com/access/v1/access_users/user/profile_photo?` +
    `user_id=${userId}&original=false`;

  const resp = await fetch(url, {
    headers: { accept: "application/json", "x-verkada-auth": token },
  });

  if (!resp.ok) return null;

  const blob = await resp.blob();
  const buf = await blob.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buf)));

  return `data:${blob.type};base64,${base64}`;
}

//--------------------------------------------------------------
// Fetch camera thumbnail (using AUX timestamp from webhook)
//--------------------------------------------------------------
async function getCameraThumbnail(unixTs: number) {
  const token = await getVerkadaToken();
  if (!token) return null;

  // Grab timestamp from webhook
  const url =
    `https://api.verkada.com/cameras/v1/footage/thumbnails?` +
    `camera_id=${CAMERA_ID}&timestamp=${unixTs}&resolution=low-res`;

  const resp = await fetch(url, {
    headers: { "x-verkada-auth": token },
  });

  if (!resp.ok) {
    console.log("Thumbnail error:", await resp.text());
    return null;
  }

  const blob = await resp.blob();
  const buf = await blob.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buf)));

  return `data:image/jpeg;base64,${base64}`;
}

//--------------------------------------------------------------
// Main access event handler
//--------------------------------------------------------------
async function handleEvent(rawBody: string) {
  let payload;
  try { payload = JSON.parse(rawBody); }
  catch { return new Response("Bad JSON", { status: 400 }); }

  const data = payload.data;
  if (!data) return new Response("Bad Payload", { status: 400 });

  // Only process AUX input events
  if (data.notification_type !== "door_auxinput_change_state") {
    return new Response(JSON.stringify({ ignored: true }), { status: 200 });
  }

  console.log("AUX Event:", JSON.stringify(payload, null, 2));

  //------------------------------------------------------
  // Prevent duplicate webhook execution (from weird wiring stuff)
  //------------------------------------------------------
  const webhookId = payload.webhook_id;
  const { data: seen } = await supabase
    .from("webhook_history")
    .select("webhook_id")
    .eq("webhook_id", webhookId)
    .maybeSingle();

  if (seen) {
    console.log("Duplicate webhook ignored:", webhookId);
    return new Response(JSON.stringify({ ignored: true }), { status: 200 });
  }

  // Record this webhook wsa processed
  await supabase.from("webhook_history").insert({ webhook_id: webhookId });


  //------------------------------------------------------
  // Identify key number
  //------------------------------------------------------
  const keyNumber = keyMap[data.device_id];
  if (!keyNumber) {
    console.log("Unknown AUX device");
    return new Response("Unknown key", { status: 200 });
  }

  //------------------------------------------------------
  // Determine if take or return
  //------------------------------------------------------
  const action = data.input_value === "True" ? "return" : "take";
  console.log("Action:", action);

  //------------------------------------------------------
  // Load current key state (present or taken)
  //------------------------------------------------------
  const { data: keyRow } = await supabase
    .from("keys")
    .select("status")
    .eq("key_number", keyNumber)
    .maybeSingle();

  //------------------------------------------------------
  // Debounce: Reject any take when the key is already taken
  //           Reject any return when the key is present
  //------------------------------------------------------
  if (keyRow) {
    if (action === "take" && keyRow.status === "taken") {
      console.log("[DEBOUNCE] Key already taken - ignoring TAKE");
      return new Response(JSON.stringify({ ignored: true }), { status: 200 });
    }

    if (action === "return" && keyRow.status === "present") {
      console.log("[DEBOUNCE] Duplicate RETURN — ignoring");
      return new Response(JSON.stringify({ ignored: true }), { status: 200 });
    }
  }

  //------------------------------------------------------
  // Prevent “instant” return caused by AUX bounce
  //------------------------------------------------------
  if (action === "return") {
    const { data: lastTake } = await supabase
      .from("ongoing_events")
      .select("time_taken")
      .eq("key_number", keyNumber)
      .maybeSingle();

    if (lastTake?.time_taken) {
      const takeTs = new Date(lastTake.time_taken).getTime();
      const nowTs = Date.now();

      // Ignore return if < 1s after take
      if (nowTs - takeTs < 2000) {
        console.log("[DEBOUNCE] RETURN too soon after TAKE — ignoring");
        return new Response(JSON.stringify({ ignored: true }), { status: 200 });
      }
    }
  }

  //------------------------------------------------------
  // Prevent rapid duplicate TAKEs (AUX bounce / double webhook)
  //------------------------------------------------------
  if (action === "take") {
    const { data: lastOngoing } = await supabase
      .from("ongoing_events")
      .select("time_taken")
      .eq("key_number", keyNumber)
      .order("time_taken", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastOngoing?.time_taken) {
      const lastTs = new Date(lastOngoing.time_taken).getTime();
      const nowTs = Date.now();

      // Ignore a second TAKE if it happens within 2 seconds
      if (nowTs - lastTs < 2000) {
        console.log("[DEBOUNCE] TAKE too soon after previous — ignoring");
        return new Response(JSON.stringify({ ignored: true }), { status: 200 });
      }
    }
  }


  //------------------------------------------------------
  // Resolve user
  //------------------------------------------------------
  const auxTs = payload.created_at || Math.floor(Date.now() / 1000);
  console.log("AUX Timestamp:", auxTs, new Date(auxTs*1000).toISOString());

  await new Promise(r => setTimeout(r, 1200));

  let userInfo = await resolveMostRecentUser(auxTs);

  if (!userInfo && action === "return") {
    // fallback: person who took it
    const existing = await supabase
      .from("ongoing_events")
      .select("*")
      .eq("key_number", keyNumber)
      .maybeSingle();

    if (existing?.data) {
      userInfo = {
        userId: existing.data.user_id,
        name: existing.data.user_name,
      };
    }
  }

  const userId = userInfo?.userId ?? null;
  const userName = userInfo?.name ?? "Unknown User";

  console.log("Final user:", userName, userId);

  //------------------------------------------------------
  // Photo & Snapshot
  //------------------------------------------------------
  let userPhoto = null;
  let snapshotUrl = null;

  if (userId) userPhoto = await getUserPhoto(userId);

  // Use AUX event timestamp directly
  const ts = auxTs;
  snapshotUrl = await getCameraThumbnail(ts);

  const timestamp = new Date().toISOString();  // Timestamp for database

  //------------------------------------------------------
  // Atomic key state update (prevents double takes/returns)
  //------------------------------------------------------
  if (action === "take") {
    const { data: updated } = await supabase
      .from("keys")
      .update({
        status: "taken",
        assigned_user: userName,
        updated_at: timestamp,
      })
      .eq("key_number", keyNumber)
      .neq("status", "taken")       // only update if not already taken
      .select("key_number");

    if (!updated || updated.length === 0) {
      console.log("[DEBOUNCE] Concurrent/duplicate TAKE — key already taken");
      return new Response(JSON.stringify({ ignored: true }), { status: 200 });
    }
  } else {
    const { data: updated } = await supabase
      .from("keys")
      .update({
        status: "present",
        assigned_user: null,
        updated_at: timestamp,
      })
      .eq("key_number", keyNumber)
      .neq("status", "present")    // only update if not already present
      .select("key_number");

    if (!updated || updated.length === 0) {
      console.log("[DEBOUNCE] Duplicate RETURN — key already present");
      return new Response(JSON.stringify({ ignored: true }), { status: 200 });
    }
  }

  //------------------------------------------------------
  // Insert into event_log table
  //------------------------------------------------------
  await supabase.from("event_log").insert({
    key_number: keyNumber,
    user_name: userName,
    user_id: userId,
    action,
    timestamp,
    snapshot_url: snapshotUrl,
  });

  //------------------------------------------------------
  // Update ongoing_events table
  //------------------------------------------------------
  if (action === "take") {
    await supabase.from("ongoing_events").upsert({
      key_number: keyNumber,
      user_name: userName,
      user_photo: userPhoto,
      user_id: userId,
      time_taken: timestamp,
    });
  } else {
    await supabase.from("ongoing_events")
      .delete()
      .eq("key_number", keyNumber);
  }
  
}

//--------------------------------------------------------------
// Singature & entrypoint
//--------------------------------------------------------------
Deno.serve(async req => {
  const rawBody = await req.text();
  const signature =
    req.headers.get("x-verkada-signature") ||
    req.headers.get("X-Verkada-Signature");

  if (!signature) return await handleEvent(rawBody);

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(VERKADA_SHARED_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const sigBuf = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(rawBody)
  );

  const computed = Array.from(new Uint8Array(sigBuf))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");

  if (computed.toLowerCase() !== signature.toLowerCase()) {
    console.log("Signature mismatch");
    console.log("Received:", signature);
    console.log("Computed:", computed);
    return new Response("Unauthorized", { status: 401 });
}

  return await handleEvent(rawBody);

});
