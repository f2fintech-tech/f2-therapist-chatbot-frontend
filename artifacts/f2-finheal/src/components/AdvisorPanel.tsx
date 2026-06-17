import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { fetchAdvisors, bookAppointment, fetchUserAppointments, updateAppointmentStatus, joinAppointment, rescheduleAppointment, fetchAdvisorAppointments, isAdvisorSlotActive } from "@/lib/backendAuth";

export interface Advisor {
  id: string;
  f2FintechId?: string;
  name: string;
  designation: string;
  avatarUrl: string;
  availability: string;
  expertise: string[];
  strength: string;
  bio: string;
  rating: number;
  reviewsCount: number;
  nextSlot: string;
  category: string;
  fee: number; // Consultation fee in INR per session
  testComment?: string;
  testRating?: number;
}

interface Appointment {
  id?: string;
  advisorId: string;
  advisorName: string;
  date: string; // e.g., "Jun 3 (Wed)"
  time: string; // e.g., "11:00 AM"
  notes?: string;
  bookedAt: string;
  completed?: boolean;
  cancelled?: boolean;
  rating?: number;
  feedback?: string;
  meetUrl?: string; // Pre-setup Google Meet URL
  joined?: boolean; // Unlocks rating once user clicks Join Call
}

interface AdvisorPanelProps {
  userId: string;
  onToggleSidebar: () => void;
  onToggleInsights: () => void;
  isGuest?: boolean;
  onLoginRequired?: () => void;
}

export const advisorsData: Advisor[] = [];

export const categories = [
  { id: "all", label: "All Experts", icon: "🧑‍💼" },
  { id: "wealth", label: "Wealth & Investing", icon: "📈" },
  { id: "tax", label: "Tax & Retirement", icon: "💰" },
  { id: "debt", label: "Debt & Credit", icon: "⚠️" },
  { id: "property", label: "Real Estate", icon: "🏠" },
  { id: "insurance", label: "Insurance", icon: "🛡️" }
];

export const timeSlots = ["09:30 AM", "11:00 AM", "01:30 PM", "03:00 PM", "04:30 PM", "06:00 PM"];

export const hasSessionEnded = (dateStr: string, timeStr: string) => {
  try {
    const monthsShort = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
    const monthsLong = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
    
    const parts = dateStr.toLowerCase().replace(/[(),]/g, "").trim().split(/\s+/);
    if (parts.length < 2) return false;

    let monthIndex = -1;
    let dayNum = -1;

    for (const part of parts) {
      const idxShort = monthsShort.indexOf(part);
      if (idxShort !== -1) {
        monthIndex = idxShort;
        continue;
      }
      const idxLong = monthsLong.indexOf(part);
      if (idxLong !== -1) {
        monthIndex = idxLong;
        continue;
      }

      const val = parseInt(part, 10);
      if (!isNaN(val) && val >= 1 && val <= 31) {
        dayNum = val;
      }
    }

    if (monthIndex === -1 || dayNum === -1) return false;

    const timeClean = timeStr.replace("(IST)", "").trim();
    const timeParts = timeClean.split(" ");
    if (timeParts.length < 2) return false;
    const [hoursStr, minutesStr] = timeParts[0].split(":");
    const meridiem = timeParts[1].toUpperCase();
    
    let hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);
    if (isNaN(hours) || isNaN(minutes)) return false;

    if (meridiem === "PM" && hours !== 12) {
      hours += 12;
    } else if (meridiem === "AM" && hours === 12) {
      hours = 0;
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const apptDate = new Date(currentYear, monthIndex, dayNum, hours, minutes);
    
    if (monthIndex === 0 && now.getMonth() === 11) {
      apptDate.setFullYear(currentYear + 1);
    }
    if (monthIndex === 11 && now.getMonth() === 0) {
      apptDate.setFullYear(currentYear - 1);
    }

    return now.getTime() > apptDate.getTime();
  } catch (e) {
    console.error("Error parsing appointment date/time:", e);
    return false;
  }
};

