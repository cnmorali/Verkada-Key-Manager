import { ChevronRight } from 'lucide-react';
import { Card } from './ui/card';
import { OngoingEventCard } from './OngoingEventCard';
import { Link } from 'react-router-dom';


interface OngoingEvent {
  id: string;
  userName: string;
  userPhoto: string;
  keyNumber: number;
  timeTaken: string;
}

interface OngoingEventsSectionProps {
  events: OngoingEvent[];
  onExpand: () => void;
}

export function OngoingEventsSection({ events, onExpand }: OngoingEventsSectionProps) {
  const displayEvents = events.slice(0, 2);
  
  return (
    <Card className="flex h-full flex-col rounded-xl border border-neutral-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-neutral-900">Events</h3>
        </div>
        <Link
          to="/events"
          className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs text-neutral-600 transition-colors hover:bg-neutral-100"
        >
          View All
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
      
      <div className="flex flex-1 gap-3 overflow-x-auto pb-1">
        {/* Stats Card - First item */}
        <Card className="flex min-w-[140px] flex-shrink-0 flex-col items-center justify-center rounded-xl border border-neutral-200 bg-gradient-to-br from-neutral-50 to-white p-4">
          <div
  className="mb-1 font-semibold text-red-600"
  style={{ fontSize: "36px" }}
>
  {events.length}
</div>
          <p className="text-center text-xs text-neutral-600">Ongoing Events</p>
        </Card>
        
        {/* Event Cards */}
        {displayEvents.map((event) => (
          <OngoingEventCard
            key={event.id}
            userName={event.userName}
            userPhoto={event.userPhoto}
            keyNumber={event.keyNumber}
            timeTaken={event.timeTaken}
          />
        ))}
        {events.length > 2 && (
          <Link
            to="/events"
            className="flex min-w-[120px] flex-shrink-0 flex-col items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-4 text-neutral-500 transition-colors hover:border-neutral-400 hover:bg-neutral-100"
          >
            <span className="text-sm">+{events.length - 2} more</span>
          </Link>
        )}
      </div>
    </Card>
  );
}
