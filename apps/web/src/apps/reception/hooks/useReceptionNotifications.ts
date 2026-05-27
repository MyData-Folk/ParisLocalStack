import { useEffect, useState } from "react";
import { getSocket } from "../../../lib/socket";

export function useReceptionNotifications(hotelId?: string | null) {
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadRequests, setUnreadRequests] = useState(0);

  const totalUnread = unreadMessages + unreadRequests;

  const clearMessages = () => setUnreadMessages(0);
  const clearRequests = () => setUnreadRequests(0);

  useEffect(() => {
    if (!hotelId) return;

    const socket = getSocket();

    // Rejoindre la room de l'hôtel de manière persistante
    socket.emit("hotel:join", hotelId);

    const handleNewMessage = (message: any) => {
      // Uniquement incrémenter si le message provient d'un guest (pas de nous-mêmes)
      if (message.senderType === "guest") {
        setUnreadMessages((prev) => prev + 1);
      }
    };

    const handleNewRequest = () => {
      setUnreadRequests((prev) => prev + 1);
    };

    socket.on("message:new", handleNewMessage);
    socket.on("request:new", handleNewRequest);

    return () => {
      socket.off("message:new", handleNewMessage);
      socket.off("request:new", handleNewRequest);
      socket.emit("hotel:leave", hotelId);
    };
  }, [hotelId]);

  return {
    unreadMessages,
    unreadRequests,
    totalUnread,
    clearMessages,
    clearRequests
  };
}
