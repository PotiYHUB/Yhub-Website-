/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef } from 'react';
import { Room, Booking, CustomQuestion } from '../types';
import { 
  Users, DollarSign, Calendar as CalIcon, Clock, CheckCircle, 
  AlertTriangle, ChevronLeft, ChevronRight, MessageSquare, 
  Building2, User2, Eye, Info, Percent, X, Check, Youtube, Compass, GraduationCap,
  CalendarRange, Sparkles, Filter, Trash2
} from 'lucide-react';
import { 
  formatDisplayDate, 
  formatBookingDateSummary, 
  groupDatesByMonth, 
  getBookingConsecutiveRanges, 
  formatSingleDisplayDate 
} from '../utils/dateFormatter';
import { getMaxCapacity } from '../utils/capacityHelper';

interface RoomBookingProps {
  rooms: Room[];
  bookings: Booking[];
  customQuestions: CustomQuestion[];
  bookingSettingsValue?: { fullDayDiscount: number; multiDayDiscount: number }; // Optional fallback
  bookingSettings?: { 
    fullDayDiscount: number; 
    multiDayDiscount: number;
    schoolWaiverLabel?: string;
    schoolWaiverText?: string;
    [key: string]: any;
  };
  onAddBooking: (booking: Omit<Booking, 'id' | 'createdAt' | 'status'>) => void;
}

