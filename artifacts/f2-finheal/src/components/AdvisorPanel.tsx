import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export interface Advisor {
  id: string;
  name: string;
  designation: string;
  avatarUrl: string;
  availability: "available" | "unavailable";
  expertise: string[];
  strength: string;
  bio: string;
  rating: number;
  reviewsCount: number;
  nextSlot: string;
  category: "tax" | "wealth" | "debt" | "property" | "insurance";
}

interface Appointment {
  advisorId: string;
  advisorName: string;
  date: string; // e.g., "Jun 3 (Wed)"
  time: string; // e.g., "11:00 AM"
  notes?: string;
  bookedAt: string;
}

interface AdvisorPanelProps {
  userId: string;
  onToggleSidebar: () => void;
  onToggleInsights: () => void;
}

const advisorsData: Advisor[] = [
  {
    id: "sneha-reddy",
    name: "Sneha Reddy",
    designation: "Debt Restructuring Specialist",
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=60",
    availability: "available",
    expertise: ["Debt Recovery", "CIBIL Score Repair", "EMI Optimization"],
    strength: "Constructing structured repayment paths & negotiation protocols.",
    bio: "Helping individuals overcome high-interest debt traps and systematically build back their credit rating using proven legal and analytical strategies.",
    rating: 4.9,
    reviewsCount: 142,
    nextSlot: "Today, 02:00 PM",
    category: "debt"
  },
  {
    id: "aradhya-sharma",
    name: "Aradhya Sharma",
    designation: "Certified Financial Planner (CFP)",
    avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=60",
    availability: "available",
    expertise: ["Tax Planning", "Retirement Setup", "Mutual Funds"],
    strength: "Maximizing tax exemptions & indexation benefits.",
    bio: "With over 9 years of advising corporate professionals, Aradhya excels in making tax structures simpler while laying solid foundations for early retirement.",
    rating: 4.8,
    reviewsCount: 189,
    nextSlot: "Tomorrow, 10:00 AM",
    category: "tax"
  },
  {
    id: "vikram-malhotra",
    name: "Vikram Malhotra",
    designation: "Portfolio Manager & Equity Strategist",
    avatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=60",
    availability: "unavailable",
    expertise: ["Wealth Building", "Stock Markets", "Risk Assessment"],
    strength: "Dynamic asset allocation and thematic market investing.",
    bio: "An ex-investment banker who believes in constructing robust, diversified portfolios tailored to specific risk tolerances and wealth goals.",
    rating: 4.9,
    reviewsCount: 210,
    nextSlot: "June 4, 11:30 AM",
    category: "wealth"
  },
  {
    id: "rohan-mehta",
    name: "Rohan Mehta",
    designation: "Real Estate & Mortgage Consultant",
    avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=60",
    availability: "available",
    expertise: ["Commercial Property", "Home Loans", "Mortgage Refinancing"],
    strength: "Leverage evaluation and long-term interest calculations.",
    bio: "Helping first-time home buyers navigate structural pricing models, interest rate locks, and choosing optimal mortgage products that match their monthly cashflows.",
    rating: 4.7,
    reviewsCount: 96,
    nextSlot: "Today, 04:30 PM",
    category: "property"
  },
  {
    id: "priya-nair",
    name: "Priya Nair",
    designation: "Estate & Family Insurance Strategist",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=60",
    availability: "unavailable",
    expertise: ["Trust Planning", "Legacy Setup", "Health & Term Coverage"],
    strength: "Family trust structures and generational wealth protection.",
    bio: "Specializes in providing custom inheritance blueprints, succession structures, and right-sized term plans to protect growing family liabilities.",
    rating: 4.9,
    reviewsCount: 115,
    nextSlot: "June 5, 09:30 AM",
    category: "insurance"
  }
];

