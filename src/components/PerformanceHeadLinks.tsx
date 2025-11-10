import { useEffect, useMemo } from "react";
import { appConfig } from "../config";

type ManagedLink = {
  rel: string;
  href: string;
  crossOrigin?: string;
};

const HEAD_LINK_ID_PREFIX = "perf-link-";

export function PerformanceHeadLinks() {
  const origins = useMemo(() => {
    try {
      const restOrigin = new URL(appConfig.supabase.url).origin;
      const storageOrigin = new URL(
        `${appConfig.supabase.url}/storage/v1`
      ).origin;
      return Array.from(new Set([restOrigin, storageOrigin]));
    } catch {
      return [];
    }
  }, []);

  useEffect(() => {
    if (origins.length === 0) return;

    const links: ManagedLink[] = origins.flatMap((origin) => [
      { rel: "preconnect", href: origin, crossOrigin: "anonymous" },
      { rel: "dns-prefetch", href: origin },
    ]);

    const created: HTMLLinkElement[] = [];

    links.forEach((link, index) => {
      const id = `${HEAD_LINK_ID_PREFIX}${index}-${link.rel}-${link.href}`;
      if (document.getElementById(id)) return;

      const element = document.createElement("link");
      element.id = id;
      element.rel = link.rel;
      element.href = link.href;
      if (link.crossOrigin) {
        element.crossOrigin = link.crossOrigin;
      }
      document.head.appendChild(element);
      created.push(element);
    });

    return () => {
      created.forEach((node) => {
        if (node.parentNode) {
          node.parentNode.removeChild(node);
        }
      });
    };
  }, [origins]);

  return null;
}
