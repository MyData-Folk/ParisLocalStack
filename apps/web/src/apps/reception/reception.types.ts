export type MessageItem = {
  id: string;
  guestId?: string;
  stayId?: string;
  senderType: "guest" | "reception";
  content: string;
  status?: string;
  priority?: string;
  createdAt: string;
  guest?: { firstName?: string; lastName?: string; email?: string };
  stay?: { roomNumber?: string };
};

export type Conversation = {
  id: string;
  guestName: string;
  roomNumber: string;
  messages: MessageItem[];
  lastMessage: MessageItem;
  lastGuestMessage: MessageItem;
  status: "new" | "in_progress" | "answered" | "urgent" | "done";
};

export type FilterKey = "all" | "new" | "urgent" | "answered";