export default function RoomBooking({
  rooms,
  bookings,
  customQuestions,
  bookingSettings,
  onAddBooking
}: RoomBookingProps) {
  // Supports multi-room selections
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth()); // 0-indexed
  
  // Immersive Details Gallery state
  const [infoRoom, setInfoRoom] = useState<Room | null>(null);
  const [infoActiveTab, setInfoActiveTab] = useState<'photos' | 'panorama' | 'video'>('photos');

  // Form State
  const [selectedDates, setSelectedDates] = useState<string[]>([]); // YYYY-MM-DD list
  const [isFullDay, setIsFullDay] = useState<boolean>(false);
  const [numPeople, setNumPeople] = useState<number>(1);
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('12:00');

  // Multi-month range picker & presets state
  const [showRangePicker, setShowRangePicker] = useState<boolean>(false);
  const [rangeStart, setRangeStart] = useState<string>('');
  const [rangeEnd, setRangeEnd] = useState<string>('');
  const [rangeWeekdaysOnly, setRangeWeekdaysOnly] = useState<boolean>(false);
  const [isRangeClickMode, setIsRangeClickMode] = useState<boolean>(false);
  const [rangeAnchorDate, setRangeAnchorDate] = useState<string | null>(null);

  // Profile/Contact State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [organization, setOrganization] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isEducationalSchool, setIsEducationalSchool] = useState<boolean>(false);
  
  // Custom Answers State
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({});
  
  // Success popup state
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Booking Wizard Step (1: Date & Time, 2: Questionnaire & Contact Details)
  const [bookingStep, setBookingStep] = useState<1 | 2>(1);

  // Reference for scrolling to the top of the booking form list/section
  const formTopRef = useRef<HTMLDivElement>(null);

  // Find fully selected Room objects
  const selectedRooms = useMemo(() => {
    return rooms.filter(r => selectedRoomIds.includes(r.id));
  }, [rooms, selectedRoomIds]);

  // Calendar calculations
  const monthNames = [
    'იანვარი', 'თებერვალი', 'მარტი', 'აპრილი', 'მაისი', 'ივნისი',
    'ივლისი', 'აგვისტო', 'სექტემბერი', 'ოქტომბერი', 'ნოემბერი', 'დეკემბერი'
  ];
  
  const daysInMonth = useMemo(() => {
    return new Date(currentYear, currentMonth + 1, 0).getDate();
  }, [currentYear, currentMonth]);

  const firstDayIndex = useMemo(() => {
    let day = new Date(currentYear, currentMonth, 1).getDay();
    return day === 0 ? 6 : day - 1;
  }, [currentYear, currentMonth]);

  const prevMonthDays = useMemo(() => {
    return new Date(currentYear, currentMonth, 0).getDate();
  }, [currentYear, currentMonth]);

  // Parse time range range string into minute integers
  const parseTimeRange = (durationText: string) => {
    if (durationText.includes("მთელი დღე") || durationText === "00:00 - 24:00") {
      return { start: 0, end: 1440 };
    }
    const parts = durationText.split('-').map(p => p.trim());
    if (parts.length !== 2) return null;
    const [startStr, endStr] = parts;
    const [startH, startM] = startStr.split(':').map(Number);
    const [endH, endM] = endStr.split(':').map(Number);
    return {
      start: startH * 60 + startM,
      end: endH * 60 + endM
    };
  };

  // Get both approved and pending bookings on a selected date, overlapping any of the currently selected rooms
  const getBookingsForDate = (dateString: string) => {
    if (selectedRoomIds.length === 0 || !dateString) return [];
    return bookings.filter(
      b => {
        const bookingRoomIds = b.roomId.split(',').map(id => id.trim());
        const hasOverlapRoom = selectedRoomIds.some(id => bookingRoomIds.includes(id));
        return hasOverlapRoom && 
               b.status !== 'rejected' &&
               b.date.split(',').map(d => d.trim()).includes(dateString);
      }
    );
  };

  // Find overlapping booking given a target date and hours
  const checkTimeOverlap = (dateStr: string, startStr: string, endStr: string) => {
    if (selectedRoomIds.length === 0 || !dateStr || !startStr || !endStr) return null;
    
    const [startH, startM] = startStr.split(':').map(Number);
    const [endH, endM] = endStr.split(':').map(Number);
    const userStart = startH * 60 + startM;
    const userEnd = endH * 60 + endM;
    
    if (userStart >= userEnd) return null;
    
    const dayBookings = getBookingsForDate(dateStr);
    for (const b of dayBookings) {
      const range = parseTimeRange(b.durationHours);
      if (range) {
        if (userStart < range.end && range.start < userEnd) {
          return b;
        }
      }
    }
    return null;
  };

  // Memoized conflict for real-time form feedback
  const bookingConflict = useMemo(() => {
    const sTime = isFullDay ? '00:00' : startTime;
    const eTime = isFullDay ? '24:00' : endTime;
    
    for (const d of selectedDates) {
      const conflict = checkTimeOverlap(d, sTime, eTime);
      if (conflict) {
        return conflict;
      }
    }
    return null;
  }, [selectedDates, startTime, endTime, isFullDay, selectedRoomIds, bookings]);

  // Check if a specific date number has any active bookings at all on our selected rooms
  const getBookingStatusForDate = (dayNumber: number) => {
    if (selectedRoomIds.length === 0) return null;
    const formattedDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
    const dateBookings = getBookingsForDate(formattedDate);
    return dateBookings.length > 0 ? dateBookings : null;
  };

  // Switch calendar month
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // Hours length calculation
  const calculatedHours = useMemo(() => {
    if (isFullDay) return 12;
    if (!startTime || !endTime) return 1;
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const durationMin = (endH * 60 + endM) - (startH * 60 + startM);
    const durationHours = Math.max(0.5, durationMin / 60);
    return Math.ceil(durationHours);
  }, [startTime, endTime, isFullDay]);

  // Cohesive discount and pricing model breakdown calculations
  const priceBreakdown = useMemo(() => {
    const sumHourPrice = selectedRooms.reduce((acc, r) => acc + r.price, 0);
    const sumDayPrice = selectedRooms.reduce((acc, r) => acc + (r.dayPrice || Math.round(r.price * 8)), 0);
    const daysCount = Math.max(1, selectedDates.length);
    const basePrice = isFullDay ? sumDayPrice * daysCount : sumHourPrice * calculatedHours * daysCount;

    if (isEducationalSchool) {
      return {
        sumHourPrice,
        sumDayPrice,
        daysCount,
        basePrice,
        fullDayPct: 0,
        multiDayPct: 0,
        discountAmount: basePrice,
        finalPrice: 0,
        isEducationalPromo: true
      };
    }

    return {
      sumHourPrice,
      sumDayPrice,
      daysCount,
      basePrice,
      fullDayPct: 0,
      multiDayPct: 0,
      discountAmount: 0,
      finalPrice: basePrice,
      isEducationalPromo: false
    };
  }, [selectedRooms, calculatedHours, selectedDates, isFullDay, isEducationalSchool]);

  const currentTotalPrice = priceBreakdown.finalPrice;

  // Click handler to toggle selected rooms
  const handleRoomToggle = (roomId: string) => {
    setSelectedRoomIds(prev => {
      if (prev.includes(roomId)) {
        return prev.filter(id => id !== roomId);
      } else {
        return [...prev, roomId];
      }
    });
    setBookingStep(1); // ALWAYS reset step to 1 on room selection change
    setErrorMessage('');
  };

  const handleContinueToQuestionnaire = () => {
    setErrorMessage('');

    if (selectedRoomIds.length === 0) {
      setErrorMessage('გთხოვთ აირჩიოთ მინიმუმ ერთი სამუშაო ოთახი.');
      return;
    }
    if (selectedDates.length === 0) {
      setErrorMessage('გთხოვთ მონიშნოთ მინიმუმ ერთი სასურველი თარიღი კალენდარზე.');
      return;
    }

    // Capacity validation check (runs across all selected rooms to ensure maximum constraints)
    for (const r of selectedRooms) {
      const maxCap = getMaxCapacity(r.capacity);
      if (maxCap > 0 && numPeople > maxCap) {
        setErrorMessage(`დაუშვებელია დაჯავშნა! ოთახის "${r.name}" მაქსიმალური ტევადობაა ${r.capacity} ადამიანი.`);
        return;
      }
    }

    if (!isFullDay && (calculatedHours <= 0 || startTime >= endTime)) {
      setErrorMessage('ჯავშნის დასრულების დრო უნდა აღემატებოდეს დაწყების დროს.');
      return;
    }

    if (bookingConflict) {
      const conflictMsg = isFullDay 
        ? `შერჩეული დღე(ები) ემთხვევა არსებულ ჯავშანს: ${bookingConflict.durationHours}.`
        : `მოცემული დროის შუალედი (${startTime} - ${endTime}) ემთხვევა არსებულ ჯავშანს: ${bookingConflict.durationHours}.`;
      setErrorMessage(conflictMsg);
      return;
    }

    setBookingStep(2);
    setTimeout(() => {
      formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const handleApplyDateRange = (startDateStr: string, endDateStr: string, weekdaysOnly: boolean) => {
    if (!startDateStr || !endDateStr) return;
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return;

    const newDates: string[] = [];
    const cur = new Date(start);
    while (cur <= end) {
      const dayOfWeek = cur.getDay(); // 0 = Sun, 6 = Sat
      if (!weekdaysOnly || (dayOfWeek !== 0 && dayOfWeek !== 6)) {
        newDates.push(cur.toISOString().split('T')[0]);
      }
      cur.setDate(cur.getDate() + 1);
    }

    setSelectedDates(prev => Array.from(new Set([...prev, ...newDates])).sort());
    setErrorMessage('');
  };

  const handleApplyPreset = (preset: 'currentMonth' | 'nextMonth' | 'next2Months' | 'next3Months') => {
    const today = new Date();
    const curY = today.getFullYear();
    const curM = today.getMonth();

    if (preset === 'currentMonth') {
      const startStr = `${curY}-${String(curM + 1).padStart(2, '0')}-01`;
      const lastDay = new Date(curY, curM + 1, 0).getDate();
      const endStr = `${curY}-${String(curM + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      handleApplyDateRange(startStr, endStr, rangeWeekdaysOnly);
    } else if (preset === 'nextMonth') {
      const nextDate = new Date(curY, curM + 1, 1);
      const nY = nextDate.getFullYear();
      const nM = nextDate.getMonth();
      const startStr = `${nY}-${String(nM + 1).padStart(2, '0')}-01`;
      const lastDay = new Date(nY, nM + 1, 0).getDate();
      const endStr = `${nY}-${String(nM + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      handleApplyDateRange(startStr, endStr, rangeWeekdaysOnly);
    } else if (preset === 'next2Months') {
      const startStr = `${curY}-${String(curM + 1).padStart(2, '0')}-01`;
      const targetDate = new Date(curY, curM + 2, 0); // last day of next month
      const tY = targetDate.getFullYear();
      const tM = targetDate.getMonth();
      const lastDay = targetDate.getDate();
      const endStr = `${tY}-${String(tM + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      handleApplyDateRange(startStr, endStr, rangeWeekdaysOnly);
    } else if (preset === 'next3Months') {
      const startStr = `${curY}-${String(curM + 1).padStart(2, '0')}-01`;
      const targetDate = new Date(curY, curM + 3, 0); // last day of 2 months later
      const tY = targetDate.getFullYear();
      const tM = targetDate.getMonth();
      const lastDay = targetDate.getDate();
      const endStr = `${tY}-${String(tM + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      handleApplyDateRange(startStr, endStr, rangeWeekdaysOnly);
    }
  };

  const handleClearMonthDates = (monthKey: string) => {
    setSelectedDates(prev => prev.filter(d => !d.startsWith(monthKey)));
  };

  const handleDaySelect = (dayNumber: number) => {
    const formattedDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
    
    if (isRangeClickMode) {
      if (!rangeAnchorDate) {
        setRangeAnchorDate(formattedDate);
      } else {
        const d1 = new Date(rangeAnchorDate);
        const d2 = new Date(formattedDate);
        const start = d1 <= d2 ? d1 : d2;
        const end = d1 <= d2 ? d2 : d1;
        
        const newDates: string[] = [];
        const cur = new Date(start);
        while (cur <= end) {
          const dayOfWeek = cur.getDay();
          if (!rangeWeekdaysOnly || (dayOfWeek !== 0 && dayOfWeek !== 6)) {
            newDates.push(cur.toISOString().split('T')[0]);
          }
          cur.setDate(cur.getDate() + 1);
        }
        
        setSelectedDates(prev => Array.from(new Set([...prev, ...newDates])).sort());
        setRangeAnchorDate(null);
        setIsRangeClickMode(false);
      }
    } else {
      setSelectedDates(prev => {
        if (prev.includes(formattedDate)) {
          return prev.filter(d => d !== formattedDate);
        } else {
          return [...prev, formattedDate];
        }
      });
    }
    setErrorMessage('');
  };

  const handleCustomAnswerChange = (questionLabel: string, value: string) => {
    setCustomAnswers(prev => ({
      ...prev,
      [questionLabel]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (selectedRoomIds.length === 0) {
      setErrorMessage('გთხოვთ აირჩიოთ მინიმუმ ერთი სამუშაო ოთახი.');
      return;
    }
    if (selectedDates.length === 0) {
      setErrorMessage('გთხოვთ მონიშნოთ მინიმუმ ერთი სასურველი თარიღი კალენდარზე.');
      return;
    }

    // Capacity validation check (runs across all selected rooms to ensure maximum constraints)
    for (const r of selectedRooms) {
      const maxCap = getMaxCapacity(r.capacity);
      if (maxCap > 0 && numPeople > maxCap) {
        setErrorMessage(`დაუშვებელია დაჯავშნა! ოთახის "${r.name}" მაქსიმალური ტევადობაა ${r.capacity} ადამიანი.`);
        return;
      }
    }

    if (!isFullDay && (calculatedHours <= 0 || startTime >= endTime)) {
      setErrorMessage('ჯავშნის დასრულების დრო უნდა აღემატებოდეს დაწყების დროს.');
      return;
    }

    if (bookingConflict) {
      const conflictMsg = isFullDay 
        ? `შერჩეული დღე(ები) ემთხვევა არსებულ ჯავშანს: ${bookingConflict.durationHours}. გთხოვთ შეარჩიოთ თავისუფალი საათები ან დღეები.`
        : `მოცემული დროის შუალედი (${startTime} - ${endTime}) ემთხვევა არსებულ ჯავშანს: ${bookingConflict.durationHours}. გთხოვთ შეარჩიოთ სხვა საათები.`;
      setErrorMessage(conflictMsg);
      return;
    }

    if (!firstName || !lastName || !email || !phone) {
      setErrorMessage('გთხოვთ შეავსოთ ყველა აუცილებელი საკონტაქტო ველი.');
      return;
    }

    for (const q of customQuestions) {
      if (q.required && !customAnswers[q.label]?.trim()) {
        setErrorMessage(`გთხოვთ უპასუხოთ სავალდებულო კითხვას: "${q.label}"`);
        return;
      }
    }

    const durationText = isFullDay ? "მთელი დღე" : `${startTime} - ${endTime}`;
    const dateString = selectedDates.join(', ');
    
    // Create new booking record. Commas map multiple items gracefully
    onAddBooking({
      roomId: selectedRoomIds.join(', '),
      roomName: selectedRooms.map(r => r.name).join(', '),
      date: dateString,
      durationHours: durationText,
      numPeople,
      totalPrice: currentTotalPrice,
      firstName,
      lastName,
      organization: organization || undefined,
      email,
      phone,
      answers: customAnswers
    });

    // Reset inputs, triggers success popup overlay!
    setIsSuccess(true);
    setSelectedDates([]);
    setIsFullDay(false);
    setNumPeople(1);
    setFirstName('');
    setLastName('');
    setOrganization('');
    setEmail('');
    setPhone('');
    setCustomAnswers({});
    setBookingStep(1);
  };

  return (
    <section id="booking" className="py-20 bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-emerald-600 text-xs font-bold tracking-widest uppercase bg-emerald-50 px-3 py-1.5 rounded-full font-mono">
            ჯავშნის სისტემა
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl font-display font-black text-slate-900 tracking-tight">
            დაჯავშნე სამუშაო სივრცე
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 font-sans leading-relaxed">
            შეარჩიე სასურველი სამუშაო სივრცე (ან მოხაზეთ რამდენიმე ერთად), მონიშნეთ თავისუფალი დღეები კალენდარზე და შეავსეთ მოკლე განაცხადი.
          </p>
        </div>

        {/* Normal booking flow layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Side: Rooms Catalog & Info trigger buttons */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              <h3 className="font-display font-extrabold text-lg sm:text-xl text-slate-900 flex items-center justify-between mb-6">
                <span className="flex items-center">
                  <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-sm mr-2.5">1</span>
                  <span>აირჩიეთ სამუშაო ოთახი</span>
                </span>
                {selectedRoomIds.length > 0 && (
                  <span className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-bold">
                    მონიშნულია {selectedRoomIds.length} სივრცე
                  </span>
                )}
              </h3>
              
              <div className="space-y-4">
                {rooms.map((room) => {
                  const isSelected = selectedRoomIds.includes(room.id);
                  return (
                    <div
                      key={room.id}
                      id={`room-option-${room.id}`}
                      onClick={() => handleRoomToggle(room.id)}
                      className={`flex flex-col sm:flex-row bg-slate-50 border rounded-2xl overflow-hidden cursor-pointer hover:border-slate-350 transition-all ${
                        isSelected
                          ? 'ring-2 ring-slate-900 border-slate-900 bg-white'
                          : 'border-slate-100'
                      }`}
                    >
                      {/* Room Picture */}
                      <div className="w-full sm:w-1/3 h-40 bg-slate-100 shrink-0 relative">
                        <img
                          src={room.imageUrl}
                          alt={room.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                        {isSelected && (
                          <div className="absolute top-3 left-3 bg-slate-900 text-white p-1 rounded-full shadow-md">
                            <Check className="h-4 w-4" />
                          </div>
                        )}
                      </div>

                      {/* Room Basic texts */}
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start">
                            <h4 className="font-display font-extrabold text-sm sm:text-base text-slate-900 flex-1 pr-2">{room.name}</h4>
                            <div className="flex flex-col items-end gap-1 shrink-0 select-none">
                              <span className="bg-slate-100 px-2.5 py-1 rounded-xl text-slate-800 text-xs font-black font-mono">
                                ₾{room.price}/სთ
                              </span>
                              <span className="bg-brand-50 px-2 py-0.5 rounded-lg text-brand-700 text-[10px] font-bold font-mono border border-brand-100">
                                ₾{room.dayPrice || Math.round(room.price * 8)}/დღე
                              </span>
                            </div>
                          </div>
                          <p className="mt-1.5 text-xs text-slate-500 line-clamp-2 leading-relaxed font-sans">{room.description}</p>
                        </div>

                        {/* Room controls trigger toolbar */}
                        <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-slate-100 pt-3">
                          {getMaxCapacity(room.capacity) > 0 && (
                            <span className="flex items-center text-xs text-slate-500 font-bold">
                              <Users className="h-3.5 w-3.5 mr-1" />
                              <span>ტევადობა: {room.capacity} პერსონა</span>
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setInfoActiveTab('photos');
                              setInfoRoom(room);
                            }}
                            className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                          >
                            <Info className="h-3.5 w-3.5 text-brand-500" />
                            <span>დამატებითი ინფორმაცია</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Side: Interactive Calendar Booking Questionnaire */}
          <div ref={formTopRef} className="lg:col-span-6 bg-slate-50 border border-slate-100 p-6 sm:p-8 rounded-3xl">
            <h3 className="font-display font-extrabold text-lg sm:text-xl text-slate-900 flex items-center mb-6">
              <span className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-sm mr-2.5">2</span>
              <span>ჯავშნისა და კითხვარის დეტალები</span>
            </h3>

            {selectedRoomIds.length === 0 ? (
              /* Display prompt when no space is selected */
              <div className="text-center py-20 text-slate-400 font-medium">
                <CalIcon className="h-10 w-10 mx-auto mb-3 text-slate-300 animate-bounce" />
                <span>დაჯავშნის დასაწყებად მარცხენა პანელიდან აირჩიეთ სასურველი სამუშაო სივრცე(ები).</span>
              </div>
            ) : (
              /* Actual form contents mapping selected spaces */
              <form id="booking-form" onSubmit={handleSubmit} className="space-y-6 flex flex-col">
                
                {/* Step indicator */}
                <div className="flex items-center justify-between border-b border-slate-205 pb-4 mb-4 select-none">
                  <div className="flex items-center space-x-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition-colors ${
                      bookingStep === 1 
                        ? 'bg-slate-950 text-white' 
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {bookingStep > 1 ? '✓' : '1'}
                    </span>
                    <span className={`text-xs font-bold font-sans ${
                      bookingStep === 1 ? 'text-slate-900 border-b-2 border-slate-900 pb-0.5' : 'text-slate-500'
                    }`}>
                      თარიღი & დრო
                    </span>
                  </div>
                  <div className="h-0.5 bg-slate-200 flex-1 mx-4" />
                  <div className="flex items-center space-x-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition-colors ${
                      bookingStep === 2 
                        ? 'bg-slate-950 text-white' 
                        : 'bg-slate-200 text-slate-500'
                    }`}>
                      2
                    </span>
                    <span className={`text-xs font-bold font-sans ${
                      bookingStep === 2 ? 'text-slate-900 border-b-2 border-slate-900 pb-0.5' : 'text-slate-500'
                    }`}>
                      კითხვარი & საკონტაქტო
                    </span>
                  </div>
                </div>

                {bookingStep === 1 ? (
                  /* STEP 1: Date & Time Calendar selection screen */
                  <div className="space-y-6 animate-fadeIn">
                    {/* Month Picker Widgets layout */}
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                        <label className="block text-xs font-black uppercase text-slate-500 tracking-wider">
                          აირჩიეთ თარიღი კალენდარზე ({monthNames[currentMonth]} {currentYear})
                        </label>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setShowRangePicker(prev => !prev)}
                            className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all flex items-center gap-1 cursor-pointer ${
                              showRangePicker 
                                ? 'bg-brand-600 text-white border-brand-600 shadow-2xs' 
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <CalendarRange className="h-3.5 w-3.5" />
                            <span>{showRangePicker ? 'დიაპაზონის დახურვა' : 'პერიოდის / დიაპაზონის არჩევა'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setIsRangeClickMode(prev => !prev);
                              setRangeAnchorDate(null);
                            }}
                            className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all flex items-center gap-1 cursor-pointer ${
                              isRangeClickMode 
                                ? 'bg-amber-500 text-white border-amber-600 shadow-2xs' 
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                            }`}
                            title="კალენდარზე პირველი და ბოლო დღის დაკლიკებით დიაპაზონის მონიშვნა"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>{isRangeClickMode ? (rangeAnchorDate ? 'დააკლიკეთ ბოლო დღეს' : 'დააკლიკეთ პირველ დღეს') : '2-კლიკიანი დიაპაზონი'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Expandable Multi-Month Range Picker & Presets Panel */}
                      {showRangePicker && (
                        <div className="mb-3.5 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 animate-fadeIn">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                              <CalendarRange className="h-4 w-4 text-brand-600" />
                              <span>მრავალდღიანი პერიოდის სწრაფი მონიშვნა</span>
                            </span>
                            <span className="text-[11px] text-slate-500">
                              შეგიძლიათ მონიშნოთ ნებისმიერი ხანგრძლივობის პერიოდი რამდენიმე თვის მასშტაბით
                            </span>
                          </div>

                          {/* Quick Presets */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] font-bold uppercase text-slate-400 mr-1">სწრაფი პაკეტები:</span>
                            <button
                              type="button"
                              onClick={() => handleApplyPreset('currentMonth')}
                              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 shadow-2xs cursor-pointer transition-colors"
                            >
                              მიმდინარე თვე
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApplyPreset('nextMonth')}
                              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 shadow-2xs cursor-pointer transition-colors"
                            >
                              მომდევნო თვე
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApplyPreset('next2Months')}
                              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-brand-50 border border-brand-200 text-brand-700 hover:bg-brand-100 shadow-2xs cursor-pointer transition-colors"
                            >
                              2 თვე (სრული)
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApplyPreset('next3Months')}
                              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-brand-50 border border-brand-200 text-brand-700 hover:bg-brand-100 shadow-2xs cursor-pointer transition-colors"
                            >
                              3 თვე (სრული)
                            </button>
                          </div>

                          {/* Custom Date Range Inputs */}
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-slate-500 font-medium">დან:</span>
                              <input
                                type="date"
                                value={rangeStart}
                                onChange={(e) => setRangeStart(e.target.value)}
                                className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 focus:outline-hidden"
                              />
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-slate-500 font-medium">მდე:</span>
                              <input
                                type="date"
                                value={rangeEnd}
                                onChange={(e) => setRangeEnd(e.target.value)}
                                className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 focus:outline-hidden"
                              />
                            </div>

                            <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer select-none bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                              <input
                                type="checkbox"
                                checked={rangeWeekdaysOnly}
                                onChange={(e) => setRangeWeekdaysOnly(e.target.checked)}
                                className="h-3.5 w-3.5 rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
                              />
                              <span>მხოლოდ სამუშაო დღეები (ორშ-პარ)</span>
                            </label>

                            <button
                              type="button"
                              onClick={() => handleApplyDateRange(rangeStart, rangeEnd, rangeWeekdaysOnly)}
                              disabled={!rangeStart || !rangeEnd}
                              className="px-3 py-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-2xs"
                            >
                              ✓ დიაპაზონის მონიშვნა
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Multi-Month Quick-Jump Badges (if dates selected in multiple months) */}
                      {(() => {
                        const monthGroups = groupDatesByMonth(selectedDates);
                        if (monthGroups.length <= 1) return null;

                        return (
                          <div className="mb-2.5 p-2 bg-slate-50 border border-slate-200/80 rounded-xl flex flex-wrap items-center gap-1.5 text-xs">
                            <span className="text-[10px] font-black uppercase text-slate-400 mr-1">მონიშნული თვეები:</span>
                            {monthGroups.map(group => {
                              const [yStr, mStr] = group.monthKey.split('-');
                              const gY = parseInt(yStr, 10);
                              const gM = parseInt(mStr, 10) - 1;
                              const isCurrentViewingMonth = currentYear === gY && currentMonth === gM;

                              return (
                                <button
                                  key={group.monthKey}
                                  type="button"
                                  onClick={() => {
                                    setCurrentYear(gY);
                                    setCurrentMonth(gM);
                                  }}
                                  className={`px-2 py-0.5 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                                    isCurrentViewingMonth
                                      ? 'bg-brand-600 text-white border-brand-600 shadow-2xs'
                                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                                  }`}
                                  title={`გადართვა კალენდარზე: ${group.monthLabel}`}
                                >
                                  <span>{group.monthLabel}</span>
                                  <span className={`text-[10px] px-1 rounded-sm ${isCurrentViewingMonth ? 'bg-brand-700 text-white' : 'bg-slate-100 text-slate-600 font-mono'}`}>
                                    {group.dates.length} დღე
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        );
                      })()}

                      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
                        
                        <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
                          <div className="flex items-center gap-2">
                            <select
                              value={currentMonth}
                              onChange={(e) => setCurrentMonth(Number(e.target.value))}
                              className="font-display font-bold text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 focus:outline-hidden cursor-pointer"
                            >
                              {monthNames.map((m, idx) => (
                                <option key={idx} value={idx}>{m}</option>
                              ))}
                            </select>

                            <select
                              value={currentYear}
                              onChange={(e) => setCurrentYear(Number(e.target.value))}
                              className="font-display font-bold text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 focus:outline-hidden cursor-pointer font-mono"
                            >
                              {Array.from({ length: 5 }).map((_, idx) => {
                                const yr = new Date().getFullYear() + idx;
                                return <option key={yr} value={yr}>{yr}</option>;
                              })}
                            </select>

                            {isRangeClickMode && (
                              <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md animate-pulse">
                                {rangeAnchorDate ? `საწყისი: ${rangeAnchorDate} ➔ დააკლიკეთ მეორე დღეს` : 'დააკლიკეთ საწყის დღეს'}
                              </span>
                            )}
                          </div>

                          <div className="flex space-x-1">
                            <button
                              id="cal-prev"
                              type="button"
                              onClick={handlePrevMonth}
                              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
                              title="წინა თვე"
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </button>
                            <button
                              id="cal-next"
                              type="button"
                              onClick={handleNextMonth}
                              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
                              title="მომდევნო თვე"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Georgian Days list */}
                        <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase font-black text-slate-400 mb-2">
                          <span>ორშ</span>
                          <span>სამ</span>
                          <span>ოთხ</span>
                          <span>ხუთ</span>
                          <span>პარ</span>
                          <span>შაბ</span>
                          <span>კვი</span>
                        </div>

                        {/* Gregorian grid days rendering */}
                        <div className="grid grid-cols-7 gap-1">
                          {Array.from({ length: firstDayIndex }).map((_, i) => (
                            <div
                              key={`pad-${i}`}
                              className="aspect-square text-[11px] text-slate-250 flex items-center justify-center font-sans font-light"
                            >
                              {prevMonthDays - firstDayIndex + i + 1}
                            </div>
                          ))}

                          {Array.from({ length: daysInMonth }).map((_, i) => {
                            const dayNum = i + 1;
                            const formattedDateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                            const isSelected = selectedDates.includes(formattedDateString);
                            const isAnchor = isRangeClickMode && rangeAnchorDate === formattedDateString;
                            
                            const matchedBookings = getBookingStatusForDate(dayNum);
                            const hasBookings = !!matchedBookings;
                            const isFullyBooked = hasBookings && matchedBookings.some(
                              b => b.durationHours.includes("მთელი დღე") || b.durationHours === "00:00 - 24:00"
                            );
                            
                            return (
                              <button
                                key={`day-${dayNum}`}
                                id={`cal-day-${formattedDateString}`}
                                type="button"
                                onClick={() => handleDaySelect(dayNum)}
                                className={`aspect-square text-xs font-bold rounded-lg flex flex-col items-center justify-center transition-all relative ${
                                  isAnchor
                                    ? 'bg-amber-500 text-white ring-2 ring-amber-400 scale-105 shadow-sm'
                                    : isSelected
                                      ? 'bg-slate-900 text-white scale-105 shadow-sm border-none'
                                      : isFullyBooked
                                        ? 'bg-rose-55 text-rose-700 border border-rose-150 cursor-pointer'
                                        : hasBookings
                                          ? 'bg-amber-55 text-amber-805 border border-amber-150 cursor-pointer'
                                          : 'bg-slate-50 hover:bg-slate-200 text-slate-700 cursor-pointer border-none'
                                }`}
                              >
                                <span>{dayNum}</span>
                                {isFullyBooked ? (
                                  <span className={`absolute bottom-0.5 text-[6px] font-black uppercase tracking-tight ${
                                    isSelected ? 'text-white' : 'text-rose-600'
                                  }`}>
                                    სრულად
                                  </span>
                                ) : hasBookings ? (
                                  <span className={`absolute bottom-0.5 text-[6px] font-black uppercase tracking-tight ${
                                    isSelected ? 'text-white' : 'text-amber-600'
                                  }`}>
                                    ჯავშანი
                                  </span>
                                ) : null}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Date details mapping list grouped by Month */}
                      {selectedDates.length > 0 && (
                        <div className="mt-3 p-4 bg-white border border-slate-200/80 rounded-2xl space-y-3 max-h-80 overflow-y-auto shadow-sm">
                          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                              <span className="text-xs font-bold text-slate-900">
                                სულ მონიშნულია <span className="font-mono text-emerald-700">{selectedDates.length}</span> დღე
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {(() => {
                                const ranges = getBookingConsecutiveRanges(selectedDates);
                                if (ranges.length === 1) {
                                  return (
                                    <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md font-bold">
                                      {ranges[0].formattedStart === ranges[0].formattedEnd ? ranges[0].formattedStart : `${ranges[0].formattedStart} – ${ranges[0].formattedEnd}`}
                                    </span>
                                  );
                                }
                                return (
                                  <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md font-bold">
                                    {ranges.length} პერიოდი
                                  </span>
                                );
                              })()}

                              <button 
                                type="button" 
                                onClick={() => setSelectedDates([])}
                                className="text-[11px] text-rose-500 hover:text-rose-700 underline font-sans cursor-pointer font-bold"
                              >
                                გასუფთავება
                              </button>
                            </div>
                          </div>

                          {/* Consecutive Ranges Overview */}
                          {(() => {
                            const ranges = getBookingConsecutiveRanges(selectedDates);
                            if (ranges.length <= 1) return null;

                            return (
                              <div className="flex flex-wrap gap-1.5 pb-1">
                                {ranges.map((rng, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-[11px] font-medium text-slate-700"
                                  >
                                    <span className="font-mono font-bold text-slate-900 mr-1">
                                      {rng.formattedStart === rng.formattedEnd ? rng.formattedStart : `${rng.formattedStart} – ${rng.formattedEnd}`}
                                    </span>
                                    <span className="text-slate-400">({rng.count} დღე)</span>
                                  </span>
                                ))}
                              </div>
                            );
                          })()}
                          
                          {/* Grouped by Month */}
                          <div className="space-y-3 pt-1">
                            {groupDatesByMonth(selectedDates).map(group => (
                              <div key={group.monthKey} className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/90 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-slate-800">
                                    {group.monthLabel} ({group.dates.length} დღე)
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleClearMonthDates(group.monthKey)}
                                    className="text-[10px] text-slate-400 hover:text-rose-600 font-sans cursor-pointer"
                                    title="ამ თვის ყველა თარიღის წაშლა"
                                  >
                                    ✕ თვის გასუფთავება
                                  </button>
                                </div>

                                <div className="flex flex-wrap gap-1.5">
                                  {group.dates.map(dateStr => {
                                    const dayBookings = getBookingsForDate(dateStr);
                                    const hasConflict = dayBookings.length > 0;
                                    const dayFullyBooked = dayBookings.some(b => b.durationHours.includes("მთელი დღე") || b.durationHours === "00:00 - 24:00");

                                    return (
                                      <span
                                        key={dateStr}
                                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-mono font-medium shadow-2xs ${
                                          dayFullyBooked
                                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                                            : hasConflict
                                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                                              : 'bg-white text-slate-800 border-slate-200'
                                        }`}
                                      >
                                        <span>{formatSingleDisplayDate(dateStr)}</span>
                                        {dayFullyBooked && <span className="text-[9px] font-black text-rose-600 uppercase">სრულად</span>}
                                        <button
                                          type="button"
                                          onClick={() => setSelectedDates(prev => prev.filter(d => d !== dateStr))}
                                          className="text-slate-400 hover:text-rose-600 cursor-pointer ml-0.5"
                                          title="წაშლა"
                                        >
                                          <X className="h-3 w-3" />
                                        </button>
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Slots and people volume controllers */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      {/* Option for Full Day Reservation */}
                      <div className="sm:col-span-2 bg-slate-100 p-3.5 rounded-xl border border-slate-200/60 shadow-2xs">
                        <label className="flex items-start space-x-2.5 cursor-pointer select-none">
                          <input
                            id="form-full-day-checkbox"
                            type="checkbox"
                            checked={isFullDay}
                            onChange={(e) => setIsFullDay(e.target.checked)}
                            className="mt-0.5 h-4 w-4 rounded text-slate-900 border-slate-300 focus:ring-slate-500 cursor-pointer"
                          />
                          <div className="flex-1">
                            <span className="block text-xs font-black text-slate-800">სრული დღით დაჯავშნა</span>
                            <span className="block text-[10px] text-slate-500 mt-0.5 leading-relaxed font-sans">
                              საათობრივის ნაცვლად მთელი დღით დაჯავშნა (12 საათიანი ბლოკი). ამ შემთხვევაში იმოქმედებს თითოეული ოთახისთვის განკუთვნილი დღიური ტარიფი.
                            </span>
                          </div>
                        </label>
                      </div>

                      {/* Number of People */}
                      <div>
                        <label className="block text-xs font-black uppercase text-slate-450 tracking-wider mb-2">
                          ადამიანთა რაოდენობა
                        </label>
                        <input
                          id="form-people-input"
                          type="number"
                          min="1"
                          value={numPeople}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 1;
                            setNumPeople(value);
                          }}
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden font-sans"
                          required
                        />
                      </div>

                      {/* 24-Hour dropdown selects */}
                      <div>
                        <label className="block text-xs font-black uppercase text-slate-450 tracking-wider mb-2">
                          სამუშაო შუალედი (24H)
                        </label>
                        <div className="flex space-x-1 items-center">
                          <select
                            id="form-start-time"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            disabled={isFullDay}
                            className={`w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-center font-mono focus:outline-hidden ${isFullDay ? 'opacity-40 cursor-not-allowed bg-slate-100' : ''}`}
                            required={!isFullDay}
                          >
                            {Array.from({ length: 24 }).map((_, h) => {
                              const hr = String(h).padStart(2, '0');
                              return (
                                <React.Fragment key={hr}>
                                  <option value={`${hr}:00`}>{hr}:00</option>
                                  <option value={`${hr}:30`}>{hr}:30</option>
                                </React.Fragment>
                              );
                            })}
                          </select>
                          
                          <span className="text-slate-400 font-bold">-</span>
                          
                          <select
                            id="form-end-time"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            disabled={isFullDay}
                            className={`w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-center font-mono focus:outline-hidden ${isFullDay ? 'opacity-40 cursor-not-allowed bg-slate-100' : ''}`}
                            required={!isFullDay}
                          >
                            {Array.from({ length: 24 }).map((_, h) => {
                              const hr = String(h).padStart(2, '0');
                              return (
                                <React.Fragment key={hr}>
                                  <option value={`${hr}:00`}>{hr}:00</option>
                                  <option value={`${hr}:30`}>{hr}:30</option>
                                </React.Fragment>
                              );
                            })}
                            <option value="24:00">24:00</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Step 1 Live Pricing & Scope Preview */}
                    {selectedDates.length > 0 && selectedRoomIds.length > 0 && (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div className="space-y-1">
                          <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                            <span>{selectedRoomIds.length} ოთახი</span>
                            <span className="text-slate-300">•</span>
                            <span>{selectedDates.length} დღე</span>
                            {groupDatesByMonth(selectedDates).length > 1 && (
                              <span className="px-2 py-0.5 rounded-md bg-brand-50 text-brand-700 font-mono text-[10px] font-bold border border-brand-200">
                                {groupDatesByMonth(selectedDates).length} თვის მასშტაბით
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 font-sans">
                            {isFullDay ? 'სრული დღით დაჯავშნა (დღიური ტარიფი)' : `საათობრივი რეჟიმი: ${calculatedHours} საათი/დღეში`}
                          </div>
                        </div>

                        <div className="text-left sm:text-right">
                          <span className="block text-[10px] font-bold uppercase text-slate-400">წინასწარი ღირებულება</span>
                          <span className="font-display font-black text-xl text-slate-900 font-mono">
                            ₾{currentTotalPrice}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Proceed/Next button to Questionnaire */}
                    <div className="pt-4 border-t border-slate-100 flex justify-end">
                      <button
                        id="continue-to-q-btn"
                        type="button"
                        onClick={handleContinueToQuestionnaire}
                        className="w-full sm:w-auto px-6 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black text-center transition-colors shadow-sm cursor-pointer uppercase tracking-wider flex items-center justify-center gap-2"
                      >
                        <span>გაგრძელება-კითხვარი</span>
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>

                  </div>
                ) : (
                  /* STEP 2: Questionnaire & Contact details input screens */
                  <div className="space-y-6 animate-fadeIn">
                    
                    {/* Back button to Step 1 */}
                    <div className="flex justify-between items-center">
                      <button
                        type="button"
                        onClick={() => {
                          setBookingStep(1);
                          setErrorMessage('');
                        }}
                        className="inline-flex items-center space-x-1 hover:text-slate-900 text-slate-500 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        <span>← უკან დაბრუნება</span>
                      </button>
                      <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">
                        ნაბიჯი 2/2
                      </span>
                    </div>

                    {/* Organizer Info with Renamed Placeholders */}
                    <div className="border-t border-slate-150 pt-4 space-y-4">
                      <span className="block font-display font-extrabold text-slate-900 text-sm mb-1.5 flex items-center gap-1.5">
                        <User2 className="h-4 w-4 text-slate-700" />
                        <span>კონტაქტი & ორგანიზატორი</span>
                      </span>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1.5 flex items-center">
                            სახელი *
                          </label>
                          <input
                            id="form-first-name"
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder="გიორგი"
                            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-hidden font-sans"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1.5 flex items-center">
                            გვარი *
                          </label>
                          <input
                            id="form-last-name"
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder="გიორგაძე"
                            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-hidden font-sans"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1.5 flex items-center">
                            <Building2 className="h-3.5 w-3.5 mr-1 text-slate-400" /> ორგანიზაცია (არსებობის შემთხვევაში)
                          </label>
                          <input
                            id="form-organization"
                            type="text"
                            value={organization}
                            onChange={(e) => {
                              const val = e.target.value;
                              setOrganization(val);
                              const valLower = val.toLowerCase();
                              if (
                                valLower.includes('სკოლა') || 
                                valLower.includes('საჯარო') || 
                                valLower.includes('გიმნაზია') || 
                                valLower.includes('აკადემია') || 
                                valLower.includes('საგანმანათლებლო') ||
                                valLower.includes('სასწავლებელი') ||
                                valLower.includes('school') ||
                                valLower.includes('college')
                              ) {
                                setIsEducationalSchool(true);
                              }
                            }}
                            placeholder="მაგ: ფოთის #1 საჯარო სკოლა"
                            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-hidden font-sans"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1.5">
                            მობილურის ნომერი *
                          </label>
                          <input
                            id="form-phone"
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+995 599 000 000"
                            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-hidden font-sans"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">
                          ელ-ფოსტა (ჯავშნის დასტურისა და ინვოისისთვის) *
                        </label>
                        <input
                          id="form-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="giorgi@domain.ge"
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-hidden font-sans"
                          required
                        />
                      </div>
                    </div>

                    {/* Custom questions injection CMS mapping */}
                    {customQuestions.length > 0 && (
                      <div className="border-t border-slate-250 pt-5 space-y-4">
                        <span className="block font-display font-extrabold text-slate-900 text-sm mb-1.5 flex items-center gap-1.5">
                          <MessageSquare className="h-4 w-4 text-slate-700" />
                          <span>დამატებითი კითხვები ჰაბისთვის</span>
                        </span>

                        <div className="space-y-4">
                          {customQuestions.map((q) => (
                            <div key={q.id}>
                              <label className="block text-xs font-bold text-slate-500 mb-1.5">
                                {q.label} {q.required && '*'}
                              </label>
                              
                              {q.type === 'textarea' ? (
                                <textarea
                                  id={`form-custom-q-${q.id}`}
                                  value={customAnswers[q.label] || ''}
                                  onChange={(e) => handleCustomAnswerChange(q.label, e.target.value)}
                                  placeholder={q.placeholder}
                                  rows={3}
                                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-hidden font-sans"
                                  required={q.required}
                                />
                              ) : q.type === 'select' ? (
                                <select
                                  id={`form-custom-q-${q.id}`}
                                  value={customAnswers[q.label] || ''}
                                  onChange={(e) => handleCustomAnswerChange(q.label, e.target.value)}
                                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-hidden font-sans cursor-pointer"
                                  required={q.required}
                                >
                                  <option value="">{q.placeholder}</option>
                                  {q.options?.map((opt, oIndex) => (
                                    <option key={oIndex} value={opt}>{opt}</option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  id={`form-custom-q-${q.id}`}
                                  type="text"
                                  value={customAnswers[q.label] || ''}
                                  onChange={(e) => handleCustomAnswerChange(q.label, e.target.value)}
                                  placeholder={q.placeholder}
                                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-hidden font-sans"
                                  required={q.required}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Real-time bookings overlaps conflict banner */}
                    {bookingConflict && (
                      <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-750 flex items-start space-x-2.5 text-xs sm:text-sm animate-fadeIn">
                        <AlertTriangle className="h-5 w-5 shrink-0 text-rose-500" />
                        <div>
                          <span className="font-bold block text-rose-800">შერჩეული საათები დაკავებულია!</span>
                          <span className="font-sans text-slate-600 block mt-0.5 leading-relaxed">
                            დროის შუალედი ({startTime} - {endTime}) ნაწილობრივ ან სრულად ემთხვევა არსებულ ჯავშანს: <strong className="font-mono text-rose-700">{bookingConflict.durationHours}</strong>. გთხოვთ მიუთითოთ სხვა საათები.
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Educational organization registered in Poti toggle */}
                    <div className="w-full flex items-start space-x-3.5 bg-emerald-50 border border-emerald-250 p-4 rounded-2xl animate-fadeIn">
                      <input
                        id="form-is-school"
                        type="checkbox"
                        checked={isEducationalSchool}
                        onChange={(e) => setIsEducationalSchool(e.target.checked)}
                        className="mt-1 h-4.5 w-4.5 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer"
                      />
                      <div className="flex-1">
                        <label htmlFor="form-is-school" className="text-xs font-sans text-slate-600 leading-relaxed cursor-pointer select-none">
                          <span className="font-extrabold text-slate-900 text-sm flex items-center mb-1">
                            <GraduationCap className="h-4.5 w-4.5 mr-1.5 text-emerald-600 shrink-0" />
                            {bookingSettings?.schoolWaiverLabel ?? 'საგანმანათლებლო ორგანიზაცია ფოთიდან (უფასო)'}
                          </span>
                          {bookingSettings?.schoolWaiverText ?? 'ფოთში რეგისტრირებული სკოლებისთვის და საგანმანათლებლო დაწესებულებებისთვის სივრცეების დაჯავშნა სრულიად უფასოა!'}
                        </label>
                      </div>
                    </div>

                    {/* Subtotal, discounts presentation, and price totals */}
                    <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-3.5 shadow-xs">
                      <span className="block text-[10px] uppercase font-black text-slate-450 tracking-wider">ღირებულების ანგარიში</span>
                      
                      <div className="space-y-1.5 text-xs sm:text-sm text-slate-600 border-b border-slate-100 pb-3">
                        <div className="flex justify-between font-sans">
                          <span>{isFullDay ? 'ჯამური დღიური საფასური:' : 'საწყისი საფასური:'}</span>
                          <span className="font-bold text-slate-800 font-mono">₾{priceBreakdown.basePrice}</span>
                        </div>

                        {/* Room count multiplier info */}
                        <div className="flex justify-between text-[11px] font-sans text-slate-450">
                          <span>დეტალები:</span>
                          {isFullDay ? (
                            <span>{selectedRoomIds.length} ოთახი x {priceBreakdown.daysCount} დღე (დღიური ტარიფი)</span>
                          ) : (
                            <span>{selectedRoomIds.length} ოთახი x {calculatedHours} სთ x {priceBreakdown.daysCount} დღე</span>
                          )}
                        </div>

                        {isEducationalSchool && (
                          <div className="flex justify-between text-xs text-emerald-600 font-sans font-black bg-emerald-50 px-2.5 py-1.5 rounded-lg mt-2 border border-emerald-150 flex-wrap gap-1">
                            <span>საგანმანათლებლო შეღავათი (ფოთის სკოლა):</span>
                            <span>-₾{priceBreakdown.basePrice}.00 (100% უფასო)</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                          <span className="block text-[10px] uppercase font-bold text-amber-600 tracking-wider">საერთო გადასახდელი</span>
                          <span className="font-display font-black text-2xl text-slate-900 font-mono">
                            ₾{currentTotalPrice}
                          </span>
                        </div>
                        
                        <button
                          id="submit-booking-btn"
                          type="submit"
                          className="w-full sm:w-auto px-6 py-3.5 bg-slate-900 hover:bg-slate-850 text-white rounded-xl text-xs font-black text-center transition-colors shadow-xs cursor-pointer uppercase letter tracking-wider leading-none"
                        >
                          ჯავშნის მოთხოვნა ➜
                        </button>
                      </div>
                    </div>

                  </div>
                )}

                {/* Error Banner alerts */}
                {errorMessage && (
                  <div id="booking-error-alert" className="p-4 bg-rose-50 border border-rose-300 rounded-2xl text-rose-600 flex items-start space-x-2 text-sm animate-fadeIn">
                    <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                    <span className="font-sans font-semibold">{errorMessage}</span>
                  </div>
                )}

              </form>
            )}
          </div>
        </div>

      </div>

      {/* SUCCESS CONFIRMATION MODAL POPUP (OVERLAY BACKDROP-BLUR) */}
      {isSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-150 p-8 sm:p-10 shadow-2xl relative text-center">
            
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xs">
              <CheckCircle className="h-10 w-10 animate-pulse" />
            </div>

            <h3 className="font-display font-extrabold text-2xl text-slate-900">
              ჯავშანი წარმატებით გაიგზავნა!
            </h3>

            <p className="mt-4 text-slate-600 text-sm font-sans leading-relaxed">
              მადლობა, თქვენი მოთხოვნა მიღებულია. ჰაბის ადმინისტრატორი განიხილავს ჯავშანს და თანხმობის შემთხვევაში მითითებულ ელ-ფოსტაზე გაგიზიარებთ <span className="font-bold text-slate-800">ინვოისს</span>, ხოლო უარყოფის შემთხვევაში შესაბამის შეტყობინებას.
            </p>

            <div className="mt-8 pt-6 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsSuccess(false)}
                className="w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold shadow-xs cursor-pointer transition-colors"
              >
                დახურვა & ახალი დაჯავშნა
              </button>
            </div>

          </div>
        </div>
      )}

      {/* IMMERSIVE ROOM DETAILS & IMAGES GALLERY PLAYGROUND MODAL OVERLAY */}
      {infoRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[95vh] overflow-y-auto border border-slate-150 shadow-2xl relative">
            
            {/* Modal Header */}
            <div className="p-6 pb-0 flex justify-between items-start">
              <div>
                <h3 className="font-display font-black text-xl text-slate-900">{infoRoom.name}</h3>
                <div className="flex gap-1.5 mt-1 text-slate-800 text-xs font-black font-mono">
                  <span className="bg-slate-100 px-2.5 py-1 rounded-lg">
                    ₾{infoRoom.price}/სთ
                  </span>
                  <span className="bg-brand-50 text-brand-700 px-2.5 py-1 rounded-lg border border-brand-100">
                    ₾{infoRoom.dayPrice || Math.round(infoRoom.price * 8)}/დღე
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInfoRoom(null)}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Tabs: Photos, 360°, YouTube Video */}
            <div className="px-6 mt-4 border-b border-slate-100 flex gap-1 sm:gap-2">
              <button
                type="button"
                onClick={() => setInfoActiveTab('photos')}
                className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition-all px-2.5 cursor-pointer flex items-center gap-1.5 ${
                  infoActiveTab === 'photos'
                    ? 'border-brand-600 text-brand-700 font-extrabold'
                    : 'border-transparent text-slate-450 hover:text-slate-600'
                }`}
              >
                <span>ფოტოები ({infoRoom.imageUrls?.length || 1})</span>
              </button>

              <button
                type="button"
                onClick={() => setInfoActiveTab('panorama')}
                className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition-all px-2.5 cursor-pointer flex items-center gap-1.5 ${
                  infoActiveTab === 'panorama'
                    ? 'border-brand-600 text-brand-700 font-extrabold'
                    : 'border-transparent text-slate-450 hover:text-slate-600'
                }`}
              >
                <Compass className="h-3.5 w-3.5" />
                <span>360° ხედი</span>
              </button>

              <button
                type="button"
                onClick={() => setInfoActiveTab('video')}
                className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition-all px-2.5 cursor-pointer flex items-center gap-1.5 ${
                  infoActiveTab === 'video'
                    ? 'border-brand-600 text-brand-700 font-extrabold'
                    : 'border-transparent text-slate-450 hover:text-slate-600'
                }`}
              >
                <Youtube className="h-3.5 w-3.5" />
                <span>ვიდეო ტური</span>
              </button>
            </div>

            {/* Modal Body depending on selected tab */}
            {infoActiveTab === 'photos' && (
              <RoomGallery images={infoRoom.imageUrls || [infoRoom.imageUrl]} />
            )}

            {infoActiveTab === 'panorama' && (
              <div className="p-6">
                <span className="block text-[10px] uppercase tracking-widest font-black text-slate-400 mb-2 font-mono">360° ვირტუალური ტური (Interactive Panoramas)</span>
                <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 shadow-inner group">
                  <iframe
                    title="360 Panorama Viewer"
                    src={infoRoom.panoramaUrl || `https://cdn.pannellum.org/2.5/pannellum.htm?panorama=https://pannellum.org/images/alma.jpg&autoLoad=true`}
                    className="w-full h-full border-0 absolute inset-0"
                    allowFullScreen
                  />
                  <div className="absolute top-3 left-3 bg-slate-900/85 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-xl backdrop-blur-xs flex items-center gap-1.5 shadow-md select-none pointer-events-none transition-opacity duration-300">
                    <Compass className="h-3.5 w-3.5 text-brand-400 animate-spin-slow" />
                    <span>გამოიყენეთ მაუსი კუთხის შესაცვლელად (Interactive 360°)</span>
                  </div>
                </div>
              </div>
            )}

            {infoActiveTab === 'video' && (
              <div className="p-6">
                <span className="block text-[10px] uppercase tracking-widest font-black text-slate-400 mb-2 font-mono">YouTube საინფორმაციო/სადემონსტრაციო რგოლი</span>
                <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 shadow-inner">
                  <iframe
                    title="Room Video Tour"
                    src={infoRoom.videoUrl || `https://www.youtube.com/embed/dQw4w9WgXcQ`}
                    className="w-full h-full border-0 absolute inset-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            {/* Room Amenities list & metadata */}
            <div className="px-6 pb-6 space-y-4">
              <div>
                <span className="block text-[10px] uppercase tracking-widest font-black text-slate-400 mb-1 font-mono">აღწერა</span>
                <p className="text-xs sm:text-sm font-sans text-slate-600 leading-relaxed font-light">{infoRoom.description}</p>
              </div>

              <div>
                <span className="block text-[10px] uppercase tracking-widest font-black text-slate-400 mb-2 font-mono">ოთახის რესურსები & აღჭურვილობა</span>
                <div className="flex flex-wrap gap-2">
                  {infoRoom.features.map((feat, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-slate-50 border border-slate-150 rounded-xl text-xs font-semibold text-slate-705 flex items-center"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mr-2 shrink-0"></span>
                      {feat}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action selection state inside modal */}
              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    const id = infoRoom.id;
                    if (!selectedRoomIds.includes(id)) {
                      setSelectedRoomIds(prev => [...prev, id]);
                    } else {
                      setSelectedRoomIds(prev => prev.filter(item => item !== id));
                    }
                    setInfoRoom(null);
                  }}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
                    selectedRoomIds.includes(infoRoom.id)
                      ? 'bg-rose-600 hover:bg-rose-700 text-white'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  {selectedRoomIds.includes(infoRoom.id) ? (
                    <>
                      <X className="h-4 w-4" />
                      <span>მონიშვნის მოხსნა</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      <span>ოთახის მონიშვნა (Select)</span>
                    </>
                  )}
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </section>
  );
}

// Custom Room Gallery interactive thumbnails view
const RoomGallery = ({ images }: { images: string[] }) => {
  const [activeImg, setActiveImg] = useState(images[0]);
  return (
    <div className="p-6 space-y-3">
      <div className="w-full h-64 sm:h-80 bg-slate-50 border border-slate-150 rounded-2xl overflow-hidden relative shadow-2xs">
        <img
          src={activeImg}
          alt="Active Room display"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transition-all"
        />
      </div>
      {images.length > 1 && (
        <div className="grid grid-cols-3 gap-2 pb-1">
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              onMouseEnter={() => setActiveImg(img)}
              onClick={() => setActiveImg(img)}
              className={`h-12 border rounded-xl overflow-hidden transition-all cursor-pointer ${
                activeImg === img ? 'ring-2 ring-slate-900 border-none scale-98' : 'border-slate-150 hover:border-slate-300 opacity-80 hover:opacity-100'
              }`}
            >
              <img
                src={img}
                alt="thumbnail representation"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
