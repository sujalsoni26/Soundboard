"use client";

import { useEffect, useState } from "react";
import type { AdminSiteSettings } from "@/types/sync";

export function SiteBanner() {
  const [site, setSite] = useState<AdminSiteSettings | null>(null);

  useEffect(() => {
    void fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((json: { site?: AdminSiteSettings }) => setSite(json.site ?? null))
      .catch(() => {});
  }, []);

  if (!site) return null;

  if (site.maintenanceMode) {
    return (
      <div className="mb-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-200">
        The soundboard is in maintenance mode. Some features may be limited.
      </div>
    );
  }

  if (site.welcomeMessage.trim()) {
    return (
      <div className="mb-3 rounded-xl border border-violet-500/20 bg-violet-500/10 px-3 py-2 text-sm text-foreground">
        {site.welcomeMessage}
      </div>
    );
  }

  return null;
}
