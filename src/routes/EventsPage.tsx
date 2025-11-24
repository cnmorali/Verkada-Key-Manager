import { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { Header } from "../components/Header";
import { OngoingEventCard } from "../components/OngoingEventCard";
import { supabase } from "../lib/supabaseClient";
import { OngoingEvent } from "../types";

export function EventsPage() {
  const [events, setEvents] = useState<OngoingEvent[]>([]);

  async function loadOngoingEvents() {
    const { data, error } = await supabase
      .from("ongoing_events")
      .select("*")
      .order("time_taken", { ascending: false });

    if (error) {
      console.error("Error loading full ongoing events:", error);
      return;
    }

    if (data) {
      setEvents(
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
    }
  }

  useEffect(() => {
    loadOngoingEvents();
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
          All Ongoing Events
        </h1>

        {events.length === 0 ? (
          <p className="text-neutral-600">No ongoing events.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map(event => (
              <OngoingEventCard
                key={event.id}
                userName={event.userName}
                userPhoto={event.userPhoto}
                keyNumber={event.keyNumber}
                timeTaken={event.timeTaken}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