export default function AdvisorPanel({
  userId,
  onToggleSidebar,
  onToggleInsights,
  isGuest = false,
  onLoginRequired,
}: AdvisorPanelProps) {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selectedAdvisor, setSelectedAdvisor] = useState<Advisor | null>(null);
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [categoriesList, setCategoriesList] = useState(categories);
  const [advisorReviews, setAdvisorReviews] = useState<Record<string, Appointment[]>>({});

  const loadAdvisors = async () => {
    try {
      const list = await fetchAdvisors();
      setAdvisors(list);
      localStorage.setItem("finheal_advisors_list", JSON.stringify(list));

      // Fetch reviews for each advisor in parallel/sequentially
      const reviewsMap: Record<string, Appointment[]> = {};
      for (const adv of list) {
        try {
          const appts = await fetchAdvisorAppointments(adv.id);
          const completedReviews = appts.filter((a: any) => a.completed && a.feedback && a.rating);
          reviewsMap[adv.id] = completedReviews;
        } catch (e) {
          console.error(`Error loading reviews for advisor ${adv.id}:`, e);
        }
      }
      setAdvisorReviews(reviewsMap);
    } catch (err) {
      console.error("Error loading advisors:", err);
      const stored = localStorage.getItem("finheal_advisors_list");
      if (stored) {
        try { setAdvisors(JSON.parse(stored)); } catch { setAdvisors([]); }
      } else {
        setAdvisors([]);
      }
    }
  };

  useEffect(() => {
    loadAdvisors();

    const handleUpdate = () => {
      const nextStored = localStorage.getItem("finheal_advisors_list");
      if (nextStored) {
        try { setAdvisors(JSON.parse(nextStored)); } catch {}
      }
    };
    window.addEventListener("storage", handleUpdate);
    window.addEventListener("finheal:advisors_update", handleUpdate);
    return () => {
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("finheal:advisors_update", handleUpdate);
    };
  }, []);

  useEffect(() => {
    const baseCategories = [
      { id: "all", label: "All Experts", icon: "🧑‍💼" },
      { id: "wealth", label: "Wealth & Investing", icon: "📈" },
      { id: "tax", label: "Tax & Retirement", icon: "💰" },
      { id: "debt", label: "Debt & Credit", icon: "⚠️" },
      { id: "property", label: "Real Estate", icon: "🏠" },
      { id: "insurance", label: "Insurance", icon: "🛡️" }
    ];

    advisors.forEach(adv => {
      const exists = baseCategories.some(c => c.id === adv.category);
      if (!exists && adv.category) {
        const label = adv.category.charAt(0).toUpperCase() + adv.category.slice(1);
        baseCategories.push({
          id: adv.category,
          label: label,
          icon: "💼"
        });
      }
    });

    setCategoriesList(baseCategories);
  }, [advisors]);
  
  // Interactive calendar and selection states
  const [dateList, setDateList] = useState<{ dayName: string; dayNum: number; fullStr: string }[]>([]);
  const [selectedDateStr, setSelectedDateStr] = useState<string>("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("");
  const [userNotes, setUserNotes] = useState<string>("");
  const [bookingConfirmed, setBookingConfirmed] = useState<boolean>(false);
  const [confirmedApptDetails, setConfirmedApptDetails] = useState<Appointment | null>(null);
  
  // Load saved appointments from local storage
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [cancellingApptId, setCancellingApptId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  // Reschedule meeting states
  const [reschedulingApptId, setReschedulingApptId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");

  // Derived active and past appointments list
  const activeAppointments = appointments.filter(a => !a.completed && !a.cancelled && !hasSessionEnded(a.date, a.time));
  const pastAppointments = appointments.filter(a => a.completed || a.cancelled || hasSessionEnded(a.date, a.time));

  // Paywall & Simulated secure gateway states
  const [checkoutActive, setCheckoutActive] = useState<boolean>(false);
  const [paymentSelected, setPaymentSelected] = useState<"upi" | "card" | "netbanking">("upi");
  const [upiSelected, setUpiSelected] = useState<"gpay" | "phonepe" | "paytm">("gpay");
  const [paymentProcessing, setPaymentProcessing] = useState<boolean>(false);
  const [bankingStatus, setBankingStatus] = useState("Connecting to secure payment gateway...");

  // Star Rating & Feedback Modal States
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [ratingAppt, setRatingAppt] = useState<Appointment | null>(null);
  const [userRating, setUserRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [userFeedbackText, setUserFeedbackText] = useState<string>("");

  const ratingDescriptions: Record<number, string> = {
    1: "Disappointing 😟",
    2: "Mediocre 😐",
    3: "Helpful 🙂",
    4: "Great Consultation! 😄",
    5: "Outstanding! 🏆"
  };

  const handleOpenFeedbackModal = (appt: Appointment) => {
    setRatingAppt(appt);
    setUserRating(0);
    setHoverRating(0);
    setUserFeedbackText("");
    setFeedbackModalOpen(true);
  };

  const handleSubmitFeedback = async () => {
    if (!ratingAppt) return;
    if (userRating === 0) {
      alert("Please select a rating of at least 1 star.");
      return;
    }

    if (ratingAppt.id) {
      try {
        await updateAppointmentStatus(ratingAppt.id, {
          completed: true,
          rating: userRating,
          feedback: userFeedbackText.trim()
        });
        await loadAppointments();
        await loadAdvisors();
      } catch (e) {
        console.error("Failed to save rating on backend", e);
      }
    }

    // 1. Update appointment inside appointments list
    const updatedAppointments = appointments.map(appt => {
      if (appt.advisorId === ratingAppt.advisorId && appt.bookedAt === ratingAppt.bookedAt) {
        return {
          ...appt,
          completed: true,
          rating: userRating,
          feedback: userFeedbackText.trim()
        };
      }
      return appt;
    });
    setAppointments(updatedAppointments);
    const storageKey = `finheal_advisor_appointments:${userId || "anonymous"}`;
    localStorage.setItem(storageKey, JSON.stringify(updatedAppointments));

    // 2. Update advisor's average rating in local storage
    const updatedAdvisors = advisors.map(adv => {
      if (adv.id === ratingAppt.advisorId) {
        const count = adv.reviewsCount;
        const currentAvg = adv.rating;
        const newAvg = parseFloat(((currentAvg * count + userRating) / (count + 1)).toFixed(1));
        return {
          ...adv,
          reviewsCount: count + 1,
          rating: newAvg
        };
      }
      return adv;
    });

    setAdvisors(updatedAdvisors);
    localStorage.setItem("finheal_advisors_list", JSON.stringify(updatedAdvisors));
    window.dispatchEvent(new CustomEvent("finheal:advisors_update"));

    setFeedbackModalOpen(false);
    setRatingAppt(null);
    setUserRating(0);
    setUserFeedbackText("");
  };

  const loadAppointments = async () => {
    if (!userId) return;
    try {
      const list = await fetchUserAppointments(userId);
      setAppointments(list);
    } catch (e) {
      console.error("Failed to load appointments from backend", e);
      const storageKey = `finheal_advisor_appointments:${userId || "anonymous"}`;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          setAppointments(JSON.parse(stored));
        } catch (err) {
          console.error("Failed to parse appointments", err);
        }
      }
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [userId]);

  // Generate the next 7 days for the interactive date picker
  useEffect(() => {
    const dates = [];
    const daysShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const monthsShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const isToday = i === 0;
      
      const dayName = isToday ? "Today" : daysShort[d.getDay()];
      const dayNum = d.getDate();
      const fullStr = `${monthsShort[d.getMonth()]} ${dayNum} (${daysShort[d.getDay()]})`;
      
      dates.push({ dayName, dayNum, fullStr });
    }
    setDateList(dates);
    if (dates.length > 0) {
      setSelectedDateStr(dates[0].fullStr);
    }
  }, []);

  const saveAppointments = (newAppts: Appointment[]) => {
    setAppointments(newAppts);
    const storageKey = `finheal_advisor_appointments:${userId || "anonymous"}`;
    localStorage.setItem(storageKey, JSON.stringify(newAppts));
  };

  // Get only available time slots (hiding past times for Today)
  const getFilteredTimeSlots = () => {
    if (!dateList.length || selectedDateStr !== dateList[0].fullStr) {
      return timeSlots; // Not today, all slots available
    }

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    return timeSlots.filter((slot) => {
      // Parse "HH:MM AM/PM"
      const [timePart, meridiem] = slot.split(" ");
      let [hoursStr, minutesStr] = timePart.split(":");
      let hours = parseInt(hoursStr, 10);
      const minutes = parseInt(minutesStr, 10);

      if (meridiem === "PM" && hours !== 12) {
        hours += 12;
      } else if (meridiem === "AM" && hours === 12) {
        hours = 0;
      }

      if (hours > currentHour) return true;
      if (hours === currentHour && minutes > currentMinute) return true;
      return false;
    });
  };

  const activeTimeSlots = getFilteredTimeSlots();

  // Keep time slot selection valid when switching dates
  useEffect(() => {
    const slots = getFilteredTimeSlots();
    if (slots.length > 0) {
      if (!slots.includes(selectedTimeSlot)) {
        setSelectedTimeSlot(slots[0]);
      }
    } else {
      setSelectedTimeSlot("");
    }
  }, [selectedDateStr, selectedAdvisor]);

  const handleOpenBooking = (advisor: Advisor) => {
    setSelectedAdvisor(advisor);
    setSelectedTimeSlot(""); // Will be auto-set to first future slot by effect
    setUserNotes("");
    setBookingConfirmed(false);
  };

  const handleCloseBooking = () => {
    setSelectedAdvisor(null);
    setBookingConfirmed(false);
    setCheckoutActive(false);
    setPaymentProcessing(false);
  };

  const generateMeetUrl = () => {
    const chars = "abcdefghijklmnopqrstuvwxyz";
    const part = (len: number) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    return `https://meet.google.com/${part(3)}-${part(4)}-${part(3)}`;
  };

  const handleConfirmBooking = async () => {
    if (!selectedAdvisor) return;

    const meetUrl = generateMeetUrl();
    const apptPayload = {
      user_id: userId || "anonymous",
      advisor_id: selectedAdvisor.id,
      advisor_name: selectedAdvisor.name,
      date: selectedDateStr,
      time: selectedTimeSlot,
      notes: userNotes.trim(),
      meet_url: meetUrl
    };

    let newAppt: Appointment;
    try {
      newAppt = await bookAppointment(apptPayload);
    } catch (e) {
      console.error("Failed to save appointment to DB, using local fallback", e);
      newAppt = {
        advisorId: selectedAdvisor.id,
        advisorName: selectedAdvisor.name,
        date: selectedDateStr,
        time: selectedTimeSlot,
        notes: userNotes.trim(),
        bookedAt: new Date().toISOString(),
        meetUrl: meetUrl,
        joined: false
      };
    }

    // Filter out any previous appointment with the same advisor to replace it, or append
    const updated = appointments.filter(a => a.advisorId !== selectedAdvisor.id);
    updated.push(newAppt);
    setAppointments(updated);
    const storageKey = `finheal_advisor_appointments:${userId || "anonymous"}`;
    localStorage.setItem(storageKey, JSON.stringify(updated));

    setConfirmedApptDetails(newAppt);
    setBookingConfirmed(true);

    window.dispatchEvent(new CustomEvent("finheal:advisors_update"));
    
    // Auto reset modal after a brief wow factor
    setTimeout(() => {
      handleCloseBooking();
    }, 4500);
  };

  useEffect(() => {
    if (!paymentProcessing) {
      setBankingStatus("Connecting to secure payment gateway...");
      return;
    }
    const timer1 = setTimeout(() => {
      setBankingStatus("Verifying 3D-Secure credentials with your bank...");
    }, 800);
    const timer2 = setTimeout(() => {
      setBankingStatus("Settling UPI merchant transaction securely...");
    }, 1600);
    const timer3 = setTimeout(() => {
      setBankingStatus("Confirming appointment slot in real-time...");
    }, 2400);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [paymentProcessing]);

  const handlePayAndComplete = () => {
    setPaymentProcessing(true);
    setTimeout(() => {
      handleConfirmBooking();
    }, 3000);
  };

  const handleJoinCall = async (appt: Appointment) => {
    if (!appt.meetUrl) return;
    window.open(appt.meetUrl, "_blank");

    if (!appt.joined) {
      if (appt.id) {
        try {
          await joinAppointment(appt.id);
        } catch (e) {
          console.error("Failed to mark appointment joined on backend", e);
        }
      }
      const updated = appointments.map((a) => {
        if (a.advisorId === appt.advisorId && a.bookedAt === appt.bookedAt) {
          return { ...a, joined: true };
        }
        return a;
      });
      setAppointments(updated);
      const storageKey = `finheal_advisor_appointments:${userId || "anonymous"}`;
      localStorage.setItem(storageKey, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent("finheal:advisors_update"));
    }
  };



  const handleCancelAppointment = async (apptId: string, reason: string) => {
    if (!reason.trim()) return;

    // Find appointment
    const appt = appointments.find(a => a.id === apptId || a.advisorId === apptId);
    if (appt && appt.id) {
      try {
        await updateAppointmentStatus(appt.id, { cancelled: true, feedback: reason.trim() });
        await loadAppointments();
        setCancellingApptId(null);
        setCancelReason("");
        window.dispatchEvent(new CustomEvent("finheal:advisors_update"));
        alert("Your consultation has been cancelled successfully.");
        return;
      } catch (e) {
        console.error("Failed to cancel appointment on backend", e);
      }
    }

    // Fallback for local simulation
    const updated = appointments.map(a => {
      if (a.id === apptId || (!a.id && a.advisorId === apptId && !a.completed && !a.cancelled && !hasSessionEnded(a.date, a.time))) {
        return { ...a, cancelled: true, feedback: reason.trim() };
      }
      return a;
    });
    setAppointments(updated);
    const storageKey = `finheal_advisor_appointments:${userId || "anonymous"}`;
    localStorage.setItem(storageKey, JSON.stringify(updated));
    setCancellingApptId(null);
    setCancelReason("");
    window.dispatchEvent(new CustomEvent("finheal:advisors_update"));
    alert("Your consultation has been cancelled successfully.");
  };

  // ---------- Reschedule handler ----------
  const generateRescheduleDateList = () => {
    const dates: { dayName: string; dayNum: number; fullStr: string }[] = [];
    const daysShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const monthsShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dayName = i === 0 ? "Today" : daysShort[d.getDay()];
      const dayNum = d.getDate();
      const fullStr = `${monthsShort[d.getMonth()]} ${dayNum} (${daysShort[d.getDay()]})`;
      dates.push({ dayName, dayNum, fullStr });
    }
    return dates;
  };

  const handleRescheduleAppointment = async (apptId: string) => {
    if (!rescheduleDate || !rescheduleTime) {
      alert("Please select both a new date and time slot.");
      return;
    }
    const appt = appointments.find(a => a.id === apptId || a.advisorId === apptId);
    const realId = appt?.id || apptId;
    try {
      await rescheduleAppointment(realId, rescheduleDate, rescheduleTime);
      await loadAppointments();
      setReschedulingApptId(null);
      setRescheduleDate("");
      setRescheduleTime("");
      window.dispatchEvent(new CustomEvent("finheal:advisors_update"));
      alert("Your consultation has been rescheduled successfully.");
    } catch (e) {
      console.error("Failed to reschedule appointment", e);
      alert("Failed to reschedule appointment. Please try again.");
    }
  };

  // Filtered advisor list based on specialty category
  const filteredAdvisors = activeCategory === "all" 
    ? advisors 
    : advisors.filter(a => a.category === activeCategory);



  return (
    <main className="flex min-w-0 min-h-0 flex-1 flex-col overflow-hidden bg-white rounded-[20px] shadow-sm border border-gray-200 animate-fade-up delay-100">
      
      {/* HEADER SECTION */}
      <div className="flex items-center gap-3 border-b border-gray-100 px-[16px] py-[14px] shrink-0 bg-white rounded-t-[20px] sm:px-[20px] sm:py-[12px]">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="h-[32px] w-[32px] rounded-[6px] bg-gray-100 text-gray-600 flex items-center justify-center text-[18px] transition-all hover:bg-gray-200 xl:hidden shrink-0"
          aria-label="Toggle sidebar"
        >
          ☰
        </button>

        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-bold text-gray-900 sm:text-[14px]">Talk to a Financial Expert</div>
          <div className="text-[10px] text-gray-400 sm:text-[11px]">Connect 1:1 with certified advisors to accelerate your journey.</div>
        </div>

        <button
          type="button"
          onClick={onToggleInsights}
          className="h-[32px] w-[32px] rounded-[6px] bg-gray-100 text-gray-600 flex items-center justify-center text-[18px] transition-all hover:bg-gray-200 2xl:hidden shrink-0"
          aria-label="Toggle insights panel"
        >
          ☰
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-[16px] py-[18px] sm:px-[20px] sm:py-[22px] scrollbar-thin">
        
        {/* BANNER PROMO */}
        <section className="relative overflow-hidden rounded-[24px] border border-[#d4d8fa] bg-[linear-gradient(135deg,#f6f7fe_0%,#eef0fd_48%,#ffffff_100%)] p-[18px] shadow-[0_16px_40px_rgba(50,68,230,0.08)] sm:p-[24px]">
          <div className="absolute right-[-24px] top-[-24px] h-[120px] w-[120px] rounded-full bg-gradient-to-br from-primary to-[#7c8cff] opacity-10" />
          <div className="relative z-10 max-w-[640px]">
            <div className="mb-[10px] inline-flex rounded-[999px] bg-white px-[10px] py-[5px] text-[10px] font-semibold uppercase tracking-[0.8px] text-primary shadow-[0_4px_16px_rgba(50,68,230,0.08)]">
              Personalized Guidance
            </div>
            <h1 className="font-serif text-[28px] leading-[1.1] text-gray-900 sm:text-[34px]">
              Solve complex money questions with real-time advisors.
            </h1>
            <p className="mt-[10px] max-w-[560px] text-[13px] leading-[1.7] text-gray-600 sm:text-[14px]">
              Get specific, action-oriented strategies on taxes, debt reduction, mutual funds, or home loan options. No sales pitches, just expert guidance.
            </p>
            <div className="mt-[14px] flex flex-wrap gap-[8px] text-[11px] font-medium text-gray-600">
              <span className="rounded-[999px] border border-gray-200 bg-white px-[10px] py-[5px] flex items-center gap-[4px]">💬 1 Hour Consultation</span>
              <span className="rounded-[999px] border border-gray-200 bg-white px-[10px] py-[5px] flex items-center gap-[4px]">🛡️ Verified Experts</span>
              <span className="rounded-[999px] border border-gray-200 bg-white px-[10px] py-[5px] flex items-center gap-[4px]">⭐ 4.9/5 Advisor Rating</span>
              <span className="rounded-[999px] border border-gray-200 bg-white px-[10px] py-[5px] flex items-center gap-[4px]">🔒 Private & Confidential</span>
            </div>
          </div>
        </section>

        {/* UPCOMING APPOINTMENTS SECTION */}
        {activeAppointments.length > 0 && (
          <section className="mt-[20px] animate-fade-up">
            <h2 className="text-[12px] font-semibold uppercase tracking-[0.9px] text-primary mb-[10px] flex items-center gap-[6px]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Your Scheduled Consultations ({activeAppointments.length})
            </h2>
            <div className="grid gap-[12px] sm:grid-cols-2 lg:grid-cols-3">
              {activeAppointments.map((appt) => {
                const advisor = advisors.find(a => a.id === appt.advisorId);
                const apptKeyId = appt.id || appt.advisorId;
                return (
                  <div key={apptKeyId} className="bg-[linear-gradient(135deg,#ffffff_0%,#f9faff_100%)] border border-primary/20 rounded-[18px] p-[16px] shadow-sm flex flex-col justify-between hover:border-primary/40 transition">
                    <div>
                      <div className="flex items-center gap-[10px] mb-[10px]">
                        <img 
                          src={advisor?.avatarUrl || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=60"} 
                          alt={appt.advisorName}
                          className="w-[40px] h-[40px] rounded-full object-cover border border-primary/10"
                        />
                        <div>
                          <div className="text-[13px] font-bold text-gray-900">{appt.advisorName}</div>
                          <div className="text-[10px] text-gray-500">{advisor?.designation}</div>
                        </div>
                      </div>
                      
                      <div className="bg-white border border-gray-100 rounded-[12px] p-[10px] mb-[12px]">
                        <div className="flex items-center justify-between text-[12px] mb-[4px]">
                          <span className="text-gray-500 font-medium">📅 Date:</span>
                          <span className="text-gray-900 font-bold">{appt.date}</span>
                        </div>
                        <div className="flex items-center justify-between text-[12px]">
                          <span className="text-gray-500 font-medium">⏰ Time Slot:</span>
                          <span className="text-primary font-bold">{appt.time} (IST)</span>
                        </div>
                        {appt.notes && (
                          <div className="mt-[8px] pt-[6px] border-t border-gray-50 text-[11px] text-gray-600 line-clamp-1 italic">
                            &quot;{appt.notes}&quot;
                          </div>
                        )}
                      </div>
                    </div>
 
                    <div className="space-y-[8px] mt-[4px]">
                      <div className="flex items-center gap-[8px]">
                        <button
                          onClick={() => {
                            setCancellingApptId(apptKeyId);
                            setCancelReason("");
                            setReschedulingApptId(null);
                          }}
                          className="flex-1 py-[8px] rounded-[10px] text-[11px] font-bold border border-rose-100 text-rose-600 hover:bg-rose-50/50 transition cursor-pointer"
                        >
                          Cancel Call
                        </button>
                        <button
                          onClick={() => {
                            setReschedulingApptId(apptKeyId);
                            setRescheduleDate("");
                            setRescheduleTime("");
                            setCancellingApptId(null);
                          }}
                          className="flex-1 py-[8px] rounded-[10px] text-[11px] font-bold border border-blue-100 text-blue-600 hover:bg-blue-50/50 transition cursor-pointer"
                        >
                          Reschedule
                        </button>
                        <button
                          onClick={() => handleJoinCall(appt)}
                          className="flex-1 py-[8px] rounded-[10px] text-[11px] font-bold bg-primary text-white hover:opacity-90 transition cursor-pointer"
                        >
                          Join Call
                        </button>
                      </div>
                      {appt.joined || hasSessionEnded(appt.date, appt.time) ? (
                        <button
                          onClick={() => handleOpenFeedbackModal(appt)}
                          className="w-full py-[8.5px] rounded-[10px] text-[11.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 transition cursor-pointer flex items-center justify-center gap-[4px] shadow-sm shadow-emerald-50/20 animate-fade-in"
                        >
                          <span>✓</span> Complete & Rate Session
                        </button>
                      ) : (
                        <div className="w-full text-center py-[8.5px] text-[10.5px] font-bold text-gray-400 bg-gray-50 rounded-[10px] border border-gray-100/60 select-none">
                          🔒 Rate unlocks once you Join Call
                        </div>
                      )}

                      {cancellingApptId === apptKeyId && (
                        <div className="mt-[10px] p-[12px] bg-rose-50/50 border border-rose-100 rounded-[12px] space-y-[8px] text-left animate-fade-in">
                          <label className="text-[10px] font-bold text-rose-800 uppercase block">Reason for Cancellation *</label>
                          <textarea
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            placeholder="Please tell us why you are cancelling..."
                            rows={2}
                            className="w-full px-[10px] py-[8px] border border-rose-200 rounded-[8px] text-[12px] focus:outline-none focus:border-rose-400 bg-white"
                          />
                          <div className="flex gap-[8px] justify-end">
                            <button
                              onClick={() => {
                                setCancellingApptId(null);
                                setCancelReason("");
                              }}
                              className="px-[12px] py-[6px] text-[11px] font-bold text-gray-500 bg-white border border-gray-200 rounded-[8px] hover:bg-gray-50 transition cursor-pointer"
                            >
                              Back
                            </button>
                            <button
                              onClick={() => handleCancelAppointment(apptKeyId, cancelReason)}
                              disabled={!cancelReason.trim()}
                              className="px-[12px] py-[6px] text-[11px] font-bold text-white bg-rose-600 rounded-[8px] hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
                            >
                              Confirm
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Reschedule inline form */}
                      {reschedulingApptId === apptKeyId && (
                        <div className="mt-[10px] p-[12px] bg-blue-50/50 border border-blue-100 rounded-[12px] space-y-[8px] text-left animate-fade-in">
                          <label className="text-[10px] font-bold text-blue-800 uppercase block">Reschedule — Select New Date & Time</label>
                          <div className="flex gap-[6px] overflow-x-auto pb-[4px] scrollbar-none">
                            {generateRescheduleDateList().map((dt, idx) => (
                              <button
                                key={idx}
                                onClick={() => { setRescheduleDate(dt.fullStr); setRescheduleTime(""); }}
                                className={`flex flex-col items-center justify-center min-w-[54px] h-[56px] rounded-[10px] border transition cursor-pointer ${
                                  rescheduleDate === dt.fullStr
                                    ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200/40"
                                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                                }`}
                              >
                                <span className={`text-[9px] font-medium leading-none ${rescheduleDate === dt.fullStr ? "text-white/80" : "text-gray-400"}`}>{dt.dayName}</span>
                                <span className="text-[14px] font-bold mt-[3px] leading-none">{dt.dayNum}</span>
                              </button>
                            ))}
                          </div>
                          {rescheduleDate && (
                            <div className="grid grid-cols-3 gap-[6px]">
                              {timeSlots.map((slot) => (
                                <button
                                  key={slot}
                                  type="button"
                                  onClick={() => setRescheduleTime(slot)}
                                  className={`py-[7px] px-[6px] rounded-[8px] text-[10.5px] font-semibold text-center border transition cursor-pointer ${
                                    rescheduleTime === slot
                                      ? "bg-blue-600/10 border-blue-600 text-blue-700 font-bold"
                                      : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                                  }`}
                                >
                                  {slot}
                                </button>
                              ))}
                            </div>
                          )}
                          <div className="flex gap-[8px] justify-end pt-[4px]">
                            <button
                              onClick={() => { setReschedulingApptId(null); setRescheduleDate(""); setRescheduleTime(""); }}
                              className="px-[12px] py-[6px] text-[11px] font-bold text-gray-500 bg-white border border-gray-200 rounded-[8px] hover:bg-gray-50 transition cursor-pointer"
                            >
                              Back
                            </button>
                            <button
                              onClick={() => handleRescheduleAppointment(apptKeyId)}
                              disabled={!rescheduleDate || !rescheduleTime}
                              className="px-[12px] py-[6px] text-[11px] font-bold text-white bg-blue-600 rounded-[8px] hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
                            >
                              Confirm Reschedule
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* PAST CONSULTATIONS HISTORY */}
        {pastAppointments.length > 0 && (
          <section className="mt-[24px] animate-fade-up">
            <h2 className="text-[12px] font-semibold uppercase tracking-[0.9px] text-gray-400 mb-[10px] flex items-center gap-[6px]">
              📜 Past Consultations History ({pastAppointments.length})
            </h2>
            <div className="grid gap-[12px] sm:grid-cols-2 lg:grid-cols-3">
              {pastAppointments.map((appt, idx) => {
                const advisor = advisors.find(a => a.id === appt.advisorId);
                return (
                  <div key={idx} className="bg-gray-50/50 border border-gray-200 rounded-[18px] p-[16px] flex flex-col justify-between hover:bg-gray-50 transition">
                    <div>
                      <div className="flex items-center gap-[10px] mb-[10px]">
                        <img 
                          src={advisor?.avatarUrl || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=60"} 
                          alt={appt.advisorName}
                          className="w-[40px] h-[40px] rounded-full object-cover grayscale opacity-75 border"
                        />
                        <div>
                          <div className="text-[13px] font-bold text-gray-700">{appt.advisorName}</div>
                          <div className="text-[10px] text-gray-400">{advisor?.designation}</div>
                        </div>
                      </div>
                      
                      <div className="bg-white border border-gray-100 rounded-[12px] p-[10px] mb-[8px]">
                        <div className="flex items-center justify-between text-[11px] mb-[2px]">
                          <span className="text-gray-400 font-medium">Session Date:</span>
                          <span className="text-gray-600 font-bold">{appt.date}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-gray-400 font-medium">Time Slot:</span>
                          <span className="text-gray-500 font-semibold">{appt.time}</span>
                        </div>
                      </div>

                      {appt.cancelled ? (
                        <div className="space-y-[6px]">
                          <div className="bg-rose-50/40 border border-rose-100/50 rounded-[12px] p-[10px] text-center text-[11px] text-rose-600 font-semibold">
                            🚫 This appointment was cancelled
                          </div>
                          {appt.feedback && (
                            <div className="text-[11px] italic text-rose-700 bg-rose-50/30 border border-rose-100/40 p-[10px] rounded-[12px] flex flex-col gap-[3px] text-left">
                              <span className="text-[9.5px] font-extrabold text-rose-800 uppercase tracking-wider block">🚫 Cancellation Reason</span>
                              <span>&quot;{appt.feedback}&quot;</span>
                            </div>
                          )}
                        </div>
                      ) : appt.completed ? (
                        <div className="bg-amber-50/40 border border-amber-100/50 rounded-[12px] p-[10px]">
                          <div className="flex items-center gap-[4px] text-[11px] font-bold text-amber-600 mb-[4px]">
                            <span>{"★".repeat(appt.rating || 0)}</span>
                            <span className="text-[10px] font-semibold text-gray-500">({appt.rating}/5 stars)</span>
                          </div>
                          {appt.feedback ? (
                            <div className="text-[11px] text-gray-600 italic">
                              &quot;{appt.feedback}&quot;
                            </div>
                          ) : (
                            <div className="text-[10px] text-gray-400 italic">No text review submitted.</div>
                          )}
                        </div>
                      ) : (
                        <div className="pt-[4px]">
                          <button
                            onClick={() => handleOpenFeedbackModal(appt)}
                            className="w-full py-[8.5px] rounded-[10px] text-[11.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 transition cursor-pointer flex items-center justify-center gap-[4px] shadow-sm shadow-emerald-50/20"
                          >
                            <span>✓</span> Complete & Rate Session
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
 
        {/* CATEGORY FILTERS */}
        <section className="mt-[24px]">
          <div className="mb-[12px]">
            <h2 className="text-[12px] font-semibold uppercase tracking-[0.9px] text-gray-400">Choose Expertise</h2>
          </div>
          <div className="flex items-center gap-[8px] overflow-x-auto pb-[6px] scrollbar-none">
            {categoriesList.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-[6px] px-[14px] py-[8px] rounded-full text-[12px] font-semibold whitespace-nowrap transition cursor-pointer ${
                  activeCategory === cat.id
                    ? "bg-primary text-white shadow-md shadow-primary/15 scale-102"
                    : "bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100"
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </section>
 
        {/* EXPERTS LIST GRID */}
        <div className="relative">
          {isGuest && (
            <div className="absolute inset-0 z-30 bg-white/40 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center select-none rounded-[20px]">
              <div className="bg-white border border-gray-150 rounded-[24px] p-[32px] max-w-[400px] w-full mx-4 shadow-[0_24px_80px_rgba(15,23,42,0.15)] animate-scale-in">
                <div className="text-[32px] text-center mb-[12px]">🔒</div>
                <h3 className="text-[18px] font-bold text-gray-900 text-center mb-[8px] tracking-tight">Sign up to view advisors</h3>
                <p className="text-[13px] text-gray-500 text-center mb-[24px] leading-relaxed">
                  Create a free account or sign in to connect 1:1 with certified tax advisors, wealth managers, and estate consultants.
                </p>
                <button
                  onClick={onLoginRequired}
                  className="h-[48px] w-full rounded-[14px] bg-primary text-white font-semibold text-[14px] hover:bg-[#1e2db8] transition cursor-pointer"
                  type="button"
                >
                  Sign Up / Login
                </button>
              </div>
            </div>
          )}

          <div className={isGuest ? "pointer-events-none select-none filter blur-[4px]" : ""}>
            <section className="mt-[20px]">
          <div className="mb-[14px] flex items-center justify-between">
            <h2 className="text-[12px] font-semibold uppercase tracking-[0.9px] text-gray-400">Our Trusted Advisors</h2>
            <div className="text-[11px] text-gray-400 font-medium">Showing {filteredAdvisors.length} active experts</div>
          </div>
 
          <div className="grid gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
            {filteredAdvisors.map((advisor) => {
              const activeAppt = activeAppointments.find(a => a.advisorId === advisor.id);
              
              return (
                <Card 
                  key={advisor.id} 
                  className={`relative overflow-hidden border-gray-200 shadow-sm flex flex-col justify-between transition-all duration-300 hover:-translate-y-[2px] hover:shadow-[0_14px_34px_rgba(15,23,42,0.08)] ${
                    activeAppt ? "ring-2 ring-primary/20 border-primary/20" : ""
                  }`}
                >
                  
                  {/* Visual Availability dot on top right corner */}
                  <div className="absolute top-[16px] right-[16px]">
                    {advisor.availability === "in meeting" ? (
                      <div className="flex items-center gap-[5px] px-[8px] py-[3.5px] rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-[9.5px] font-bold animate-fade-in">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                        </span>
                        In Meeting
                      </div>
                    ) : (advisor.availability === "unavailable" || advisor.availability === "Not Available") ? (
                      <div className="flex items-center gap-[5px] px-[8px] py-[3.5px] rounded-full bg-rose-50 border border-rose-100 text-rose-700 text-[9.5px] font-bold animate-fade-in">
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                        Not Available
                      </div>
                    ) : isAdvisorSlotActive(advisor.availability) ? (
                      <div className="flex items-center gap-[5px] px-[8px] py-[3.5px] rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-[9.5px] font-bold animate-fade-in">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        {advisor.availability === "available" ? "Available" : advisor.availability}
                      </div>
                    ) : (
                      <div className="flex items-center gap-[5px] px-[8px] py-[3.5px] rounded-full bg-rose-50 border border-rose-100 text-rose-700 text-[9.5px] font-bold animate-fade-in">
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                        Not Available
                      </div>
                    )}
                  </div>

                  <CardHeader className="p-[18px] pb-[12px] space-y-0 flex flex-row items-center gap-[14px]">
                    {/* Portrait Avatar */}
                    <img 
                      src={advisor.avatarUrl} 
                      alt={advisor.name}
                      className="w-[64px] h-[64px] rounded-2xl object-cover shadow-sm border border-gray-100"
                    />
                    <div className="flex-1 min-w-0 pr-[85px]">
                      <CardTitle className="text-[15px] font-bold text-gray-900 leading-tight">{advisor.name}</CardTitle>
                      <div className="text-[11px] font-medium text-gray-500 truncate mt-[2px]">{advisor.designation}</div>
                      <div className="flex items-center gap-[4px] mt-[4px] text-[11px] font-semibold text-amber-500">
                        <span>⭐</span>
                        <span>{advisor.rating}</span>
                        <span className="text-gray-400 font-normal">({advisor.reviewsCount} reviews)</span>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-[18px] pt-[0px] pb-[16px] flex-1 flex flex-col justify-between">
                    <div>
                      {/* Short bio */}
                      <p className="text-[12px] leading-[1.6] text-gray-600 line-clamp-3 mb-[12px]">
                        {advisor.bio}
                      </p>

                      {/* Expertise tags */}
                      <div className="flex flex-wrap gap-[6px] mb-[12px]">
                        {advisor.expertise.map((exp, index) => (
                          <span 
                            key={index} 
                            className="bg-[#f6f7fe] text-primary border border-[#eef0fd] px-[8px] py-[2.5px] rounded-[6px] text-[10px] font-bold"
                          >
                            {exp}
                          </span>
                        ))}
                      </div>

                      {/* Core Strength block */}
                      <div className="bg-gray-50 border border-gray-100 p-[10px] rounded-[12px] text-[11.5px] text-gray-700 leading-relaxed mb-[8px]">
                        <strong>🎯 Strength:</strong> {advisor.strength}
                      </div>

                      {/* Dynamic Reviews/Comments Section */}
                      {advisorReviews[advisor.id] && advisorReviews[advisor.id].length > 0 && (
                        <div className="mt-3 border-t border-gray-100 pt-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider">Recent Reviews</span>
                            <span className="text-[10px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-full">
                              {advisorReviews[advisor.id].length} comment{advisorReviews[advisor.id].length > 1 ? "s" : ""}
                            </span>
                          </div>
                          <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1 scrollbar-thin">
                            {advisorReviews[advisor.id].map((rev, idx) => (
                              <div key={idx} className="bg-amber-50/10 border border-amber-100/30 rounded-xl p-2.5 text-[11.5px]">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex text-amber-400 text-[11px]">
                                    {"★".repeat(rev.rating || 0)}
                                    {"☆".repeat(5 - (rev.rating || 0))}
                                  </div>
                                  <span className="text-[9.5px] text-gray-400 font-medium">{rev.date || "Verified Review"}</span>
                                </div>
                                <p className="text-gray-600 italic leading-relaxed font-medium">
                                  &quot;{rev.feedback}&quot;
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-[12px] pt-[12px] border-t border-gray-100 flex items-center justify-between gap-[8px]">
                      
                      {activeAppt ? (
                        /* Appt booked visual indicator inside expert card */
                        <div className="w-full">
                          <div className="bg-emerald-50/70 border border-emerald-100 rounded-[12px] px-[12px] py-[8px] flex items-center justify-between text-[11px] mb-[8px]">
                            <div>
                              <div className="text-emerald-800 font-bold">Confirmed booking!</div>
                              <div className="text-emerald-600 font-medium">{activeAppt.date} at {activeAppt.time}</div>
                            </div>
                            <button
                              onClick={() => {
                                setCancellingApptId(activeAppt.id || activeAppt.advisorId);
                                setCancelReason("");
                                setReschedulingApptId(null);
                              }}
                              className="text-rose-500 font-bold hover:underline ml-2 cursor-pointer"
                              title="Cancel appointment"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => {
                                setReschedulingApptId(activeAppt.id || activeAppt.advisorId);
                                setRescheduleDate("");
                                setRescheduleTime("");
                                setCancellingApptId(null);
                              }}
                              className="text-blue-500 font-bold hover:underline ml-2 cursor-pointer"
                              title="Reschedule appointment"
                            >
                              Reschedule
                            </button>
                          </div>
                          
                          {cancellingApptId === (activeAppt.id || activeAppt.advisorId) && (
                            <div className="bg-rose-50/50 border border-rose-100 rounded-[12px] p-[10px] space-y-[6px] text-left mb-[8px] animate-fade-in">
                              <label className="text-[9.5px] font-bold text-rose-800 uppercase block">Reason for Cancellation *</label>
                              <textarea
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                placeholder="Please write why you are cancelling..."
                                rows={2}
                                className="w-full px-[8px] py-[6px] border border-rose-200 rounded-[8px] text-[11.5px] focus:outline-none focus:border-rose-400 bg-white"
                              />
                              <div className="flex gap-[6px] justify-end">
                                <button
                                  onClick={() => {
                                    setCancellingApptId(null);
                                    setCancelReason("");
                                  }}
                                  className="px-[10px] py-[4px] text-[10.5px] font-bold text-gray-500 bg-white border border-gray-200 rounded-[6px] hover:bg-gray-50 transition cursor-pointer"
                                >
                                  Back
                                </button>
                                <button
                                  onClick={() => handleCancelAppointment(activeAppt.id || activeAppt.advisorId, cancelReason)}
                                  disabled={!cancelReason.trim()}
                                  className="px-[10px] py-[4px] text-[10.5px] font-bold text-white bg-rose-600 rounded-[6px] hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
                                >
                                  Confirm
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Inline reschedule form in expert card */}
                          {reschedulingApptId === (activeAppt.id || activeAppt.advisorId) && (
                            <div className="bg-blue-50/50 border border-blue-100 rounded-[12px] p-[10px] space-y-[6px] text-left mb-[8px] animate-fade-in">
                              <label className="text-[9.5px] font-bold text-blue-800 uppercase block">Reschedule — New Date & Time</label>
                              <div className="flex gap-[5px] overflow-x-auto pb-[3px] scrollbar-none">
                                {generateRescheduleDateList().map((dt, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => { setRescheduleDate(dt.fullStr); setRescheduleTime(""); }}
                                    className={`flex flex-col items-center justify-center min-w-[48px] h-[50px] rounded-[8px] border transition cursor-pointer ${
                                      rescheduleDate === dt.fullStr
                                        ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                                        : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                                    }`}
                                  >
                                    <span className={`text-[8px] font-medium leading-none ${rescheduleDate === dt.fullStr ? "text-white/80" : "text-gray-400"}`}>{dt.dayName}</span>
                                    <span className="text-[13px] font-bold mt-[2px] leading-none">{dt.dayNum}</span>
                                  </button>
                                ))}
                              </div>
                              {rescheduleDate && (
                                <div className="grid grid-cols-3 gap-[4px]">
                                  {timeSlots.map((slot) => (
                                    <button
                                      key={slot}
                                      type="button"
                                      onClick={() => setRescheduleTime(slot)}
                                      className={`py-[5px] px-[4px] rounded-[6px] text-[10px] font-semibold text-center border transition cursor-pointer ${
                                        rescheduleTime === slot
                                          ? "bg-blue-600/10 border-blue-600 text-blue-700 font-bold"
                                          : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                                      }`}
                                    >
                                      {slot}
                                    </button>
                                  ))}
                                </div>
                              )}
                              <div className="flex gap-[6px] justify-end pt-[2px]">
                                <button
                                  onClick={() => { setReschedulingApptId(null); setRescheduleDate(""); setRescheduleTime(""); }}
                                  className="px-[10px] py-[4px] text-[10.5px] font-bold text-gray-500 bg-white border border-gray-200 rounded-[6px] hover:bg-gray-50 transition cursor-pointer"
                                >
                                  Back
                                </button>
                                <button
                                  onClick={() => handleRescheduleAppointment(activeAppt.id || activeAppt.advisorId)}
                                  disabled={!rescheduleDate || !rescheduleTime}
                                  className="px-[10px] py-[4px] text-[10.5px] font-bold text-white bg-blue-600 rounded-[6px] hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
                                >
                                  Confirm
                                </button>
                              </div>
                            </div>
                          )}

                          <button
                            onClick={() => handleJoinCall(activeAppt)}
                            className="w-full bg-[#ecfdf5] hover:bg-[#d1fae5] text-emerald-800 font-bold py-[9px] rounded-[10px] text-[12px] transition cursor-pointer text-center"
                          >
                            Join Call Room
                          </button>
                        </div>
                      ) : (
                        /* Standard Book Appointment Button */
                        <>
                          <div className="text-left">
                            <div className="text-[9.5px] text-gray-400 uppercase tracking-[0.5px]">Next Slot • Fee</div>
                            <div className="text-[11px] font-bold text-gray-800">
                              {advisor.nextSlot} • <span className="text-primary font-extrabold">₹{advisor.fee}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleOpenBooking(advisor)}
                            className="bg-primary text-white hover:opacity-90 font-bold py-[9px] px-[16px] rounded-[10px] text-[12px] shadow-[0_8px_20px_rgba(50,68,230,0.14)] transition cursor-pointer"
                          >
                            Book Call
                          </button>
                        </>
                      )}

                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      </div>
      </div>
      </div>

      {/* BOOKING MODAL POPUP */}
      {selectedAdvisor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs transition-opacity animate-fade-in">
          
          <div className="bg-white rounded-[24px] max-w-[480px] w-full mx-4 shadow-[0_24px_80px_rgba(15,23,42,0.22)] border border-gray-100 overflow-hidden animate-fade-up-fast flex flex-col">
            
            {/* Success state display */}
            {bookingConfirmed ? (
              <div className="p-[32px] text-center flex flex-col items-center justify-center">
                <div className="w-[72px] h-[72px] rounded-full bg-emerald-50 flex items-center justify-center text-[36px] text-emerald-500 mb-[20px] animate-bounce-dot shadow-inner border border-emerald-100">
                  ✓
                </div>
                <h3 className="text-[20px] font-bold text-gray-900 mb-[8px]">Appointment Booked!</h3>
                <p className="text-[13px] text-gray-500 leading-relaxed mb-[20px]">
                  Your session with <strong>{selectedAdvisor.name}</strong> is confirmed. We&apos;ve added it to your dashboard and emailed a Google Calendar invitation.
                </p>

                <div className="w-full bg-[#f6f7fe] rounded-[18px] border border-gray-100 p-[16px] text-left space-y-[6px] mb-[24px]">
                  <div className="text-[12px] text-gray-600 flex justify-between">
                    <span>Expert Advisor:</span>
                    <strong className="text-gray-900">{selectedAdvisor.name}</strong>
                  </div>
                  <div className="text-[12px] text-gray-600 flex justify-between">
                    <span>Scheduled Date:</span>
                    <strong className="text-gray-900">{selectedDateStr}</strong>
                  </div>
                  <div className="text-[12px] text-gray-600 flex justify-between">
                    <span>Selected Slot:</span>
                    <strong className="text-primary font-bold">{selectedTimeSlot} (IST)</strong>
                  </div>
                </div>

                <button
                  onClick={handleCloseBooking}
                  className="w-full bg-primary text-white font-bold py-[12px] rounded-[12px] text-[13px] hover:opacity-90 transition cursor-pointer"
                >
                  Awesome, got it!
                </button>
              </div>
            ) : checkoutActive ? (
              /* Simulated Premium Payment Gateway Panel */
              <div className="relative flex flex-col h-full animate-fade-in">
                
                {/* Secure Processing Overlay */}
                {paymentProcessing && (
                  <div className="absolute inset-0 bg-white/95 z-50 flex flex-col items-center justify-center p-[24px] text-center animate-fade-in">
                    {/* Pulsing secure lock animation */}
                    <div className="relative flex items-center justify-center mb-[18px]">
                      <div className="absolute inline-flex h-[80px] w-[80px] rounded-full bg-primary/10 animate-ping opacity-75" />
                      <div className="relative h-[64px] w-[64px] rounded-full bg-primary/5 border border-primary/20 flex items-center justify-center text-[24px]">
                        🔒
                      </div>
                    </div>
                    <h4 className="text-[15px] font-bold text-gray-900 mb-[6px]">Processing Payment...</h4>
                    <p className="text-[12px] text-primary font-semibold animate-pulse">{bankingStatus}</p>
                    <div className="mt-[20px] w-[140px] h-[4px] bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-primary animate-loading-bar rounded-full opacity-75" style={{ width: "65%" }} />
                    </div>
                    <div className="mt-[16px] text-[10px] text-gray-400 font-medium">PCI-DSS Compliant • 256-bit SSL Encryption</div>
                  </div>
                )}

                <div className="flex items-center justify-between border-b border-gray-100 px-[20px] py-[16px] bg-gradient-to-r from-primary/5 to-transparent">
                  <div className="flex items-center gap-[10px]">
                    <span className="text-[18px]">💳</span>
                    <div>
                      <h3 className="text-[14px] font-bold text-gray-900">Secure Checkout</h3>
                      <p className="text-[10.5px] font-semibold text-gray-400 leading-none">Consultation with {selectedAdvisor.name}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleCloseBooking}
                    className="text-[20px] text-gray-400 hover:text-gray-600 cursor-pointer"
                    aria-label="Close checkout"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-[20px] space-y-[16px] overflow-y-auto max-h-[60vh] scrollbar-thin">
                  
                  {/* Order summary banner */}
                  <div className="bg-[#f6f7fe] border border-[#eef0fd] rounded-[16px] p-[14px]">
                    <div className="flex items-center gap-[12px]">
                      <img 
                        src={selectedAdvisor.avatarUrl} 
                        alt={selectedAdvisor.name}
                        className="w-[44px] h-[44px] rounded-xl object-cover border-2 border-white shadow-sm"
                      />
                      <div className="min-w-0 flex-1">
                        <strong className="text-[13px] text-gray-900 block leading-tight">{selectedAdvisor.name}</strong>
                        <span className="text-[10.5px] text-gray-500 block mt-[2px]">{selectedAdvisor.designation}</span>
                      </div>
                    </div>
                    
                    <div className="mt-[10px] pt-[10px] border-t border-gray-100 grid grid-cols-2 gap-y-[4px] text-[11.5px] text-gray-600">
                      <div>Date: <strong className="text-gray-950">{selectedDateStr}</strong></div>
                      <div className="text-right">Slot: <strong className="text-primary">{selectedTimeSlot}</strong></div>
                    </div>
                  </div>

                  {/* Pricing Breakdown */}
                  <div className="space-y-[6px] border-b border-gray-100 pb-[12px]">
                    <div className="flex justify-between text-[12px] text-gray-500">
                      <span>Hourly Consultation Fee</span>
                      <span className="font-semibold text-gray-800">₹{selectedAdvisor.fee}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-gray-400">
                      <span>CGST (9%)</span>
                      <span>₹{(selectedAdvisor.fee * 0.09).toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-gray-400">
                      <span>SGST (9%)</span>
                      <span>₹{(selectedAdvisor.fee * 0.09).toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between text-[13px] text-gray-950 font-bold pt-[6px] border-t border-dashed border-gray-100">
                      <span>Total Amount Payable</span>
                      <span className="text-primary text-[14px]">₹{(selectedAdvisor.fee * 1.18).toFixed(0)}</span>
                    </div>
                  </div>

                  {/* Payment Selectors */}
                  <div>
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] block mb-[8px]">
                      Choose Payment Method
                    </label>
                    <div className="grid grid-cols-3 gap-[8px]">
                      {[
                        { id: "upi", label: "📱 UPI / GPay" },
                        { id: "card", label: "💳 Card" },
                        { id: "netbanking", label: "🏦 Netbanking" }
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setPaymentSelected(opt.id as any)}
                          className={`py-[10px] px-[4px] rounded-[12px] text-[11.5px] font-bold text-center border transition cursor-pointer flex flex-col items-center justify-center gap-[4px] ${
                            paymentSelected === opt.id
                              ? "bg-primary/5 border-primary text-primary"
                              : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sub-panels based on payment choice */}
                  <div className="bg-gray-50/50 border border-gray-200 rounded-[16px] p-[12px] min-h-[110px] flex items-center justify-center">
                    
                    {paymentSelected === "upi" && (
                      <div className="w-full text-center space-y-[8px] animate-fade-in">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.5px] block">Select UPI Application</span>
                        <div className="flex justify-center gap-[12px]">
                          {[
                            { id: "gpay", label: "Google Pay", icon: "🟢" },
                            { id: "phonepe", label: "PhonePe", icon: "🟣" },
                            { id: "paytm", label: "Paytm", icon: "🔵" }
                          ].map((upi) => (
                            <button
                              key={upi.id}
                              type="button"
                              onClick={() => setUpiSelected(upi.id as any)}
                              className={`px-[12px] py-[6px] rounded-[8px] text-[11px] font-bold border transition cursor-pointer flex items-center gap-[4px] ${
                                upiSelected === upi.id
                                  ? "bg-white border-primary text-primary shadow-xs"
                                  : "bg-transparent border-gray-200 text-gray-500 hover:bg-white"
                              }`}
                            >
                              <span>{upi.icon}</span>
                              <span>{upi.label}</span>
                            </button>
                          ))}
                        </div>
                        <input
                          type="text"
                          placeholder="yourname@okhdfcbank"
                          defaultValue={`${userId.split("@")[0] || "user"}@paytm`}
                          className="w-full max-w-[280px] mx-auto block text-center px-[10px] py-[6px] border border-gray-300 rounded-[8px] text-[11.5px] mt-[10px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-medium"
                        />
                      </div>
                    )}

                    {paymentSelected === "card" && (
                      <div className="w-full space-y-[10px] animate-fade-in text-left">
                        <div className="space-y-[4px]">
                          <label className="text-[9.5px] font-bold text-gray-400 uppercase tracking-[0.5px] block">Card Number</label>
                          <input
                            type="text"
                            placeholder="4111 2222 3333 4444"
                            className="w-full px-[10px] py-[6px] border border-gray-300 rounded-[8px] text-[11.5px] focus:outline-none focus:border-primary font-medium"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-[8px]">
                          <div className="space-y-[4px]">
                            <label className="text-[9.5px] font-bold text-gray-400 uppercase tracking-[0.5px] block">Expiry Date</label>
                            <input
                              type="text"
                              placeholder="MM/YY"
                              className="w-full px-[10px] py-[6px] border border-gray-300 rounded-[8px] text-[11.5px] focus:outline-none focus:border-primary font-medium text-center"
                            />
                          </div>
                          <div className="space-y-[4px]">
                            <label className="text-[9.5px] font-bold text-gray-400 uppercase tracking-[0.5px] block">CVV</label>
                            <input
                              type="password"
                              placeholder="***"
                              maxLength={3}
                              className="w-full px-[10px] py-[6px] border border-gray-300 rounded-[8px] text-[11.5px] focus:outline-none focus:border-primary font-medium text-center"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {paymentSelected === "netbanking" && (
                      <div className="w-full text-center space-y-[8px] animate-fade-in">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.5px] block">Select Your Bank</span>
                        <select className="w-full max-w-[280px] mx-auto block px-[10px] py-[8px] border border-gray-300 rounded-[8px] text-[12px] bg-white focus:outline-none focus:border-primary font-semibold text-gray-700">
                          <option>HDFC Bank</option>
                          <option>ICICI Bank</option>
                          <option>State Bank of India (SBI)</option>
                          <option>Axis Bank</option>
                          <option>Kotak Mahindra Bank</option>
                        </select>
                      </div>
                    )}

                  </div>
                </div>

                <div className="border-t border-gray-100 p-[20px] bg-gray-50/50 flex gap-[10px] shrink-0">
                  <button
                    onClick={() => setCheckoutActive(false)}
                    className="flex-1 py-[11px] border border-gray-300 rounded-[12px] text-[12px] font-bold text-gray-700 hover:bg-gray-100 transition cursor-pointer"
                  >
                    Back to Form
                  </button>
                  <button
                    onClick={handlePayAndComplete}
                    className="flex-1 py-[11px] bg-primary text-white font-bold rounded-[12px] text-[12px] hover:opacity-90 transition cursor-pointer shadow-md shadow-primary/10 flex items-center justify-center gap-[4px]"
                  >
                    <span>🔒 Pay ₹{(selectedAdvisor.fee * 1.18).toFixed(0)}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Core Booking Selection Form */
              <>
                <div className="flex items-center justify-between border-b border-gray-100 px-[20px] py-[16px] bg-[#f9faff]">
                  <div className="flex items-center gap-[10px]">
                    <img 
                      src={selectedAdvisor.avatarUrl} 
                      alt={selectedAdvisor.name}
                      className="w-[36px] h-[36px] rounded-full object-cover border"
                    />
                    <div>
                      <h3 className="text-[14px] font-bold text-gray-900">Book 1:1 Consultation</h3>
                      <p className="text-[10.5px] font-semibold text-gray-400 leading-none">{selectedAdvisor.name}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleCloseBooking}
                    className="text-[20px] text-gray-400 hover:text-gray-600 cursor-pointer"
                    aria-label="Close scheduler"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-[20px] space-y-[16px] overflow-y-auto max-h-[70vh]">
                  
                  {/* Horizontal Date Picker Slider */}
                  <div>
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] block mb-[8px]">
                      Select Date
                    </label>
                    <div className="flex gap-[8px] overflow-x-auto pb-[4px] scrollbar-none">
                      {dateList.map((dt, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedDateStr(dt.fullStr)}
                          className={`flex flex-col items-center justify-center min-w-[62px] h-[66px] rounded-[14px] border transition cursor-pointer ${
                            selectedDateStr === dt.fullStr
                              ? "bg-primary border-primary text-white shadow-md shadow-primary/20 scale-102"
                              : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <span className={`text-[10px] font-medium leading-none ${selectedDateStr === dt.fullStr ? "text-white/80" : "text-gray-400"}`}>
                            {dt.dayName}
                          </span>
                          <span className="text-[16px] font-bold mt-[4px] leading-none">
                            {dt.dayNum}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Grid of Time Slots */}
                  <div>
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] block mb-[8px]">
                      Available Time Slots (IST)
                    </label>
                    <div className="grid grid-cols-3 gap-[8px]">
                      {activeTimeSlots.length === 0 ? (
                        <div className="col-span-3 text-center py-[16px] bg-amber-50/70 border border-amber-100/60 rounded-[14px]">
                          <span className="text-[12px] font-bold text-amber-700">⚠️ No slots remaining today. Please select a future date.</span>
                        </div>
                      ) : (
                        activeTimeSlots.map((slot) => (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setSelectedTimeSlot(slot)}
                            className={`py-[9px] px-[8px] rounded-[10px] text-[11.5px] font-semibold text-center border transition cursor-pointer ${
                              selectedTimeSlot === slot
                                ? "bg-primary/10 border-primary text-primary font-bold"
                                : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            {slot}
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Notes / Reason area */}
                  <div>
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] block mb-[6px]">
                      Primary Topic or Notes (Optional)
                    </label>
                    <textarea
                      value={userNotes}
                      onChange={(e) => setUserNotes(e.target.value)}
                      placeholder="e.g. Need assistance setting up an automated 80C tax planning protocol and reviews on direct mutual fund schemes."
                      rows={3}
                      className="w-full px-[12px] py-[10px] border border-gray-300 rounded-[12px] text-[12px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder-gray-400"
                    />
                  </div>
                </div>

                {/* Confirm booking button footer */}
                <div className="border-t border-gray-100 p-[20px] bg-gray-50/50 flex gap-[10px]">
                  <button
                    onClick={handleCloseBooking}
                    className="flex-1 py-[11px] border border-gray-300 rounded-[12px] text-[12px] font-bold text-gray-700 hover:bg-gray-100 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (!selectedTimeSlot) {
                        alert("Please select a time slot first.");
                        return;
                      }
                      setCheckoutActive(true);
                    }}
                    className="flex-1 py-[11px] bg-primary text-white font-bold rounded-[12px] text-[12px] hover:opacity-90 transition cursor-pointer shadow-md shadow-primary/10"
                  >
                    Proceed to Payment
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* FEEDBACK & STAR RATING MODAL */}
      {feedbackModalOpen && ratingAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs transition-opacity animate-fade-in">
          <div className="bg-white rounded-[24px] max-w-[460px] w-full mx-4 shadow-[0_24px_80px_rgba(15,23,42,0.25)] border border-gray-100 overflow-hidden animate-fade-up-fast flex flex-col">
            
            <div className="flex items-center justify-between border-b border-gray-100 px-[20px] py-[16px] bg-gradient-to-r from-amber-50/50 to-emerald-50/30">
              <div className="flex items-center gap-[10px]">
                <span className="text-[20px]">⭐</span>
                <div>
                  <h3 className="text-[14px] font-bold text-gray-900">Rate Consultation Session</h3>
                  <p className="text-[10.5px] font-semibold text-gray-400 leading-none">Share your feedback on {ratingAppt.advisorName}</p>
                </div>
              </div>
              <button
                onClick={() => setFeedbackModalOpen(false)}
                className="text-[20px] text-gray-400 hover:text-gray-600 cursor-pointer"
                aria-label="Close feedback modal"
              >
                ✕
              </button>
            </div>

            <div className="p-[24px] space-y-[18px]">
              <div className="text-center">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-[1px] block mb-[8px]">
                  How was your call with {ratingAppt.advisorName}?
                </span>
                
                {/* 5-Star Interactive Selector */}
                <div className="flex justify-center gap-[14px] my-[12px]">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setUserRating(star)}
                      className="text-[38px] cursor-pointer transition-all duration-150 hover:scale-120 border-none bg-transparent outline-none focus:outline-none select-none p-0"
                      aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                    >
                      <span 
                        className={`transition-colors duration-150 ${
                          star <= (hoverRating || userRating) 
                            ? "text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]" 
                            : "text-gray-200"
                        }`}
                      >
                        ★
                      </span>
                    </button>
                  ))}
                </div>

                {/* Rating description visual feedback */}
                <div className="h-[20px]">
                  {userRating > 0 ? (
                    <span className="text-[12.5px] font-bold text-primary bg-[#eef0fd] px-[12px] py-[4px] rounded-full animate-fade-in">
                      {ratingDescriptions[userRating]}
                    </span>
                  ) : (
                    <span className="text-[11px] text-gray-400 italic">Select a star rating to complete the consultation</span>
                  )}
                </div>
              </div>

              {/* Text review field */}
              <div className="space-y-[6px]">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px] block">
                  Write a Short Review (Optional)
                </label>
                <textarea
                  value={userFeedbackText}
                  onChange={(e) => setUserFeedbackText(e.target.value)}
                  placeholder="e.g. Sneha was incredibly clear and helped me identify three immediate structural tax deductions. High-value call!"
                  rows={3}
                  className="w-full px-[12px] py-[10px] border border-gray-300 rounded-[12px] text-[12px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder-gray-400 leading-relaxed"
                />
              </div>
            </div>

            {/* Modal submit footer */}
            <div className="border-t border-gray-100 p-[20px] bg-gray-50/50 flex gap-[10px]">
              <button
                onClick={() => setFeedbackModalOpen(false)}
                className="flex-1 py-[11px] border border-gray-300 rounded-[12px] text-[12px] font-bold text-gray-700 hover:bg-gray-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitFeedback}
                disabled={userRating === 0}
                className={`flex-1 py-[11px] font-bold rounded-[12px] text-[12px] transition shadow-md ${
                  userRating > 0
                    ? "bg-primary text-white hover:opacity-90 cursor-pointer shadow-primary/10"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
                }`}
              >
                Submit Feedback
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
