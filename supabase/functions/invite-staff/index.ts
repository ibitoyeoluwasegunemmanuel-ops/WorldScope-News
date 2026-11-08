import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};
const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: cors });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceKey) {
    return json(500, { error: "Staff invitation service is not configured" });
  }

  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) return json(401, { error: "Sign in as a newsroom administrator first" });

  const authClient = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: authData, error: authError } = await authClient.auth.getUser(token);
  if (authError || !authData.user) return json(401, { error: "Your session is invalid or expired" });

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: caller, error: callerError } = await admin
    .from("profiles")
    .select("role,suspended_at")
    .eq("id", authData.user.id)
    .maybeSingle();
  if (callerError || caller?.role !== "admin" || caller.suspended_at) {
    return json(403, { error: "Only an active newsroom administrator can invite staff" });
  }

  let payload: { email?: string; display_name?: string; role?: string };
  try { payload = await req.json(); } catch { return json(400, { error: "Invalid JSON body" }); }
  const email = String(payload.email || "").trim().toLowerCase();
  const displayName = String(payload.display_name || "").trim();
  const role = String(payload.role || "reporter").trim();
  const allowed = ["reporter", "researcher", "editor", "moderator", "opportunities_editor", "video_producer", "admin"];
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(400, { error: "Enter a valid staff email address" });
  if (!displayName || displayName.length > 100) return json(400, { error: "Enter the staff member's name (maximum 100 characters)" });
  if (!allowed.includes(role)) return json(400, { error: "Choose a valid newsroom role" });

  const siteUrl = Deno.env.get("PUBLIC_SITE_URL") || req.headers.get("origin") || "https://worldscope-news.vercel.app";
  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { display_name: displayName },
    redirectTo: `${siteUrl.replace(/\/$/, "")}/admin.html`,
  });
  if (inviteError || !invited.user) {
    return json(400, { error: inviteError?.message || "The invitation could not be created" });
  }

  const { error: profileError } = await admin.from("profiles").upsert({
    id: invited.user.id,
    email,
    display_name: displayName,
    role,
    suspended_at: null,
  }, { onConflict: "id" });
  if (profileError) return json(500, { error: "Invitation was sent but the newsroom role could not be assigned. Contact the system administrator." });

  return json(200, { ok: true, message: `Invitation sent to ${email}. They can accept it and set their own password.` });
});