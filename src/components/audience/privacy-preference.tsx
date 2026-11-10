"use client";
import { useSyncExternalStore } from "react";
import {
  trackingAllowed,
  subscribePreference,
  preferenceKey,
} from "./tracking";
export function PrivacyPreference() {
  const allowed = useSyncExternalStore(
    subscribePreference,
    trackingAllowed,
    () => false,
  );
  return (
    <div className="audience-preference">
      <label>
        <input
          type="checkbox"
          checked={allowed}
          onChange={(e) => {
            try {
              localStorage.setItem(preferenceKey, e.target.checked ? "0" : "1");
              window.dispatchEvent(new Event("barka-audience-preference"));
            } catch {
              /* Browsing remains available if storage is blocked. */
            }
          }}
        />{" "}
        Autoriser la mesure d’audience et des publicités
      </label>
      <p>
        Le refus ne masque pas les annonces et ne bloque pas le site. Les
        signaux de confidentialité du navigateur sont également respectés.
      </p>
    </div>
  );
}
