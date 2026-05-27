import { useEffect, useState } from "react";

export function useDesktopNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return "default";
    }
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    } catch (err) {
      console.warn("Failed to request notification permission:", err);
      return "default";
    }
  };

  const notify = (title: string, body: string) => {
    // notify() n'envoie la notification desktop que si l'onglet n'est pas actif (document.hidden)
    if (!document.hidden) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    try {
      new Notification(title, {
        body,
        icon: "/favicon.ico"
      });
    } catch (err) {
      // Si la notification échoue ou permission === 'denied', échoue silencieusement
      console.warn("Desktop notification failed:", err);
    }
  };

  return {
    permission,
    requestPermission,
    notify
  };
}
