"use server";

import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/auth";
import { getRealtime, type Realtime } from "@/lib/gaSummary";

export async function realtimeAction(): Promise<{ ok: boolean; data?: Realtime; error?: string }> {
  if (!(await isAuthed())) redirect("/admin");
  try {
    return { ok: true, data: await getRealtime() };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}
