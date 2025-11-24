import { Clock, Key } from 'lucide-react';
import { Card } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

interface OngoingEventCardProps {
  userName: string;
  userPhoto: string;
  keyNumber: number;
  timeTaken: string;
}

export function OngoingEventCard({ userName, userPhoto, keyNumber, timeTaken }: OngoingEventCardProps) {
  return (
    <Card className="flex min-w-[260px] flex-shrink-0 items-center gap-4 rounded-xl border border-neutral-200 bg-white p-4">
      <Avatar className="h-12 w-12">
        <AvatarImage src={userPhoto} alt={userName} />
        <AvatarFallback className="bg-neutral-200 text-neutral-600">
          {userName.split(' ').map(n => n[0]).join('')}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1">
        <p className="text-neutral-900">{userName}</p>
        <div className="mt-1 flex items-center gap-3 text-xs text-neutral-500">
          <span className="flex items-center gap-1">
            <Key className="h-3 w-3" />
            Key {keyNumber}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {timeTaken}
          </span>
        </div>
      </div>
      
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50">
        <div className="h-2 w-2 rounded-full bg-red-500"></div>
      </div>
    </Card>
  );
}
