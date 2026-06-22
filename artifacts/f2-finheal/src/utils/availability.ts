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

export function getSlotDates(nextSlotStr: string): { startDate: Date; endDate: Date } | null {
  if (!nextSlotStr) return null;

  try {
    const str = nextSlotStr.toLowerCase().trim();
    const now = new Date();
    let year = now.getFullYear();
    let month = now.getMonth();
    let date = now.getDate();

    const monthsShort = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

    if (str.includes("tomorrow")) {
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      year = tomorrow.getFullYear();
      month = tomorrow.getMonth();
      date = tomorrow.getDate();
    } else if (str.includes("today")) {
      // already initialized to today
    } else {
      const dateMatch = str.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2})/i);
      const dateMatchReverse = str.match(/(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*/i);

      if (dateMatch) {
        const mStr = dateMatch[1].toLowerCase().slice(0, 3);
        const mIdx = monthsShort.indexOf(mStr);
        if (mIdx !== -1) {
          month = mIdx;
          date = parseInt(dateMatch[2], 10);
        }
      } else if (dateMatchReverse) {
        const mStr = dateMatchReverse[2].toLowerCase().slice(0, 3);
        const mIdx = monthsShort.indexOf(mStr);
        if (mIdx !== -1) {
          month = mIdx;
          date = parseInt(dateMatchReverse[1], 10);
        }
      }
    }

    const timeSearchStr = str
      .replace(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}/gi, "")
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

    const startMatch = timeMatches[0];
    const endMatch = timeMatches[1] || null;

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

    const startDate = new Date(year, month, date, start24.h, start24.m, 0, 0);
    const endDate = new Date(year, month, date, end24.h, end24.m, 0, 0);

    if (endDate.getTime() < startDate.getTime()) {
      endDate.setDate(endDate.getDate() + 1);
    }

    return { startDate, endDate };
  } catch (e) {
    console.error("Error parsing slot dates:", e);
    return null;
  }
}

export function isSlotActive(nextSlotStr: string): boolean {
  const dates = getSlotDates(nextSlotStr);
  if (!dates) return false;
  const now = new Date().getTime();
  return now >= dates.startDate.getTime() && now <= dates.endDate.getTime();
}

export function isSlotPassed(nextSlotStr: string): boolean {
  if (nextSlotStr === "Not available") return true;
  const dates = getSlotDates(nextSlotStr);
  if (!dates) return false;
  const now = new Date().getTime();
  return now > dates.endDate.getTime();
}

/**
 * Dynamically resolves advisor availability status based on DB value and active slot range.
 */
export function getEffectiveAvailability(
  dbAvailability: string,
  nextSlotStr: string
): "available" | "unavailable" | "in meeting" {
  if (dbAvailability === "in meeting") {
    return "in meeting";
  }

  // Next slot active check
  if (isSlotActive(nextSlotStr)) {
    return "available";
  }

  return "unavailable";
}
