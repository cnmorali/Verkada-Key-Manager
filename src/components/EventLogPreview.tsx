import { ChevronRight, Clock } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Link } from "react-router-dom";

interface EventLogEntry {
  id: string;
  keyNumber: number;
  userName: string;
  action: 'take' | 'return';
  timestamp: string;
}

interface EventLogPreviewProps {
  events: EventLogEntry[];
  onExpand: () => void;
}

export function EventLogPreview({ events, onExpand }: EventLogPreviewProps) {
  const recentEvents = events.slice(0, 4);
  
  return (
    <Card className="flex h-full flex-col rounded-xl border border-neutral-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-medium text-neutral-900">Recent Activity</h3>
        <Link
          to="/log"
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-neutral-600 transition-colors hover:bg-neutral-100"
        >
          View All
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
      
      <div className="flex-1 space-y-2">
        {recentEvents.map((event) => (
          <div
            key={event.id}
            className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 p-2"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-500">Key {event.keyNumber}</span>
              <Badge 
                className={`rounded-md border-0 text-xs ${
                  event.action === 'take'
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                {event.action === 'take' ? 'Out' : 'In'}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <Clock className="h-3 w-3" />
              {event.timestamp}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
