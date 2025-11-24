import { Lock, Unlock } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';

interface KeyTileProps {
  keyNumber: number;
  status: 'present' | 'taken';
  assignedUser?: string;
}

export function KeyTile({ keyNumber, status, assignedUser }: KeyTileProps) {
  const isPresent = status === 'present';
  
  return (
    <Card 
      className={`flex flex-col rounded-xl border p-4 transition-all ${
        isPresent 
          ? 'border-green-200 bg-gradient-to-br from-green-50 to-white' 
          : 'border-red-200 bg-gradient-to-br from-red-50 to-white'
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-neutral-500">Key {keyNumber}</span>
        {isPresent ? (
          <Lock className="h-4 w-4 text-green-600" />
        ) : (
          <Unlock className="h-4 w-4 text-red-600" />
        )}
      </div>
      
      <div className="mt-auto">
        <Badge 
          className={`mb-2 rounded-md border-0 ${
            isPresent 
              ? 'bg-green-500 text-white hover:bg-green-600' 
              : 'bg-red-500 text-white hover:bg-red-600'
          }`}
        >
          {isPresent ? 'Present' : 'Taken'}
        </Badge>
        
        {assignedUser && (
          <p className="text-xs text-neutral-600">
            {assignedUser}
          </p>
        )}
      </div>
    </Card>
  );
}
