export interface EventLogEntry {
  id: string;
  keyNumber: number;
  userName: string;
  action: "take" | "return";
  timestamp: string;
  hasSnapshot?: boolean;
  snapshotUrl?: string | null;
}

export interface OngoingEvent {
  id: string;
  userName: string;
  userPhoto: string;
  keyNumber: number;
  timeTaken: string;
}

export interface KeyStatus {
  keyNumber: number;
  status: "present" | "taken";
  assignedUser?: string;
}
