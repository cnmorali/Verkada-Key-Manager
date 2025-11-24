import { User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

export function Header() {
  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <img
              src="/verklogo.png"
              alt="Verkada Logo"
              className="h-8 w-auto"
            />
            <div>
              <h1 className="text-neutral-900">Key Manager</h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-neutral-500">chloe.morali@verkada.com</p>
          </div>
          <Avatar className="h-10 w-10">
            <AvatarImage src="/me.jpg" />
            <AvatarFallback className="bg-neutral-200">
              <User className="h-5 w-5 text-neutral-600" />
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
