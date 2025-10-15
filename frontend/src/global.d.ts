// src/global.d.ts
export {};

declare global {
  interface Window {
<<<<<<< Updated upstream
    google: typeof import("google.maps");
=======
    google: typeof google;
>>>>>>> Stashed changes
  }
}
