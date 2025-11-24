import { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { Header } from "../components/Header";
import { EventLog } from "../components/EventLog";
import { supabase } from "../lib/supabaseClient";
import { EventLogEntry } from "../types";

export function LogPage() {
  const [events, setEvents] = useState<EventLogEntry[]>([]);

  async function loadFullEventLog() {
    const { data, error } = await supabase
      .from("event_log")
      .select("*")
      .order("timestamp", { ascending: false });

    if (error) {
      console.error("Error loading full event log:", error);
      return;
    }

    if (data) {
      setEvents(
        data.map(entry => ({
          id: entry.id,
          keyNumber: entry.key_number,
          userName: entry.user_name,
          action: entry.action,
          timestamp: new Date(entry.timestamp).toLocaleString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          snapshotUrl: entry.snapshot_url,
        }))
      );
    }
  }

  useEffect(() => {
    loadFullEventLog();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
      <Header />

      <div className="mx-auto max-w-5xl px-6 mt-4">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>
      </div>


      <main className="mx-auto max-w-5xl p-6">
        <h1 className="mb-8 text-2xl font-semibold text-neutral-900">
          Complete Event Log
        </h1>

        <EventLog events={events} />
      </main>
    </div>
  );
}
