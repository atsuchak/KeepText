"use client";

import { useSyncExternalStore } from "react";

const firstYear = 2026;

function currentYears() {
  const year = new Date().getFullYear();
  return year > firstYear ? `${firstYear}–${year}` : String(firstYear);
}

function subscribe(callback: () => void) {
  const timer = window.setInterval(callback, 60_000);
  return () => window.clearInterval(timer);
}

export function CopyrightYear() {
  return useSyncExternalStore(subscribe, currentYears, () => String(firstYear));
}
