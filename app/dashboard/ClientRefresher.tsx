"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function ClientRefresher({ intervalMs = 60000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const onFocus = () => router.refresh();
    window.addEventListener('focus', onFocus);
    
    const intervalId = setInterval(() => {
      if (!document.hidden) {
        router.refresh();
      }
    }, intervalMs);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', onFocus);
    };
  }, [router, intervalMs]);

  return null;
}
