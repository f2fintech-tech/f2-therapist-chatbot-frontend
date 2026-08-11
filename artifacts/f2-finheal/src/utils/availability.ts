
/**
 * Dynamic advisor availability parser and resolver.
 */

// Helper to convert 12-hour values to 24-hour hour and minute
function to24Hour(hours: number, minutes: number, meridiem: string | null): { h: number; m: number } {
  let h = hours;
  const m = minutes;
  if (meridiem === "pm" && h !== 12) {
    h += 12;
  } else if (meridiem === "am" && h === 12) {
    h = 0;
  }
  return { h, m };
}

export interface SlotRange {
  startDate: Date;
  endDate: Date;
}

export function parseSingleSlotSegment(segmentStr: string): SlotRange[] | null {
  if (!segmentStr) return null;
  const str = segmentStr.toLowerCase().trim();
  const now = new Date();
  const monthsShort = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

  let startYear = now.getFullYear();
  let startMonth = now.getMonth();
  let startDateNum = now.getDate();

  let endYear = startYear;
  let endMonth = startMonth;
  let endDateNum = startDateNum;

  const rangeMatch = str.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2})\s*(?:-|to)\s*(?:(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+)?(\d{1,2})/i);

  if (rangeMatch) {
    const smStr = rangeMatch[1].toLowerCase().slice(0, 3);
    const smIdx = monthsShort.indexOf(smStr);
    if (smIdx !== -1) {
      startMonth = smIdx;
      startDateNum = parseInt(rangeMatch[2], 10);
    }
    const emStr = rangeMatch[3] ? rangeMatch[3].toLowerCase().slice(0, 3) : smStr;
    const emIdx = monthsShort.indexOf(emStr);
    if (emIdx !== -1) {
      endMonth = emIdx;
      endDateNum = parseInt(rangeMatch[4], 10);
    }
  } else if (str.includes("tomorrow")) {
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    startYear = tomorrow.getFullYear();
    startMonth = tomorrow.getMonth();
    startDateNum = tomorrow.getDate();
    endYear = startYear;
    endMonth = startMonth;
    endDateNum = startDateNum;
  } else if (str.includes("today")) {
    // already initialized to today
  } else {
    const dateMatch = str.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2})/i);
    const dateMatchReverse = str.match(/(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*/i);

    if (dateMatch) {
      const mStr = dateMatch[1].toLowerCase().slice(0, 3);
      const mIdx = monthsShort.indexOf(mStr);
      if (mIdx !== -1) {
        startMonth = mIdx;
        startDateNum = parseInt(dateMatch[2], 10);
      }
    } else if (dateMatchReverse) {
      const mStr = dateMatchReverse[2].toLowerCase().slice(0, 3);
      const mIdx = monthsShort.indexOf(mStr);
      if (mIdx !== -1) {
        startMonth = mIdx;
        startDateNum = parseInt(dateMatchReverse[1], 10);
      }
    }
    endYear = startYear;
    endMonth = startMonth;
    endDateNum = startDateNum;
  }

  const timeSearchStr = str
    .replace(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}(?:\s*-\s*(?:[a-z]+\s+)?\d{1,2})?/gi, "")
    .replace(/\d{1,2}\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*/gi, "")
    .replace(/today|tomorrow/gi, "");

  const rx = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/gi;
  const timeMatches = [];
  let match;
  while ((match = rx.exec(timeSearchStr)) !== null) {
    timeMatches.push({
      hours: parseInt(match[1], 10),
      minutes: match[2] ? parseInt(match[2], 10) : 0,
      meridiem: match[3] ? match[3].toLowerCase() : null
    });
  }

  if (timeMatches.length === 0) {
    return null;
  }

  const ranges: SlotRange[] = [];
  const dStart = new Date(startYear, startMonth, startDateNum);
  const dEnd = new Date(endYear, endMonth, endDateNum);

  if (dEnd < dStart) {
    dEnd.setFullYear(dEnd.getFullYear() + 1);
  }

  const dayCursor = new Date(dStart);
  while (dayCursor <= dEnd) {
    const curYear = dayCursor.getFullYear();
    const curMonth = dayCursor.getMonth();
    const curDate = dayCursor.getDate();

    for (let i = 0; i < timeMatches.length; i += 2) {
      const startMatch = timeMatches[i];
      const endMatch = timeMatches[i + 1] || null;
      if (!startMatch) continue;

      let startMeridiem = startMatch.meridiem;
      let endMeridiem = endMatch ? endMatch.meridiem : null;

      if (endMatch && !endMeridiem && startMeridiem) {
        endMeridiem = startMeridiem;
      }
      if (endMatch && !startMeridiem && endMeridiem) {
        if (startMatch.hours > endMatch.hours) {
          startMeridiem = endMeridiem === "pm" ? "am" : "pm";
        } else {
          startMeridiem = endMeridiem;
        }
      }

      if (!startMeridiem) {
        startMeridiem = startMatch.hours >= 8 && startMatch.hours < 12 ? "am" : "pm";
      }
      if (endMatch && !endMeridiem) {
        endMeridiem = endMatch.hours >= 8 && endMatch.hours < 12 ? "am" : "pm";
      }

      const start24 = to24Hour(startMatch.hours, startMatch.minutes, startMeridiem);
      const end24 = endMatch
        ? to24Hour(endMatch.hours, endMatch.minutes, endMeridiem)
        : { h: (start24.h + 1) % 24, m: start24.m };

      const startDate = new Date(curYear, curMonth, curDate, start24.h, start24.m, 0, 0);
      const endDate = new Date(curYear, curMonth, curDate, end24.h, end24.m, 0, 0);

      if (endDate.getTime() < startDate.getTime()) {
        endDate.setDate(endDate.getDate() + 1);
      }

      ranges.push({ startDate, endDate });
    }

    dayCursor.setDate(dayCursor.getDate() + 1);
  }

  return ranges.length > 0 ? ranges : null;
}