export default function AdvisorPanel({ userId, onToggleSidebar, onToggleInsights }: AdvisorPanelProps) {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selectedAdvisor, setSelectedAdvisor] = useState<Advisor | null>(null);
  
  // Interactive calendar and selection states
  const [dateList, setDateList] = useState<{ dayName: string; dayNum: number; fullStr: string }[]>([]);
  const [selectedDateStr, setSelectedDateStr] = useState<string>("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("");
  const [userNotes, setUserNotes] = useState<string>("");
  const [bookingConfirmed, setBookingConfirmed] = useState<boolean>(false);
  const [confirmedApptDetails, setConfirmedApptDetails] = useState<Appointment | null>(null);
  
  // Load saved appointments from local storage
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    const storageKey = `finheal_advisor_appointments:${userId || "anonymous"}`;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        setAppointments(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse appointments", e);
      }
    }
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

  const handleOpenBooking = (advisor: Advisor) => {
    setSelectedAdvisor(advisor);
    setSelectedTimeSlot("10:00 AM"); // Default first slot
    setUserNotes("");
    setBookingConfirmed(false);
  };

  const handleCloseBooking = () => {
    setSelectedAdvisor(null);
    setBookingConfirmed(false);
  };

  const handleConfirmBooking = () => {
    if (!selectedAdvisor) return;

    const newAppt: Appointment = {
      advisorId: selectedAdvisor.id,
      advisorName: selectedAdvisor.name,
      date: selectedDateStr,
      time: selectedTimeSlot,
      notes: userNotes.trim(),
      bookedAt: new Date().toISOString()
    };

    // Filter out any previous appointment with the same advisor to replace it, or append
    const updated = appointments.filter(a => a.advisorId !== selectedAdvisor.id);
    updated.push(newAppt);
    saveAppointments(updated);

    setConfirmedApptDetails(newAppt);
    setBookingConfirmed(true);
    
    // Auto reset modal after a brief wow factor
    setTimeout(() => {
      handleCloseBooking();
    }, 4500);
  };

  const handleCancelAppointment = (advisorId: string) => {
    if (confirm("Are you sure you want to cancel your scheduled appointment with this expert?")) {
      const updated = appointments.filter(a => a.advisorId !== advisorId);
      saveAppointments(updated);
    }
  };

  // Filtered advisor list based on specialty category
  const filteredAdvisors = activeCategory === "all" 
    ? advisorsData 
    : advisorsData.filter(a => a.category === activeCategory);

  const categories = [
    { id: "all", label: "All Experts", icon: "🧑‍💼" },
    { id: "wealth", label: "Wealth & Investing", icon: "📈" },
    { id: "tax", label: "Tax & Retirement", icon: "💰" },
    { id: "debt", label: "Debt & Credit", icon: "⚠️" },
    { id: "property", label: "Real Estate", icon: "🏠" },
    { id: "insurance", label: "Insurance", icon: "🛡️" }
  ];

  const timeSlots = ["09:30 AM", "11:00 AM", "01:30 PM", "03:00 PM", "04:30 PM", "06:00 PM"];

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
              <span className="rounded-[999px] border border-gray-200 bg-white px-[10px] py-[5px] flex items-center gap-[4px]">💬 45 Min Consultation</span>
              <span className="rounded-[999px] border border-gray-200 bg-white px-[10px] py-[5px] flex items-center gap-[4px]">🎓 SEBI / CFP Certified</span>
              <span className="rounded-[999px] border border-gray-200 bg-white px-[10px] py-[5px] flex items-center gap-[4px]">🔒 Private & Confidential</span>
            </div>
          </div>
        </section>

        {/* UPCOMING APPOINTMENTS SECTION */}
        {appointments.length > 0 && (
          <section className="mt-[20px] animate-fade-up">
            <h2 className="text-[12px] font-semibold uppercase tracking-[0.9px] text-primary mb-[10px] flex items-center gap-[6px]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Your Scheduled Consultations ({appointments.length})
            </h2>
            <div className="grid gap-[12px] sm:grid-cols-2 lg:grid-cols-3">
              {appointments.map((appt) => {
                const advisor = advisorsData.find(a => a.id === appt.advisorId);
                return (
                  <div key={appt.advisorId} className="bg-[linear-gradient(135deg,#ffffff_0%,#f9faff_100%)] border border-primary/20 rounded-[18px] p-[16px] shadow-sm flex flex-col justify-between hover:border-primary/40 transition">
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

                    <div className="flex items-center gap-[8px] mt-[4px]">
                      <button
                        onClick={() => handleCancelAppointment(appt.advisorId)}
                        className="flex-1 py-[8px] rounded-[10px] text-[11px] font-bold border border-rose-100 text-rose-600 hover:bg-rose-50/50 transition cursor-pointer"
                      >
                        Cancel Call
                      </button>
                      <button
                        onClick={() => alert("The virtual conference room opens 5 minutes before your scheduled slot. We've sent a link to your email!")}
                        className="flex-1 py-[8px] rounded-[10px] text-[11px] font-bold bg-primary text-white hover:opacity-90 transition cursor-pointer"
                      >
                        Join Call
                      </button>
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
            {categories.map((cat) => (
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
        <section className="mt-[20px]">
          <div className="mb-[14px] flex items-center justify-between">
            <h2 className="text-[12px] font-semibold uppercase tracking-[0.9px] text-gray-400">Our Trusted Advisors</h2>
            <div className="text-[11px] text-gray-400 font-medium">Showing {filteredAdvisors.length} active experts</div>
          </div>

          <div className="grid gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
            {filteredAdvisors.map((advisor) => {
              const activeAppt = appointments.find(a => a.advisorId === advisor.id);
              
              return (
                <Card 
                  key={advisor.id} 
                  className={`relative overflow-hidden border-gray-200 shadow-sm flex flex-col justify-between transition-all duration-300 hover:-translate-y-[2px] hover:shadow-[0_14px_34px_rgba(15,23,42,0.08)] ${
                    activeAppt ? "ring-2 ring-primary/20 border-primary/20" : ""
                  }`}
                >
                  
                  {/* Visual Availability dot on top right corner */}
                  <div className="absolute top-[16px] right-[16px]">
                    {advisor.availability === "available" ? (
                      <div className="flex items-center gap-[5px] px-[8px] py-[3.5px] rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-[9.5px] font-bold">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        Available
                      </div>
                    ) : (
                      <div className="flex items-center gap-[5px] px-[8px] py-[3.5px] rounded-full bg-rose-50 border border-rose-100 text-rose-700 text-[9.5px] font-bold">
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                        Busy
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
                    <div className="min-w-0">
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
                              onClick={() => handleCancelAppointment(advisor.id)}
                              className="text-rose-500 font-bold hover:underline ml-2 cursor-pointer"
                              title="Cancel appointment"
                            >
                              Cancel
                            </button>
                          </div>
                          <button
                            onClick={() => alert("The virtual conference room opens 5 minutes before your scheduled slot. We've sent a link to your email!")}
                            className="w-full bg-[#ecfdf5] hover:bg-[#d1fae5] text-emerald-800 font-bold py-[9px] rounded-[10px] text-[12px] transition cursor-pointer text-center"
                          >
                            Join Call Room
                          </button>
                        </div>
                      ) : (
                        /* Standard Book Appointment Button */
                        <>
                          <div className="text-left">
                            <div className="text-[9.5px] text-gray-400 uppercase tracking-[0.5px]">Next Slot</div>
                            <div className="text-[11px] font-bold text-gray-800">{advisor.nextSlot}</div>
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
                      {timeSlots.map((slot) => (
                        <button
                          key={slot}
                          onClick={() => setSelectedTimeSlot(slot)}
                          className={`py-[9px] px-[8px] rounded-[10px] text-[11.5px] font-semibold text-center border transition cursor-pointer ${
                            selectedTimeSlot === slot
                              ? "bg-primary/10 border-primary text-primary font-bold"
                              : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
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
                    onClick={handleConfirmBooking}
                    className="flex-1 py-[11px] bg-primary text-white font-bold rounded-[12px] text-[12px] hover:opacity-90 transition cursor-pointer shadow-md shadow-primary/10"
                  >
                    Confirm Booking
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
