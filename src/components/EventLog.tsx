import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { EventLogEntry } from "../types";

interface EventLogProps {
  events: EventLogEntry[];
}

export function EventLog({ events }: EventLogProps) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white">
      <Table>
        <TableHeader>
          <TableRow className="border-neutral-200 bg-neutral-50">
            <TableHead className="text-neutral-700">Key</TableHead>
            <TableHead className="text-neutral-700">User</TableHead>
            <TableHead className="text-neutral-700">Action</TableHead>
            <TableHead className="text-neutral-700">Timestamp</TableHead>
            <TableHead className="text-neutral-700">Camera Snapshot</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {events.map((event) => (
            <TableRow key={event.id} className="border-neutral-200">
              <TableCell className="text-neutral-900">
                Key {event.keyNumber}
              </TableCell>

              <TableCell className="text-neutral-900">
                {event.userName}
              </TableCell>

              <TableCell>
                <Badge
                  className={`rounded-md border-0 ${
                    event.action === 'take'
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {event.action === 'take' ? 'Taken' : 'Returned'}
                </Badge>
              </TableCell>

              <TableCell className="text-neutral-600">
                {event.timestamp}
              </TableCell>

              <TableCell>
                {event.snapshotUrl ? (
                  <div className="flex items-center gap-2">
                    <ImageWithFallback
                      src={event.snapshotUrl}      // base64 data URL from DB
                      alt="Snapshot"
                      className="h-12 w-12 rounded border border-neutral-200 object-cover"
                    />
                  </div>
                ) : (
                  <span className="text-neutral-400">—</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