export function getSlotDates(nextSlotStr: string): SlotRange[] | null {
  if (!nextSlotStr) return null;
  try {
    const segments = nextSlotStr.split(/\s*\|\s*|\s*&\s*/).map(s => s.trim()).filter(Boolean);
    const allRanges: SlotRange[] = [];
    for (const seg of segments) {
      const parsed = parseSingleSlotSegment(seg);
      if (parsed) {
        allRanges.push(...parsed);
      }
    }
    return allRanges.length > 0 ? allRanges : null;
  } catch (e) {
    console.error("Error parsing slot dates:", e);
    return null;
  }
}

export function isSlotActive(nextSlotStr: string): boolean {
  const ranges = getSlotDates(nextSlotStr);
  if (!ranges) return false;
  const now = new Date().getTime();
  return ranges.some(range => now >= range.startDate.getTime() && now <= range.endDate.getTime());
}

export function isSlotPassed(nextSlotStr: string): boolean {
  if (nextSlotStr === "Not available") return true;
  const ranges = getSlotDates(nextSlotStr);
  if (!ranges) return false;
  const now = new Date().getTime();
  return ranges.every(range => now > range.endDate.getTime());
}

/**
 * Dynamically resolves advisor availability status based on DB value and active slot range.
 */
export function getEffectiveAvailability(
  dbAvailability: string,
  nextSlotStr: string
): "available" | "unavailable" | "in meeting" {
  const norm = (dbAvailability || "").toLowerCase().trim();

  if (norm.includes("meeting")) {
    return "in meeting";
  }

  if (norm.includes("available") && !norm.includes("not available") && !norm.includes("unavailable")) {
    return "available";
  }

  if (norm.includes("not available") || norm.includes("unavailable")) {
    return "unavailable";
  }

  // Next slot active check fallback
  if (isSlotActive(nextSlotStr)) {
    return "available";
  }

  return "unavailable";
}
