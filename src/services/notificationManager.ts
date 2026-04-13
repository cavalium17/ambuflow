
export const requestNotificationPermissions = async () => {
  if (typeof window !== 'undefined' && "Notification" in window) {
    const permission = await Notification.requestPermission();
    return permission;
  }
  return "denied";
};

export const requestLocationPermissions = async () => {
  if (typeof window !== 'undefined' && navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      () => {}, 
      (err) => {
        // Ignore policy errors here as they are handled in App.tsx
        if (!err.message.includes("permissions policy")) {
          console.error("Permission géo erreur:", err.message);
        }
      }
    );
  }
};

export const setupNotificationChannels = () => {
  // Mock implementation for channel setup if needed for specific platforms
  console.log("Notification channels setup");
};
