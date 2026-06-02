/// <reference path="../.astro/types.d.ts" />

// Umami analytics (#71/#73) — the tracker attaches `umami` to `window` at runtime when the
// PUBLIC_UMAMI_* env vars are set (see src/components/Analytics.astro). Optional: it is absent in
// dev/local and CI, so every call site guards with `window.umami?.track(...)`.
interface Window {
  umami?: {
    track(eventName?: string, eventData?: Record<string, unknown>): void;
  };
}
