import { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { KeyTile } from "./components/KeyTile";
import { EventLog } from "./components/EventLog";
import { OngoingEventsSection } from "./components/OngoingEventsSection";
import { EventLogPreview } from "./components/EventLogPreview";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "./components/ui/sheet";
import { OngoingEventCard } from "./components/OngoingEventCard";
import { supabase } from "./lib/supabaseClient";
import { OngoingEvent, EventLogEntry, KeyStatus } from "./types";


/* -----------------------------
   COMPONENT
--------------------------------*/

export default function App() {
  const [ongoingEvents, setOngoingEvents] = useState<OngoingEvent[]>([]);
  const [eventLogPreview, setEventLogPreview] = useState<EventLogEntry[]>([]);
  const [keyStatuses, setKeyStatuses] = useState<KeyStatus[]>([]);
  const [showOngoingEvents, setShowOngoingEvents] = useState(false);
  const [showEventLog, setShowEventLog] = useState(false);


  async function loadOngoingEvents() {
  const { data, error } = await supabase
    .from("ongoing_events")
    .select("*")
    .order("time_taken", { ascending: false });

  if (error) {
    console.error("Error loading ongoing events:", error);
    return;
  }

  if (data) {
    setOngoingEvents(
      data.map(event => ({
        id: event.id,
        userName: event.user_name,
        userPhoto: event.user_photo,
        keyNumber: event.key_number,
        timeTaken: new Date(event.time_taken).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        }),
      }))
    );

    console.log("Fetched events:", data);
      console.log("Mapped events:", data.map(event => ({
        id: event.id,
        userName: event.user_name,
        userPhoto: event.user_photo,
        keyNumber: event.key_number,
        timeTaken: new Date(event.time_taken).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        }),
      })));
  }
  }
  async function loadEventLogPreview() {
    const { data, error } = await supabase
      .from("event_log")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(50); // more entries available for full sheet

    if (error) {
      console.error("Error loading event log preview:", error);
      return;
    }

    if (data) {
      const mapped: EventLogEntry[] = data.map((entry) => ({
        id: entry.id,
        keyNumber: entry.key_number,
        userName: entry.user_name,
        action: entry.action,
        timestamp: new Date(entry.timestamp).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        }),
        snapshotUrl: entry.snapshot_url ?? null,   // 👈 CRITICAL
      }));

      setEventLogPreview(mapped);

      console.log("Mapped event log entries:", mapped);
    }
  }


  async function loadKeyStatuses() {
  const { data, error } = await supabase
    .from("keys")
    .select("*")
    .order("key_number", { ascending: true });

  if (error) {
    console.error("Error loading key statuses:", error);
    return;
  }

  if (data) {
    setKeyStatuses(
      data.map(k => ({
        keyNumber: k.key_number,
        status: k.status === "taken" ? "taken" : "present",
        assignedUser: k.assigned_user || undefined,
      }))
    );
  }
}



  // TEMPORARY mock data (we will replace with Supabase shortly)
  useEffect(() => {
    // Get Ongoing Events
    loadOngoingEvents();


    // Get Log Preview
    loadEventLogPreview();

    // Get Key Grid
    loadKeyStatuses();
    
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
      <Header />

      <main className="mx-auto max-w-7xl p-6">

        {/* Top Section */}
        <section className="mb-8">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <OngoingEventsSection 
                events={ongoingEvents}
                onExpand={() => setShowOngoingEvents(true)}
              />
            </div>
            <div>
              <EventLogPreview 
                events={eventLogPreview}
                onExpand={() => setShowEventLog(true)}
              />
            </div>
          </div>
        </section>

        {/* Key Grid */}
        <section className="mb-8">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6">

            <div className="mb-8">
              <h2 className="text-lg font-medium text-neutral-900">Key Status</h2>
            </div>

            <div className="grid grid-cols-8 gap-3">
              {keyStatuses.map((key) => (
                <KeyTile
                  key={key.keyNumber}
                  keyNumber={key.keyNumber}
                  status={key.status}
                  assignedUser={key.assignedUser}
                />
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Ongoing Events Sheet */}
      <Sheet open={showOngoingEvents} onOpenChange={setShowOngoingEvents}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>All Ongoing Events</SheetTitle>
            <SheetDescription>
              {ongoingEvents.length} key{ongoingEvents.length !== 1 ? "s" : ""} currently checked out
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            {ongoingEvents.map((event) => (
              <OngoingEventCard
                key={event.id}
                userName={event.userName}
                userPhoto={event.userPhoto}
                keyNumber={event.keyNumber}
                timeTaken={event.timeTaken}
              />
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Event Log Sheet */}
      <Sheet open={showEventLog} onOpenChange={setShowEventLog}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-3xl">
          <SheetHeader>
            <SheetTitle>Complete Event Log</SheetTitle>
            <SheetDescription>Full history of all key transactions</SheetDescription>
          </SheetHeader>

          <div className="mt-6">
            <EventLog events={eventLogPreview} />
          </div>
        </SheetContent>
      </Sheet>

    </div>
  );
}
