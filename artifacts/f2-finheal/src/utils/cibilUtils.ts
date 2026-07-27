export function isExemptRole(email?: string, name?: string): boolean {
  const cleanEmail = (email || "").toLowerCase().trim();
  const cleanName = (name || "").toLowerCase().trim();

  // Admin Check
  if (
    cleanEmail === "admin@finheal.com" || 
    cleanEmail === "admin@f2finheal.com" || 
    cleanEmail.startsWith("admin@") ||
    cleanName.includes("admin") ||
    cleanName === "finheal admin"
  ) {
    return true;
  }

  // Manager & Advisor Check
  const leadershipPrefixes = ["ceo", "cto", "cfo", "coo", "vp", "president", "founder", "director", "exec", "executive"];
  const managerPrefixes = ["manager", "advisor", "lead", "supervisor", "head"];
  const isInternalDomain = cleanEmail.endsWith("@finheal.com") || cleanEmail.endsWith("@f2finheal.com") || cleanEmail.endsWith("@f2fintech.com");

  const hasLeadershipEmail = leadershipPrefixes.some(pref => cleanEmail.startsWith(`${pref}@`) || cleanEmail.includes(`.${pref}@`) || cleanEmail.includes(`-${pref}@`));
  const hasLeadershipName = leadershipPrefixes.some(pref => cleanName.includes(pref));
  const hasManagerEmail = managerPrefixes.some(pref => cleanEmail.startsWith(`${pref}@`));
  const hasManagerName = managerPrefixes.some(pref => cleanName.includes(pref));

  if (hasLeadershipEmail || hasLeadershipName || hasManagerEmail || (isInternalDomain && hasManagerName)) {
    return true;
  }

  // If email domain is f2fintech.com, it is an advisor/employee
  if (cleanEmail.endsWith("@f2fintech.com")) {
    return true;
  }

  return false;
}

export function isReportFresh(fetchedAtStr?: string): boolean {
  if (!fetchedAtStr) return false;
  try {
    const fetchedAt = new Date(fetchedAtStr);
    const diffTime = Math.abs(new Date().getTime() - fetchedAt.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays < 30;
  } catch (e) {
    return false;
  }
}

export function getNextAvailableFetchDate(fetchedAtStr?: string): string {
  if (!fetchedAtStr) return "";
  try {
    const date = new Date(fetchedAtStr);
    date.setDate(date.getDate() + 30);
    return date.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
  } catch (e) {
    return "";
  }
}

const inlinedUrls = new Set<string>();

export async function inlineCrossOriginStylesheets(): Promise<void> {
  if (typeof window === "undefined") return;
  const sheets = Array.from(document.styleSheets);
  for (const sheet of sheets) {
    if (!sheet.href || inlinedUrls.has(sheet.href)) continue;
    try {
      // Test if rules are accessible
      const _ = sheet.cssRules;
    } catch (e) {
      try {
        const res = await fetch(sheet.href);
        if (res.ok) {
          const cssText = await res.text();
          const styleEl = document.createElement("style");
          styleEl.textContent = cssText;
          document.head.appendChild(styleEl);
          inlinedUrls.add(sheet.href);
        }
      } catch (fetchErr) {
        console.warn("Failed to fetch and inline cross-origin stylesheet:", sheet.href, fetchErr);
      }
    }
  }
}
