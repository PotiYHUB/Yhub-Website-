/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Room, Booking } from '../types';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  MapPin, Clock, Users, User, Check, X, FileText, Search, Filter
} from 'lucide-react';

interface AdminCalendarProps {
  rooms: Room[];
  bookings: Booking[];
  onApprove: (booking: Booking) => void;
  onRejectTrigger: (id: string) => void;
  onViewInvoice: (booking: Booking) => void;
  rejectingBookingId: string | null;
  rejectionReason: string;
  setRejectionReason: (reason: string) => void;
  onConfirmReject: (booking: Booking) => void;
  onCancelReject: () => void;
}

const MONTHS_GE = [
  'იანვარი', 'თებერვალი', 'მარტი', 'აპრილი', 'მაისი', 'ივნისი',
  'ივლისი', 'აგვისტო', 'სექტემბერი', 'ოქტომბერი', 'ნოემბერი', 'დეკემბერი'
];

const WEEKDAYS_GE = ['ორშ', 'სამ', 'ოთხ', 'ხუთ', 'პარ', 'შაბ', 'კვირ'];

export default function AdminCalendar({
  rooms,
  bookings,
  onApprove,
  onRejectTrigger,
  onViewInvoice,
  rejectingBookingId,
  rejectionReason,
  setRejectionReason,
  onConfirmReject,
  onCancelReject
}: AdminCalendarProps) {
  // Current calendar view date pointer
  const today = useMemo(() => new Date(), []);
  const [viewDate, setViewDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });

  // Filters
  const [selectedRoomId, setSelectedRoomId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth(); // 0-indexed

  // Navigate months
  const handlePrevMonth = () => {
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleGoToToday = () => {
    setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    setSelectedDateStr(`${y}-${m}-${d}`);
  };

  // Calendar Math
  const daysInMonth = useMemo(() => {
    return new Date(currentYear, currentMonth + 1, 0).getDate();
  }, [currentYear, currentMonth]);

  const firstDayIndex = useMemo(() => {
    // getDay() is 0 for Sun, 1 for Mon, etc.
    const day = new Date(currentYear, currentMonth, 1).getDay();
    // Translate so 0 is Monday, 6 is Sunday
    return day === 0 ? 6 : day - 1;
  }, [currentYear, currentMonth]);

  const prevMonthDays = useMemo(() => {
    return new Date(currentYear, currentMonth, 0).getDate();
  }, [currentYear, currentMonth]);

  // Calendar days grid mapping
  const calendarCells = useMemo(() => {
    const cells: Array<{
      day: number;
      dateStr: string;
      isCurrentMonth: boolean;
    }> = [];

    // Previous month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const prevDay = prevMonthDays - i;
      const prevDate = new Date(currentYear, currentMonth - 1, prevDay);
      const y = prevDate.getFullYear();
      const m = String(prevDate.getMonth() + 1).padStart(2, '0');
      const d = String(prevDate.getDate()).padStart(2, '0');
      cells.push({
        day: prevDay,
        dateStr: `${y}-${m}-${d}`,
        isCurrentMonth: false
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const mStr = String(currentMonth + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      cells.push({
        day: d,
        dateStr: `${currentYear}-${mStr}-${dStr}`,
        isCurrentMonth: true
      });
    }

    // Next month padding (up to 42 cells total)
    const totalSlots = 42;
    const nextDaysNeeded = totalSlots - cells.length;
    for (let d = 1; d <= nextDaysNeeded; d++) {
      const nextDate = new Date(currentYear, currentMonth + 1, d);
      const y = nextDate.getFullYear();
      const m = String(nextDate.getMonth() + 1).padStart(2, '0');
      const dStr = String(nextDate.getDate()).padStart(2, '0');
      cells.push({
        day: d,
        dateStr: `${y}-${m}-${dStr}`,
        isCurrentMonth: false
      });
    }

    return cells;
  }, [currentYear, currentMonth, daysInMonth, firstDayIndex, prevMonthDays]);

  // Aggregate and filter bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      // Room match
      const bookingRoomIds = b.roomId.split(',').map(id => id.trim());
      const roomMatch = selectedRoomId === 'all' || bookingRoomIds.includes(selectedRoomId);
      // Status match
      const statusMatch = selectedStatus === 'all' || b.status === selectedStatus;
      // Search match
      const text = `${b.firstName} ${b.lastName} ${b.roomName} ${b.organization || ''} ${b.email} ${b.phone}`.toLowerCase();
      const searchMatch = !searchQuery.trim() || text.includes(searchQuery.toLowerCase());

      return roomMatch && statusMatch && searchMatch;
    });
  }, [bookings, selectedRoomId, selectedStatus, searchQuery]);

  // Map of date strings to bookings for instant lookup (splitting multi-day strings safely)
  const bookingsMap = useMemo(() => {
    const map: Record<string, Booking[]> = {};
    filteredBookings.forEach(b => {
      const dates = b.date.split(',').map(d => d.trim());
      dates.forEach(dateKey => {
        if (!map[dateKey]) {
          map[dateKey] = [];
        }
        map[dateKey].push(b);
      });
    });
    return map;
  }, [filteredBookings]);

  // Get currently selected date's bookings
  const selectedDayBookings = useMemo(() => {
    return bookingsMap[selectedDateStr] || [];
  }, [bookingsMap, selectedDateStr]);

  // Helper colors for status
  const getStatusBadgeStyles = (status: Booking['status']) => {
    switch (status) {
      case 'approved':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'rejected':
        return 'bg-rose-50 text-rose-700 border border-rose-200';
      default:
        return 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse';
    }
  };

  const getStatusDotColor = (status: Booking['status']) => {
    switch (status) {
      case 'approved':
        return 'bg-emerald-500';
      case 'rejected':
        return 'bg-rose-500';
      default:
        return 'bg-amber-500';
    }
  };

  return (
    <div className="bg-white border border-slate-200/60 rounded-3xl p-6 sm:p-8 shadow-sm">
      
      {/* Calendar Header with Title and Filtering Inputs */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center border-b border-slate-100 pb-6 mb-6 gap-4">
        <div>
          <h2 className="font-display font-black text-xl text-slate-900 flex items-center space-x-2">
            <CalendarIcon className="h-5 w-5 text-brand-600" />
            <span>რეზერვაციების კალენდარი</span>
          </h2>
          <p className="text-slate-500 text-xs font-sans mt-1">დაათვალიერეთ და მართეთ ჯავშნები ორგანიზებული კალენდარული ინტერფეისით.</p>
        </div>

        {/* Live Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto items-stretch sm:items-center">
          
          {/* Search box */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ძებნა (სახელი, ოთახი...)"
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-sans focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Rooms dropdown */}
          <div className="relative">
            <select
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-sans focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all appearance-none cursor-pointer"
            >
              <option value="all">ყველა დარბაზი</option>
              {rooms.map(room => (
                <option key={room.id} value={room.id}>{room.name}</option>
              ))}
            </select>
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
          </div>

          {/* Status filter dropdown */}
          <div className="relative">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-sans focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all appearance-none cursor-pointer"
            >
              <option value="all">ყველა სტატუსი</option>
              <option value="pending">მომლოდინე</option>
              <option value="approved">დადასტურებული</option>
              <option value="rejected">უარყოფილი</option>
            </select>
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
          </div>

        </div>
      </div>

      {/* Main Grid: Left is month switcher and grid. Right is side panel details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Calendar Monthly Matrix Grid (8 Columns on Large View) */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Next/Prev Selection Controls */}
          <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="flex items-center space-x-1.5">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-700 transition-colors cursor-pointer"
                title="წინა თვე"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              
              <h3 className="font-display font-extrabold text-slate-900 text-sm tracking-wide min-w-[120px] text-center">
                {MONTHS_GE[currentMonth]} {currentYear}
              </h3>

              <button
                onClick={handleNextMonth}
                className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-700 transition-colors cursor-pointer"
                title="შემდეგი თვე"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <button
              onClick={handleGoToToday}
              className="px-4 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 transition-colors rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 shadow-3xs cursor-pointer"
            >
              დღეს
            </button>
          </div>

          {/* Weekday matrix labels */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-[10px] font-black uppercase tracking-wider text-slate-450 mt-1">
            {WEEKDAYS_GE.map(dayLabel => (
              <div key={dayLabel} className="py-2">{dayLabel}</div>
            ))}
          </div>

          {/* Day Slots Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {calendarCells.map(({ day, dateStr, isCurrentMonth }) => {
              const dayBookings = bookingsMap[dateStr] || [];
              const isSelected = selectedDateStr === dateStr;
              
              const dateObj = new Date(dateStr);
              const isToday = 
                today.getFullYear() === dateObj.getFullYear() &&
                today.getMonth() === dateObj.getMonth() &&
                today.getDate() === dateObj.getDate();

              return (
                <div
                  key={dateStr}
                  onClick={() => setSelectedDateStr(dateStr)}
                  className={`min-h-[75px] sm:min-h-[100px] p-1 sm:p-2 border rounded-2xl transition-all cursor-pointer flex flex-col justify-between group ${
                    isCurrentMonth 
                      ? 'bg-white border-slate-200/80 hover:border-slate-350' 
                      : 'bg-slate-50/50 text-slate-400 border-slate-100 hover:border-slate-200'
                  } ${
                    isSelected 
                      ? 'ring-2 ring-brand-500 border-brand-500 shadow-xs' 
                      : ''
                  } ${
                    isToday 
                      ? 'bg-gradient-to-br from-brand-50/30 to-transparent border-brand-300' 
                      : ''
                  }`}
                >
                  {/* Day marker indicator */}
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-[10px] sm:text-xs font-mono font-bold h-6 w-6 rounded-full flex items-center justify-center ${
                      isToday 
                        ? 'bg-brand-600 text-white shadow-xs' 
                        : isSelected 
                          ? 'bg-slate-900 text-white' 
                          : 'text-slate-700'
                    }`}>
                      {day}
                    </span>

                    {/* Booking count dot */}
                    {dayBookings.length > 0 && (
                      <span className="flex h-2 w-2 relative">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                          dayBookings.some(b => b.status === 'pending') ? 'bg-amber-400' : 'bg-emerald-400'
                        }`}></span>
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${
                          dayBookings.some(b => b.status === 'pending') ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}></span>
                      </span>
                    )}
                  </div>

                  {/* Micro-list of bookings inside cell (Visible on larger viewport screens) */}
                  <div className="space-y-1 hidden sm:block overflow-hidden flex-1 mt-1 font-sans">
                    {dayBookings.slice(0, 2).map(b => (
                      <div
                        key={b.id}
                        className={`text-[9px] font-semibold px-1 rounded-sm truncate transition-opacity hover:opacity-80 ${
                          b.status === 'approved' 
                            ? 'bg-emerald-50 text-emerald-800 border-s-[2px] border-emerald-500' 
                            : b.status === 'rejected'
                              ? 'bg-rose-50 text-rose-800 border-s-[2px] border-rose-500'
                              : 'bg-amber-50 text-amber-800 border-s-[2px] border-amber-500'
                        }`}
                        title={`${b.roomName} - ${b.firstName} ${b.lastName} (${b.durationHours})`}
                      >
                        {b.durationHours.split(' ')[0]} {b.roomName}
                      </div>
                    ))}
                    {dayBookings.length > 2 && (
                      <div className="text-[8px] font-bold text-slate-400 text-right pr-1">
                        +{dayBookings.length - 2} ჯავშანი
                      </div>
                    )}
                  </div>
                  
                  {/* Mini bubble counter for Mobile visualizers */}
                  <div className="sm:hidden flex justify-center mt-1">
                    {dayBookings.length > 0 && (
                      <span className="text-[9px] font-black bg-slate-100 border border-slate-200 text-slate-700 px-1 rounded-md min-w-[16px] text-center">
                        {dayBookings.length}
                      </span>
                    )}
                  </div>

                </div>
              );
            })}
          </div>

        </div>

        {/* Selected Day Timeline View panel (4 Columns) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Panel title element header */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-xs">
            <span className="text-[10px] text-brand-350 font-bold uppercase tracking-widest block">არჩეული დღე</span>
            <span className="text-sm font-display font-extrabold block mt-0.5">
              {selectedDateStr.split('-')[2]} {MONTHS_GE[parseInt(selectedDateStr.split('-')[1]) - 1]} {selectedDateStr.split('-')[0]}
            </span>
          </div>

          {/* Timeline details container */}
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {selectedDayBookings.length === 0 ? (
              <div className="text-center py-16 px-4 bg-slate-50 border border-slate-150 border-dashed rounded-2xl text-slate-400">
                <CalendarIcon className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-sans">მონიშნულ დღეს ჯავშნები არ ფიქსირდება.</p>
              </div>
            ) : (
              selectedDayBookings.map(b => (
                <div
                  key={b.id}
                  id={`calendar-booking-detail-${b.id}`}
                  className="bg-slate-50 border border-slate-150 p-4 rounded-2xl space-y-3 shadow-3xs hover:border-slate-300 transition-all"
                >
                  {/* Header Row */}
                  <div className="flex justify-between items-start gap-2 border-b border-slate-150/60 pb-2">
                    <div className="truncate">
                      <span className="block text-[10px] text-slate-400 font-mono">RSV-{b.id}</span>
                      <span className="font-display font-bold text-slate-900 text-xs sm:text-sm truncate block" title={b.roomName}>
                        {b.roomName}
                      </span>
                    </div>

                    <span className={`inline-flex px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${getStatusBadgeStyles(b.status)}`}>
                      {b.status === 'pending' ? 'მომლოდინე' : b.status === 'approved' ? 'დადასტურ.' : 'უარყოფ.'}
                    </span>
                  </div>

                  {/* Customer detail section */}
                  <div className="space-y-1.5 text-xs text-slate-600 font-sans">
                    <div className="flex items-center space-x-2 text-slate-800">
                      <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="font-bold">{b.firstName} {b.lastName}</span>
                    </div>

                    {b.organization && (
                      <p className="text-[11px] italic text-slate-500 pl-5">ორგ: "{b.organization}"</p>
                    )}

                    <div className="flex items-center space-x-2 pl-5 font-mono text-[11px]">
                      <Clock className="h-3.5 w-3.5 text-slate-450 shrink-0" />
                      <span>{b.durationHours}</span>
                    </div>

                    <div className="flex items-center space-x-2 pl-5 text-[11px]">
                      <Users className="h-3.5 w-3.5 text-slate-450 shrink-0" />
                      <span>ტევადობა: {b.numPeople} კაცი</span>
                    </div>

                    <div className="flex items-center space-x-2 pl-5 text-[11px]">
                      <span className="font-semibold text-slate-450">ღირებულება:</span>
                      <span className="font-bold text-slate-900 text-xs font-mono">₾{b.totalPrice}.00</span>
                    </div>
                  </div>

                  {/* Questionnaire answers within panel if any */}
                  {Object.keys(b.answers).length > 0 && (
                    <div className="bg-white p-2.5 rounded-xl border border-slate-150 text-[10px] space-y-1">
                      <span className="block font-black text-slate-500 uppercase tracking-wide">კითხვარი:</span>
                      {Object.entries(b.answers).map(([label, val]) => (
                        <div key={label} className="truncate">
                          <span className="font-bold text-slate-600">{label}:</span> <span className="text-slate-800">{val}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Direct Administrative Actions available right inside calendar column! */}
                  <div className="flex flex-wrap items-center justify-end gap-1.5 pt-2 border-t border-slate-150/60">
                    {b.status === 'pending' && (
                      <>
                        <button
                          onClick={() => onApprove(b)}
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black flex items-center space-x-1 cursor-pointer transition-colors"
                          title="დადასტურება"
                        >
                          <Check className="h-3 w-3" />
                          <span>დადასტურება</span>
                        </button>
                        
                        <button
                          onClick={() => onRejectTrigger(b.id)}
                          className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-black flex items-center space-x-1 cursor-pointer transition-colors"
                          title="უარყოფა"
                        >
                          <X className="h-3 w-3" />
                          <span>უარყოფა</span>
                        </button>
                      </>
                    )}

                    {b.status === 'approved' && (
                      <button
                        onClick={() => onViewInvoice(b)}
                        className="px-2.5 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-155 rounded-lg text-[10px] font-bold flex items-center space-x-1 cursor-pointer transition-colors"
                        title="ინვოისის ჩვენება"
                      >
                        <FileText className="h-3 w-3" />
                        <span>ინვოისი ({b.invoiceNumber})</span>
                      </button>
                    )}

                    {b.status === 'rejected' && b.adminNotes && (
                      <p className="text-[10px] text-rose-600 italic bg-rose-50 px-2 py-1 rounded-md border border-rose-100 w-full truncate" title={b.adminNotes}>
                        მიზეზი: "{b.adminNotes}"
                      </p>
                    )}
                  </div>

                  {/* Reject popover inside timeline cell */}
                  {rejectingBookingId === b.id && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2 mt-2">
                      <label className="block text-[10px] font-bold text-rose-900 leading-tight">
                        უარყოფის მიზეზი:
                      </label>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="მაგ: მონიშნულ დროს სხვა ღონისძიებაა..."
                        rows={2}
                        className="w-full p-1.5 bg-white border border-rose-300 rounded-lg text-[10px] font-sans focus:outline-none"
                        required
                      />
                      <div className="flex justify-end space-x-1.5">
                        <button
                          onClick={onCancelReject}
                          className="px-2 py-1 bg-white text-slate-650 border border-slate-250 rounded-md text-[9px] font-semibold cursor-pointer"
                        >
                          გაუქმება
                        </button>
                        <button
                          onClick={() => onConfirmReject(b)}
                          className="px-2 py-1 bg-rose-600 text-white rounded-md text-[9px] font-black cursor-pointer shadow-xs"
                        >
                          უარყოფა
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              ))
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
