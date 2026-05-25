/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Room, Booking, CustomQuestion, HubItem, HubCategory } from '../types';
import AdminCalendar from './AdminCalendar';
import { 
  Check, X, Plus, Trash2, Edit, Calendar, Users, DollarSign, Mail, 
  Clock, ShieldAlert, FileText, LayoutList, ListPlus, Send, MessageSquarePlus, Sparkles, HelpCircle, Settings as SettingsIcon, Percent
} from 'lucide-react';

interface AdminPanelProps {
  rooms: Room[];
  bookings: Booking[];
  customQuestions: CustomQuestion[];
  hubItems: HubItem[];
  bookingSettings: any;
  simulatedEmails: any[];
  onUpdateSettings: (settings: any) => void;
  onAddRoom: (room: Room) => void;
  onUpdateRoom: (room: Room) => void;
  onDeleteRoom: (id: string) => void;
  onApproveBooking: (id: string, invoiceNum: string) => void;
  onRejectBooking: (id: string, reason: string) => void;
  onAddQuestion: (q: CustomQuestion) => void;
  onDeleteQuestion: (id: string) => void;
  onAddHubItem: (item: HubItem) => void;
  onDeleteHubItem: (id: string) => void;
}

export default function AdminPanel({
  rooms,
  bookings,
  customQuestions,
  hubItems,
  bookingSettings,
  simulatedEmails,
  onUpdateSettings,
  onAddRoom,
  onUpdateRoom,
  onDeleteRoom,
  onApproveBooking,
  onRejectBooking,
  onAddQuestion,
  onDeleteQuestion,
  onAddHubItem,
  onDeleteHubItem
}: AdminPanelProps) {
  const [activeAdminTab, setActiveAdminTab] = useState<'bookings' | 'rooms' | 'questions' | 'hub' | 'emails' | 'calendar' | 'settings'>('bookings');
  
  // Filtering states
  const [bookingFilter, setBookingFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  
  // Custom interactive modulations
  const [selectedInvoiceBooking, setSelectedInvoiceBooking] = useState<Booking | null>(null);

  const handlePrintInvoice = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    if (!selectedInvoiceBooking) return;
    const element = document.getElementById("print-invoice-sheet");
    if (!element) return;

    // Build modern file download config
    const opt = {
      margin:       12,
      filename:     `Invoice_${selectedInvoiceBooking.invoiceNumber || 'INV-2026'}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    const runHtml2Pdf = () => {
      // @ts-ignore
      if (window.html2pdf) {
        // @ts-ignore
        window.html2pdf().from(element).set(opt).save();
      }
    };

    if (!(window as any).html2pdf) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.crossOrigin = 'anonymous';
      script.onload = runHtml2Pdf;
      document.head.appendChild(script);
    } else {
      runHtml2Pdf();
    }
  };

  const [rejectingBookingId, setRejectingBookingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // CMS forms states
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [editRoomId, setEditRoomId] = useState<string | null>(null);
  const [roomName, setRoomName] = useState('');
  const [roomDesc, setRoomDesc] = useState('');
  const [roomCap, setRoomCap] = useState(10);
  const [roomPrice, setRoomPrice] = useState(15);
  const [roomDayPrice, setRoomDayPrice] = useState(120);
  const [roomImg, setRoomImg] = useState('');
  const [roomFeatures, setRoomFeatures] = useState('');
  const [roomPanoramaUrl, setRoomPanoramaUrl] = useState('');
  const [roomVideoUrl, setRoomVideoUrl] = useState('');

  // CMS question states
  const [qLabel, setQLabel] = useState('');
  const [qPlaceholder, setQPlaceholder] = useState('');
  const [qRequired, setQRequired] = useState(true);
  const [qType, setQType] = useState<'text' | 'textarea' | 'select'>('text');
  const [qOptions, setQOptions] = useState('');

  // CMS Hub Item form states
  const [showHubForm, setShowHubForm] = useState(false);
  const [hubCat, setHubCat] = useState<HubCategory>('news');
  const [hubTitle, setHubTitle] = useState('');
  const [hubSummary, setHubSummary] = useState('');
  const [hubContent, setHubContent] = useState('');
  const [hubCover, setHubCover] = useState('');
  const [hubDeadline, setHubDeadline] = useState('');
  const [hubLocation, setHubLocation] = useState('');
  const [hubSalary, setHubSalary] = useState('');
  const [hubReqs, setHubReqs] = useState('');

  // Booking statistics
  const pendingCount = bookings.filter(b => b.status === 'pending').length;
  const approvedCount = bookings.filter(b => b.status === 'approved').length;

  // Handle Room submission
  const handleRoomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName || !roomDesc) return;

    const featuresArr = roomFeatures
      ? roomFeatures.split(',').map(f => f.trim()).filter(Boolean)
      : ['WiFi', 'პროექტორი'];

    const fallbackImg = roomImg || 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80';

    if (editRoomId) {
      onUpdateRoom({
        id: editRoomId,
        name: roomName,
        description: roomDesc,
        capacity: Number(roomCap),
        price: Number(roomPrice),
        dayPrice: Number(roomDayPrice),
        imageUrl: fallbackImg,
        features: featuresArr,
        panoramaUrl: roomPanoramaUrl || undefined,
        videoUrl: roomVideoUrl || undefined
      });
      setEditRoomId(null);
    } else {
      onAddRoom({
        id: Date.now().toString(),
        name: roomName,
        description: roomDesc,
        capacity: Number(roomCap),
        price: Number(roomPrice),
        dayPrice: Number(roomDayPrice),
        imageUrl: fallbackImg,
        features: featuresArr,
        panoramaUrl: roomPanoramaUrl || undefined,
        videoUrl: roomVideoUrl || undefined
      });
    }

    // Reset Form
    setRoomName('');
    setRoomDesc('');
    setRoomCap(10);
    setRoomPrice(15);
    setRoomDayPrice(120);
    setRoomImg('');
    setRoomFeatures('');
    setRoomPanoramaUrl('');
    setRoomVideoUrl('');
    setShowRoomForm(false);
  };

  // Edit room loader
  const handleEditRoom = (room: Room) => {
    setEditRoomId(room.id);
    setRoomName(room.name);
    setRoomDesc(room.description);
    setRoomCap(room.capacity);
    setRoomPrice(room.price);
    setRoomDayPrice(room.dayPrice || Math.round(room.price * 8));
    setRoomImg(room.imageUrl);
    setRoomFeatures(room.features.join(', '));
    setRoomPanoramaUrl(room.panoramaUrl || '');
    setRoomVideoUrl(room.videoUrl || '');
    setShowRoomForm(true);
  };

  // Handle Approve booking
  const handleApprove = (booking: Booking) => {
    const invNum = `INV-2026-0${10 + bookings.filter(b => b.status === 'approved').length}`;
    onApproveBooking(booking.id, invNum);
  };

  // Handle Reject setup
  const handleOpenReject = (id: string) => {
    setRejectingBookingId(id);
    setRejectionReason('');
  };

  const handleConfirmReject = (booking: Booking) => {
    if (!rejectionReason.trim()) return;
    onRejectBooking(booking.id, rejectionReason);
    setRejectingBookingId(null);
    setRejectionReason('');
  };

  // Question submitter
  const handleQuestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qLabel) return;

    const optArr = qOptions ? qOptions.split(',').map(o => o.trim()).filter(Boolean) : undefined;

    onAddQuestion({
      id: Date.now().toString(),
      label: qLabel,
      placeholder: qPlaceholder || 'შეიყვანეთ პასუხი',
      required: qRequired,
      type: qType,
      options: optArr
    });

    setQLabel('');
    setQPlaceholder('');
    setQRequired(true);
    setQType('text');
    setQOptions('');
  };

  // Hub Content submitter
  const handleHubSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hubTitle || !hubSummary || !hubContent) return;

    const reqsArr = hubReqs ? hubReqs.split('\n').map(r => r.trim()).filter(Boolean) : undefined;
    const fallbackImage = hubCover || 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80';

    onAddHubItem({
      id: `h${Date.now()}`,
      category: hubCat,
      title: hubTitle,
      summary: hubSummary,
      content: hubContent,
      coverImage: fallbackImage,
      date: new Date().toISOString().split('T')[0],
      deadline: hubDeadline || undefined,
      location: hubLocation || undefined,
      salaryRange: hubSalary || undefined,
      requirements: reqsArr
    });

    setHubTitle('');
    setHubSummary('');
    setHubContent('');
    setHubCover('');
    setHubDeadline('');
    setHubLocation('');
    setHubSalary('');
    setHubReqs('');
    setShowHubForm(false);
  };

  // Booking filter calculation
  const filteredBookings = bookings.filter((b) => {
    if (bookingFilter === 'all') return true;
    return b.status === bookingFilter;
  });

  return (
    <div className="py-12 bg-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Admin Header */}
        <div className="bg-slate-900 rounded-3xl p-6 sm:p-10 text-white mb-8 flex flex-col md:flex-row justify-between items-start md:items-center shadow-md">
          <div className="mb-4 md:mb-0">
            <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold font-mono uppercase tracking-wider">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>სისტემა აქტიურია (ადმინ პანელი)</span>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-display font-black tracking-tight text-white">
              ჰაბის ადმინისტრირება
            </h1>
          </div>
          <div className="flex space-x-3">
            <div className="bg-white/10 px-4 py-2 rounded-xl text-center border border-white/5">
              <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">მომლოდინე</span>
              <span className="font-mono text-xl font-bold font-display text-amber-300">{pendingCount}</span>
            </div>
            <div className="bg-white/10 px-4 py-2 rounded-xl text-center border border-white/5">
              <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">სულ ჯავშნები</span>
              <span className="font-mono text-xl font-bold font-display text-emerald-400">{bookings.length}</span>
            </div>
          </div>
        </div>

        {/* Inner Tab bar and CMS Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Navigation drawer (Left Pane) */}
          <div className="lg:col-span-3 bg-white border border-slate-200/50 rounded-2xl p-4 space-y-1.5 shadow-sm">
            <span className="block text-[10px] uppercase tracking-widest font-black text-slate-400 px-3 mb-3">მენიუ</span>
            
            <button
              onClick={() => setActiveAdminTab('bookings')}
              className={`flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-sm font-semibold text-left transition-colors cursor-pointer ${
                activeAdminTab === 'bookings'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-650 hover:bg-slate-50'
              }`}
            >
              <LayoutList className="h-4.5 w-4.5" />
              <span>ჯავშნების მონიტორინგი</span>
              {pendingCount > 0 && (
                <span className="bg-rose-500 text-white text-[10px] font-black h-5 px-1.5 min-w-5 rounded-full flex items-center justify-center ml-auto">
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveAdminTab('calendar')}
              className={`flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-sm font-semibold text-left transition-colors cursor-pointer ${
                activeAdminTab === 'calendar'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-650 hover:bg-slate-50'
              }`}
            >
              <Calendar className="h-4.5 w-4.5" />
              <span>კალენდარი</span>
            </button>

            <button
              onClick={() => setActiveAdminTab('rooms')}
              className={`flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-sm font-semibold text-left transition-colors cursor-pointer ${
                activeAdminTab === 'rooms'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-650 hover:bg-slate-50'
              }`}
            >
              <Users className="h-4.5 w-4.5" />
              <span>ოთახების მართვა</span>
            </button>

            <button
              onClick={() => setActiveAdminTab('questions')}
              className={`flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-sm font-semibold text-left transition-colors cursor-pointer ${
                activeAdminTab === 'questions'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-650 hover:bg-slate-50'
              }`}
            >
              <ListPlus className="h-4.5 w-4.5" />
              <span>კითხვების დამატება</span>
            </button>

            <button
              onClick={() => setActiveAdminTab('hub')}
              className={`flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-sm font-semibold text-left transition-colors cursor-pointer ${
                activeAdminTab === 'hub'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-650 hover:bg-slate-50'
              }`}
            >
              <Sparkles className="h-4.5 w-4.5" />
              <span>კონტენტის CMS (სიახლეები)</span>
            </button>

            <button
              onClick={() => setActiveAdminTab('emails')}
              className={`flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-sm font-semibold text-left transition-colors cursor-pointer ${
                activeAdminTab === 'emails'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-650 hover:bg-slate-50'
              }`}
            >
              <Mail className="h-4.5 w-4.5" />
              <span>გაგზავნილი მეილები</span>
            </button>

            <button
              onClick={() => setActiveAdminTab('settings')}
              className={`flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-sm font-semibold text-left transition-colors cursor-pointer ${
                activeAdminTab === 'settings'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-650 hover:bg-slate-50'
              }`}
            >
              <SettingsIcon className="h-4.5 w-4.5 text-amber-550" />
              <span>ჰაბის პარამეტრები & ინვოისები</span>
            </button>
          </div>

          {/* Core admin action panels (Right Pane) */}
          <div className="lg:col-span-9 space-y-6">

            {/* TAB: Interactive Reservations Working Calendar */}
            {activeAdminTab === 'calendar' && (
              <AdminCalendar 
                rooms={rooms}
                bookings={bookings}
                onApprove={handleApprove}
                onRejectTrigger={handleOpenReject}
                onViewInvoice={setSelectedInvoiceBooking}
                rejectingBookingId={rejectingBookingId}
                rejectionReason={rejectionReason}
                setRejectionReason={setRejectionReason}
                onConfirmReject={handleConfirmReject}
                onCancelReject={() => setRejectingBookingId(null)}
              />
            )}

            {/* TAB 1: Booking Management LIST */}
            {activeAdminTab === 'bookings' && (
              <div className="bg-white border border-slate-200/60 rounded-3xl p-6 sm:p-8 shadow-sm">
                
                {/* Bookings filter headers */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-5 mb-6 gap-4">
                  <div>
                    <h2 className="font-display font-black text-xl text-slate-900">ოთახების დაჯავშნის რეესტრი</h2>
                    <p className="text-slate-500 text-xs font-sans mt-1">მართეთ და განიხილეთ შემოსული განაცხადები რეალურ დროში.</p>
                  </div>

                  <div className="flex flex-wrap gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                    {(['all', 'pending', 'approved', 'rejected'] as const).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setBookingFilter(filter)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer ${
                          bookingFilter === filter
                            ? 'bg-slate-900 text-white'
                            : 'text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        {filter === 'all' ? 'ყველა' : filter === 'pending' ? 'მომლოდინე' : filter === 'approved' ? 'დადასტურ.' : 'უარყოფ.'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Booking elements list */}
                {filteredBookings.length === 0 ? (
                  <div className="text-center py-20 text-slate-400 font-medium">
                    <HelpCircle className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                    <span>მოცემული ფილტრით ჯავშნები ვერ მოიძებნა.</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredBookings.map((b) => (
                      <div
                        key={b.id}
                        id={`admin-booking-card-${b.id}`}
                        className="p-5 bg-slate-50 border border-slate-150 rounded-2xl space-y-4 shadow-2xs hover:border-slate-300 transition-all"
                      >
                        {/* Status bar */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-150 pb-3 block gap-2">
                          <div>
                            <span className="text-xs text-slate-400 font-mono font-medium block">
                              ID: RSV-{b.id} (შექმნა: {b.createdAt.substring(0, 10)})
                            </span>
                            <span className="font-display font-extrabold text-base text-slate-900">
                              {b.roomName}
                            </span>
                          </div>

                          <div>
                            {b.status === 'pending' ? (
                              <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                                მომლოდინე
                              </span>
                            ) : b.status === 'approved' ? (
                              <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                                დადასტურებული
                              </span>
                            ) : (
                              <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
                                უარყოფილი
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Customer profile particulars */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm">
                          <div>
                            <span className="block text-[10px] text-slate-400 uppercase font-black tracking-wider">ორგანიზატორი</span>
                            <span className="font-semibold text-slate-800">
                              {b.firstName} {b.lastName}
                            </span>
                            {b.organization && (
                              <span className="block text-xs font-medium text-slate-500 italic">
                                "{b.organization}"
                              </span>
                            )}
                          </div>
                          
                          <div>
                            <span className="block text-[10px] text-slate-400 uppercase font-black tracking-wider">თარიღი & დრო</span>
                            <span className="font-medium text-slate-800 flex items-center mt-0.5">
                              <Calendar className="h-3.5 w-3.5 mr-1 text-slate-450" /> {b.date}
                            </span>
                            <span className="font-mono text-xs text-slate-600 flex items-center mt-0.5">
                              <Clock className="h-3.5 w-3.5 mr-1 text-slate-455" /> {b.durationHours}
                            </span>
                          </div>

                          <div>
                            <span className="block text-[10px] text-slate-400 uppercase font-black tracking-wider">კონტაქტი</span>
                            <span className="block font-medium text-slate-800">{b.email}</span>
                            <span className="block font-mono text-xs text-slate-500">{b.phone}</span>
                          </div>
                        </div>

                        {/* Custom Questionnaire Answers */}
                        {Object.keys(b.answers).length > 0 && (
                          <div className="bg-white p-3 rounded-xl border border-slate-150 text-xs space-y-2">
                            <span className="block font-bold text-slate-700 uppercase tracking-wide text-[10px]">კითხვარის პასუხები</span>
                            {Object.entries(b.answers).map(([qLabel, answer]) => (
                              <div key={qLabel} className="border-b border-slate-50 pb-1 last:border-none">
                                <span className="font-semibold text-slate-500">{qLabel}:</span>
                                <span className="block text-slate-700 font-sans mt-0.5 font-medium">{answer}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Booking actions */}
                        <div className="flex flex-wrap lg:justify-between items-center pt-3 border-t border-slate-150 gap-4">
                          <div>
                            <span className="text-[10px] text-slate-450 uppercase font-bold tracking-wider mr-1">გასამრჯელო:</span>
                            <span className="font-display font-black text-slate-900 text-sm">₾{b.totalPrice}.00</span>
                          </div>

                          <div className="flex space-x-2">
                            {b.status === 'pending' && (
                              <>
                                <button
                                  id={`booking-approve-${b.id}`}
                                  onClick={() => handleApprove(b)}
                                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 transition-colors text-white text-xs font-black rounded-xl flex items-center space-x-1 shadow-2xs cursor-pointer"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                  <span>დადასტურება & ინვოისი</span>
                                </button>
                                
                                <button
                                  id={`booking-reject-trigger-${b.id}`}
                                  onClick={() => handleOpenReject(b.id)}
                                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 transition-colors text-white text-xs font-black rounded-xl flex items-center space-x-1 shadow-2xs cursor-pointer"
                                >
                                  <X className="h-3.5 w-3.5" />
                                  <span>უარყოფა</span>
                                </button>
                              </>
                            )}

                            {b.status === 'approved' && (
                              <button
                                id={`booking-view-invoice-${b.id}`}
                                onClick={() => setSelectedInvoiceBooking(b)}
                                className="px-4 py-2 bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 transition-colors text-xs font-bold rounded-xl flex items-center space-x-1 cursor-pointer"
                              >
                                <FileText className="h-3.5 w-3.5" />
                                <span>ინვოისი ({b.invoiceNumber})</span>
                              </button>
                            )}

                            {b.status === 'rejected' && b.adminNotes && (
                              <div className="text-xs italic text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100">
                                უარყოფის მიზეზი: "{b.adminNotes}"
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Sub Rejection text block input */}
                        {rejectingBookingId === b.id && (
                          <div className="p-4 bg-rose-50/50 border border-rose-200 rounded-xl space-y-3 mt-3">
                            <label className="block text-xs font-bold text-rose-900">
                              მიუთითეთ რატომ ეუბნებით უარს ჯავშანზე (მომხმარებელს გაეგზავნება მეილზე):
                            </label>
                            <textarea
                              id="rejection-reason-input"
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                              placeholder="მაგ: მონიშნულ დროს ოთახში სხვა სასწრაფო სახელმწიფო პრეზენტაცია ტარდება. გთხოვთ აირჩიოთ სხვა დრო."
                              rows={2}
                              className="w-full p-2 bg-white border border-rose-300 rounded-xl text-xs font-sans focus:outline-hidden"
                              required
                            />
                            <div className="flex justify-end space-x-2">
                              <button
                                id="rejection-cancel"
                                onClick={() => setRejectingBookingId(null)}
                                className="px-3 py-1.5 bg-white text-slate-600 border border-slate-200 rounded-lg text-xs font-semibold cursor-pointer"
                              >
                                გაუქმება
                              </button>
                              <button
                                id="rejection-confirm-btn"
                                onClick={() => handleConfirmReject(b)}
                                className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                              >
                                უარყოფის გაგზავნა
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: ROOM MANAGEMENT (Add & edit rooms) */}
            {activeAdminTab === 'rooms' && (
              <div className="bg-white border border-slate-200/60 rounded-3xl p-6 sm:p-8 shadow-sm">
                
                <div className="flex justify-between items-center border-b border-slate-100 pb-5 mb-6">
                  <div>
                    <h2 className="font-display font-black text-xl text-slate-900">ოთახების მართვა</h2>
                    <p className="text-slate-500 text-xs font-sans mt-1">დაამატეთ ახალი სივრცეები, განუსაზღვრეთ ტევადობა და საფასური.</p>
                  </div>
                  
                  <button
                    id="admin-add-room-btn"
                    onClick={() => {
                      setEditRoomId(null);
                      setRoomName('');
                      setRoomDesc('');
                      setRoomCap(10);
                      setRoomPrice(15);
                      setRoomImg('');
                      setRoomFeatures('');
                      setShowRoomForm(!showRoomForm);
                    }}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-white text-xs font-bold rounded-xl flex items-center space-x-1 cursor-pointer shadow-xs"
                  >
                    <Plus className="h-4 w-4" />
                    <span>ახალი ოთახის დამატება</span>
                  </button>
                </div>

                {/* New/edit room drawer form */}
                {showRoomForm && (
                  <form id="admin-room-form" onSubmit={handleRoomSubmit} className="p-6 bg-slate-50 border border-slate-150 rounded-2xl mb-8 space-y-4 animate-fadeIn">
                    <h3 className="font-display font-bold text-slate-900 text-sm">
                      {editRoomId ? 'ოთახის რედაქტირება' : 'ახალი ოთახის ინფორმაციის შევსება'}
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">ოთახის დასახელება *</label>
                        <input
                          id="admin-room-name"
                          type="text"
                          value={roomName}
                          onChange={(e) => setRoomName(e.target.value)}
                          placeholder="მაგ: მულტიმედია დარბაზი"
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-sans focus:outline-hidden"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">ფასი საათში (საათობრივი ₾) *</label>
                        <input
                          id="admin-room-price"
                          type="number"
                          value={roomPrice}
                          onChange={(e) => setRoomPrice(Number(e.target.value) || 0)}
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-sans focus:outline-hidden"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">ფასი დღეში (დღიური სრული ფასი ₾) *</label>
                        <input
                          id="admin-room-dayprice"
                          type="number"
                          value={roomDayPrice}
                          onChange={(e) => setRoomDayPrice(Number(e.target.value) || 0)}
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-sans focus:outline-hidden"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">მაქსიმალური ტევადობა (ადამიანი) *</label>
                        <input
                          id="admin-room-capacity"
                          type="number"
                          value={roomCap}
                          onChange={(e) => setRoomCap(Number(e.target.value) || 1)}
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-sans focus:outline-hidden"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">ფოტო ბმული (ImageUrl URL)</label>
                        <input
                          id="admin-room-image"
                          type="url"
                          value={roomImg}
                          onChange={(e) => setRoomImg(e.target.value)}
                          placeholder="https://images.unsplash.com/..."
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-sans focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">360° პანორამული ფოტოს ბმული (Pannellum / HTML)</label>
                        <input
                          id="admin-room-panorama"
                          type="url"
                          value={roomPanoramaUrl}
                          onChange={(e) => setRoomPanoramaUrl(e.target.value)}
                          placeholder="მაგ: https://cdn.pannellum.org/..."
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-sans focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">YouTube ვიდეოს ბმული (Embed / Standard)</label>
                        <input
                          id="admin-room-video"
                          type="url"
                          value={roomVideoUrl}
                          onChange={(e) => setRoomVideoUrl(e.target.value)}
                          placeholder="მაგ: https://www.youtube.com/embed/..."
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-sans focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">ოთახის აღჭურვილობა (მძიმით გამოყოფილი)</label>
                      <input
                        id="admin-room-features"
                        type="text"
                        value={roomFeatures}
                        onChange={(e) => setRoomFeatures(e.target.value)}
                        placeholder="მაგ: პროექტორი, Wi-Fi, ხმის სისტემა, დაფა"
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-sans focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">აღწერილობა *</label>
                      <textarea
                        id="admin-room-desc"
                        value={roomDesc}
                        onChange={(e) => setRoomDesc(e.target.value)}
                        placeholder="აღწერეთ ოთახის მთავარი ფუნქცია"
                        rows={3}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-sans focus:outline-hidden"
                        required
                      />
                    </div>

                    <div className="flex justify-end space-x-2 pt-2">
                      <button
                        id="admin-room-form-cancel"
                        type="button"
                        onClick={() => setShowRoomForm(false)}
                        className="px-4 py-2 bg-white text-slate-605 border border-slate-200 rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        გაუქმება
                      </button>
                      <button
                        id="admin-room-form-submit"
                        type="submit"
                        className="px-5 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                      >
                        {editRoomId ? 'განახლება' : 'ოთახის დამატება'}
                      </button>
                    </div>
                  </form>
                )}

                {/* Rooms CMS Index render table */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {rooms.map((room) => (
                    <div key={room.id} className="bg-slate-50 border border-slate-150 p-5 rounded-2xl flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-display font-bold text-slate-900 text-base">{room.name}</h4>
                          <div className="flex flex-col items-end gap-1">
                            <span className="bg-slate-200 px-2 py-0.5 rounded-lg text-slate-800 text-xs font-bold">
                              ₾{room.price}/სთ
                            </span>
                            <span className="bg-brand-50 px-2 py-0.5 rounded-lg text-brand-700 text-[10px] font-bold border border-brand-100">
                              ₾{room.dayPrice || room.price * 8}/დღე
                            </span>
                          </div>
                        </div>
                        <img
                          src={room.imageUrl}
                          alt={room.name}
                          referrepolicy="no-referrer"
                          className="w-full h-32 object-cover rounded-xl mb-3 bg-slate-100"
                        />
                        <p className="text-slate-500 text-xs line-clamp-3 leading-relaxed mb-3">{room.description}</p>
                        
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {room.features.slice(0, 3).map((feat, i) => (
                            <span key={i} className="text-[10px] font-bold bg-white text-slate-600 px-2 py-0.5 rounded-md border border-slate-150">
                              {feat}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-xs font-medium border-t border-slate-150 pt-3 mt-2">
                        <span className="text-slate-450">ტევადობა: {room.capacity} კაცი</span>
                        <div className="flex space-x-1.5">
                          <button
                            id={`admin-room-edit-${room.id}`}
                            onClick={() => handleEditRoom(room)}
                            className="p-1.5 bg-slate-150 hover:bg-slate-200 text-slate-705 rounded-lg cursor-pointer transition-colors"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            id={`admin-room-delete-${room.id}`}
                            onClick={() => onDeleteRoom(room.id)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg cursor-pointer transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            )}

            {/* TAB 3: CUSTOM QUESTIONS (Checkout forms) */}
            {activeAdminTab === 'questions' && (
              <div className="bg-white border border-slate-200/60 rounded-3xl p-6 sm:p-8 shadow-sm">
                
                <div className="border-b border-slate-100 pb-5 mb-6">
                  <h2 className="font-display font-black text-xl text-slate-900">კითხვების მოდიფიკაცია</h2>
                  <p className="text-slate-500 text-xs font-sans mt-1">დაამატეთ ახალი ვალდებულებების ველები ჯავშნის გაკეთების კითხვარში.</p>
                </div>

                {/* Form to add custom question */}
                <form id="admin-question-form" onSubmit={handleQuestionSubmit} className="p-6 bg-slate-50 border border-slate-150 rounded-2xl mb-8 space-y-4">
                  <h3 className="font-display font-bold text-slate-900 text-sm flex items-center">
                    <MessageSquarePlus className="h-4 w-4 mr-1.5 text-slate-400" />
                    <span>ახალი კითხვის პარამეტრები</span>
                  </h3>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">კითხვის დასახელება (ტექსტი) *</label>
                    <input
                      id="admin-question-label"
                      type="text"
                      value={qLabel}
                      onChange={(e) => setQLabel(e.target.value)}
                      placeholder="მაგ: გჭირდებათ თუ არა ადმინისტრატორის ტექნიკური მხარდაჭერა?"
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-sans focus:outline-hidden"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">ველის ტიპი *</label>
                      <select
                        id="admin-question-type"
                        value={qType}
                        onChange={(e) => setQType(e.target.value as any)}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-sans focus:outline-hidden"
                      >
                        <option value="text">მოკლე ტექსტური პასუხი</option>
                        <option value="textarea">ვრცელი აღწერილობითი პასუხი (პარაგრაფი)</option>
                        <option value="select">ჩამოსაშლელი მენიუ (Dropdown)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Required? (სავალდებულო ველია?)</label>
                      <select
                        id="admin-question-required"
                        value={qRequired ? "true" : "false"}
                        onChange={(e) => setQRequired(e.target.value === "true")}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-sans focus:outline-hidden"
                      >
                        <option value="true">კი, სავალდებულოა</option>
                        <option value="false">არა, ნებაყოფლობითია</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Placeholder (მინიშნება ველში)</label>
                    <input
                      id="admin-question-placeholder"
                      type="text"
                      value={qPlaceholder}
                      onChange={(e) => setQPlaceholder(e.target.value)}
                      placeholder="მაგ: ჩაწერეთ პასუხი..."
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-sans focus:outline-hidden"
                    />
                  </div>

                  {qType === 'select' && (
                    <div className="animate-fadeIn">
                      <label className="block text-xs font-bold text-slate-500 mb-1">ჩამოსაშლელი ვარიანტები (მძიმით გამოყოფილი) *</label>
                      <input
                        id="admin-question-options"
                        type="text"
                        value={qOptions}
                        onChange={(e) => setQOptions(e.target.value)}
                        placeholder="მაგ: კი, მჭირდება, არა, არ მჭირდება, ჯერ არ ვიცი"
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-sans focus:outline-hidden"
                        required
                      />
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <button
                      id="admin-question-submit"
                      type="submit"
                      className="px-5 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                    >
                      კითხვის დამატება
                    </button>
                  </div>
                </form>

                {/* Question index render table */}
                <h4 className="font-display font-extrabold text-sm text-slate-800 mb-3">აქტიური კითხვები</h4>
                <div className="space-y-3">
                  {customQuestions.map((q) => (
                    <div key={q.id} className="p-4 bg-slate-50 border border-slate-150 rounded-xl flex justify-between items-center">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-slate-800 text-sm">{q.label}</span>
                          {q.required && (
                            <span className="bg-rose-50 text-rose-600 border border-rose-100 px-1.5 py-0.5 rounded text-[9px] font-bold">
                              required
                            </span>
                          )}
                        </div>
                        <p className="text-slate-500 text-xs font-mono mt-1">
                          Type: {q.type === 'textarea' ? 'Paragraph Textarea' : q.type === 'select' ? 'Dropdown List' : 'Single Text'} 
                          {q.options && ` | ვარიანტები: [${q.options.join(', ')}]`}
                        </p>
                      </div>
                      
                      <button
                        id={`admin-question-delete-${q.id}`}
                        onClick={() => onDeleteQuestion(q.id)}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg cursor-pointer transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>

              </div>
            )}

            {/* TAB 4: HUB CONTENT CMS (News, events, trainings etc) */}
            {activeAdminTab === 'hub' && (
              <div className="bg-white border border-slate-200/60 rounded-3xl p-6 sm:p-8 shadow-sm">
                
                <div className="flex justify-between items-center border-b border-slate-100 pb-5 mb-6">
                  <div>
                    <h2 className="font-display font-black text-xl text-slate-900">კონტენტის მართვა</h2>
                    <p className="text-slate-500 text-xs font-sans mt-1">მართეთ ბლოგები სიახლეები, ტრენინგები, ვაკანსიები და კონკურსები.</p>
                  </div>

                  <button
                    id="admin-hub-add-btn"
                    onClick={() => setShowHubForm(!showHubForm)}
                    className="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center space-x-1 shadow-xs cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>ახალი პოსტის შექმნა</span>
                  </button>
                </div>

                {/* Hub post drawer form */}
                {showHubForm && (
                  <form id="admin-hub-form" onSubmit={handleHubSubmit} className="p-6 bg-slate-50 border border-slate-150 rounded-2xl mb-8 space-y-4 animate-fadeIn">
                    <h3 className="font-display font-bold text-slate-900 text-sm">ახალი პუბლიკაციის რედაქტირება</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">კატეგორია *</label>
                        <select
                          id="admin-hub-category"
                          value={hubCat}
                          onChange={(e) => setHubCat(e.target.value as HubCategory)}
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-sans focus:outline-hidden cursor-pointer"
                        >
                          <option value="news">სიახლე / ბლოგი</option>
                          <option value="training">ტრენინგები</option>
                          <option value="contest">კონკურსები</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">სათაური *</label>
                        <input
                          id="admin-hub-title"
                          type="text"
                          value={hubTitle}
                          onChange={(e) => setHubTitle(e.target.value)}
                          placeholder="შეიყვანეთ გამორჩეული სათაური..."
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-sans focus:outline-hidden"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">მოკლე აღწერა (Summary) *</label>
                      <input
                        id="admin-hub-summary"
                        type="text"
                        value={hubSummary}
                        onChange={(e) => setHubSummary(e.target.value)}
                        placeholder="აღწერეთ პოსტი 1-2 წინადადებით ბარათისთვის..."
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-sans focus:outline-hidden"
                        required
                      />
                    </div>

                    {/* Specific details inside Hub CMS for specific Categories */}
                    {hubCat !== 'news' && (
                      <div className="p-4 bg-slate-200/50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fadeIn">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">ბოლო ვადა</label>
                          <input
                            id="admin-hub-deadline"
                            type="date"
                            value={hubDeadline}
                            onChange={(e) => setHubDeadline(e.target.value)}
                            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-hidden"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">ჩატარების ადგილი (ტრენინგი/კონკ.)</label>
                          <input
                            id="admin-hub-location"
                            type="text"
                            value={hubLocation}
                            onChange={(e) => setHubLocation(e.target.value)}
                            placeholder="მაგ: მედიალაბი"
                            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-hidden font-sans"
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">გარეკანის სურათის ბმული</label>
                      <input
                        id="admin-hub-cover"
                        type="url"
                        value={hubCover}
                        onChange={(e) => setHubCover(e.target.value)}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-sans focus:outline-hidden"
                      />
                    </div>

                    {hubCat !== 'news' && (
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">
                          პირობები & მოთხოვნები (თითო ხაზზე ჩაწერეთ თითო მოთხოვნა)
                        </label>
                        <textarea
                          id="admin-hub-reqs"
                          value={hubReqs}
                          onChange={(e) => setHubReqs(e.target.value)}
                          placeholder="ასაკი: 15-29 წელი&#10;საბაზისო კომპიუტერული უნარები"
                          rows={2}
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-sans focus:outline-hidden"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">სრული სტატია / აღწერა *</label>
                      <textarea
                        id="admin-hub-content"
                        value={hubContent}
                        onChange={(e) => setHubContent(e.target.value)}
                        placeholder="დაწერეთ პუბლიკაციის სრული ტექსტი..."
                        rows={5}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-sans focus:outline-hidden"
                        required
                      />
                    </div>

                    <div className="flex justify-end space-x-2">
                      <button
                        id="admin-hub-cancel"
                        type="button"
                        onClick={() => setShowHubForm(false)}
                        className="px-4 py-2 bg-white text-slate-605 border border-slate-200 rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        გაუქმება
                      </button>
                      <button
                        id="admin-hub-submit"
                        type="submit"
                        className="px-5 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                      >
                        შექმნა
                      </button>
                    </div>
                  </form>
                )}

                {/* Hub items index table */}
                <div className="space-y-3">
                  {hubItems.map((item) => (
                    <div key={item.id} className="p-4 bg-slate-50 border border-slate-150 rounded-xl flex justify-between items-center gap-4 hover:border-slate-300 transition-colors">
                      <div className="flex items-center space-x-3 overflow-hidden">
                        <img
                          src={item.coverImage}
                          alt={item.title}
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-lg object-cover bg-slate-200 shrink-0"
                        />
                        <div className="truncate">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-slate-800 text-sm truncate">{item.title}</span>
                            <span className="bg-slate-200/60 text-slate-900 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md">
                              {item.category}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">გამოქყვეყნდა: {item.date}</span>
                        </div>
                      </div>

                      <button
                        id={`admin-hub-delete-${item.id}`}
                        onClick={() => onDeleteHubItem(item.id)}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg cursor-pointer transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>

              </div>
            )}

            {/* TAB 5: DISPATCHED SIMULATED EMAILS LOGS */}
            {activeAdminTab === 'emails' && (
              <div className="bg-white border border-slate-200/60 rounded-3xl p-6 sm:p-8 shadow-sm">
                
                <div className="border-b border-slate-100 pb-5 mb-6">
                  <h2 className="font-display font-black text-xl text-slate-900">ავტომატური ელ-ფოსტის სერვერი</h2>
                  <p className="text-slate-500 text-xs font-sans mt-1">დააკვირდით ჯავშნის დასტურის, ინვოისებისა და უარყოფების მეილების გაგზავნის ჟურნალს.</p>
                </div>

                {simulatedEmails.length === 0 ? (
                  <p className="text-center py-20 text-slate-400 font-medium">სიმულირებული მეილების ჟურნალი ცარიელია.</p>
                ) : (
                  <div className="space-y-4">
                    {simulatedEmails.map((ml) => (
                      <div key={ml.id} className="p-5 bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 space-y-3 font-mono text-xs">
                        {/* Simulation logs header elements wrapper block */}
                        <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
                          <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest flex items-center">
                            <Send className="h-3 w-3 mr-1" /> SMTP STATUS: SENT
                          </span>
                          <span className="text-[10px] text-slate-400">{ml.timestamp}</span>
                        </div>
                        
                        <div>
                          <span className="text-slate-400">To:</span> <span className="text-white font-semibold">{ml.to}</span>
                        </div>
                        
                        <div>
                          <span className="text-slate-400">Subject:</span> <span className="text-white font-semibold">{ml.subject}</span>
                        </div>

                        <div className="bg-slate-950 p-3.5 rounded-xl text-slate-350 border border-slate-900 whitespace-pre-wrap leading-relaxed">
                          {ml.body}
                        </div>

                        {ml.invoiceNum && (
                          <div className="flex items-center space-x-1 text-brand-300">
                            <FileText className="h-3.5 w-3.5" />
                            <span>მიმაგრებულია: Invoice_{ml.invoiceNum}.pdf</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

              </div>
            )}

            {/* TAB 6: SETTINGS, CONTACTS & INVOICES */}
            {activeAdminTab === 'settings' && (
              <div className="bg-white border border-slate-200/60 rounded-3xl p-6 sm:p-8 shadow-sm space-y-8">
                
                <div className="border-b border-slate-100 pb-5">
                  <h2 className="font-display font-black text-xl text-slate-900 flex items-center gap-2">
                    <SettingsIcon className="h-5 w-5 text-amber-550" />
                    ჰაბის პარამეტრები & ინვოისები
                  </h2>
                  <p className="text-slate-500 text-xs font-sans mt-1">დაარეგულირეთ ჰაბის საკონტაქტო ინფორმაცია და საინვოისო შაბლონის დეტალები.</p>
                </div>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const hubAddress = formData.get('hubAddress') as string;
                  const hubEmail = formData.get('hubEmail') as string;
                  const hubPhone = formData.get('hubPhone') as string;
                  const hubWorkHours = formData.get('hubWorkHours') as string;
                  
                  const invoiceTitle = formData.get('invoiceTitle') as string;
                  const invoiceOrgName = formData.get('invoiceOrgName') as string;
                  const invoiceBankName = formData.get('invoiceBankName') as string;
                  const invoiceIban = formData.get('invoiceIban') as string;
                  const invoiceFooter = formData.get('invoiceFooter') as string;

                  onUpdateSettings({
                    ...bookingSettings,
                    hubAddress,
                    hubEmail,
                    hubPhone,
                    hubWorkHours,
                    invoiceTitle,
                    invoiceOrgName,
                    invoiceBankName,
                    invoiceIban,
                    invoiceFooter
                  });
                  alert('პარამეტრები წარმატებით შეინახა!');
                }} className="space-y-6">
                  
                  {/* Part A: Contacts */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest font-sans border-b border-slate-150 pb-2 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-brand-500" />
                      1. საკონტაქტო ინფორმაცია (საიტის ფუტერი)
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">ჰაბის მისამართი *</label>
                        <input
                          type="text"
                          name="hubAddress"
                          defaultValue={bookingSettings?.hubAddress ?? 'გიორგი წერეთლის ქუჩა #12, ფოთი, საქართველო'}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-sans focus:outline-hidden"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">ელ-ფოსტა *</label>
                        <input
                          type="email"
                          name="hubEmail"
                          defaultValue={bookingSettings?.hubEmail ?? 'yhub.poti@gmail.com'}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-sans focus:outline-hidden"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">ტელეფონის ნომერი *</label>
                        <input
                          type="text"
                          name="hubPhone"
                          defaultValue={bookingSettings?.hubPhone ?? '+995 599 123 456'}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-sans focus:outline-hidden"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">სამუშაო საათები *</label>
                        <input
                          type="text"
                          name="hubWorkHours"
                          defaultValue={bookingSettings?.hubWorkHours ?? 'ორშაბათი - პარასკევი: 10:00 - 20:00'}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-sans focus:outline-hidden"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Part B: Invoice Template */}
                  <div className="space-y-4 pt-4">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest font-sans border-b border-slate-150 pb-2 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      2. ინვოისის შაბლონის პარამეტრები (Full Invoice Template)
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">ინვოისის სათაური *</label>
                        <input
                          type="text"
                          name="invoiceTitle"
                          defaultValue={bookingSettings?.invoiceTitle ?? 'ინვოისი მომსახურებაზე'}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-sans focus:outline-hidden"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">ორგანიზაციის დასახელება *</label>
                        <input
                          type="text"
                          name="invoiceOrgName"
                          defaultValue={bookingSettings?.invoiceOrgName ?? 'ფოთის ახალგაზრდული ჰაბი'}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-sans focus:outline-hidden"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">ბანკის დასახელება *</label>
                        <input
                          type="text"
                          name="invoiceBankName"
                          defaultValue={bookingSettings?.invoiceBankName ?? 'საქართველოს ბანკი'}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-sans focus:outline-hidden"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">საბანკო ანგარიში (IBAN) *</label>
                        <input
                          type="text"
                          name="invoiceIban"
                          defaultValue={bookingSettings?.invoiceIban ?? 'GE90BG0000000123456789'}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-sans focus:outline-hidden"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">ინვოისის ქვედა ტექსტი (ამხსნელი / ფუტერი) *</label>
                      <textarea
                        rows={3}
                        name="invoiceFooter"
                        defaultValue={bookingSettings?.invoiceFooter ?? 'გიორგი წერეთლის ქუჩა #12, ფოთი, საქართველო. გმადლობთ, რომ სარგებლობთ ახალგაზრდული ჰაბის სივრცით!'}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-sans focus:outline-hidden resize-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-150 flex justify-end">
                    <button
                      type="submit"
                      className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer transition-colors"
                    >
                      პარამეტრების შენახვა
                    </button>
                  </div>
                </form>

              </div>
            )}



          </div>
        </div>

        {/* ---------------- DRAWERS & LAYOUTS MODALS ---------------- */}

        {/* Dynamic PDF-Invoice Simulation overlay rendering modal */}
        {selectedInvoiceBooking && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex justify-center items-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl relative overflow-hidden my-8 p-8 sm:p-10 text-slate-800 leading-snug">
              
              {/* Close invoice modal button */}
              <button
                _id="invoice-modal-close"
                onClick={() => setSelectedInvoiceBooking(null)}
                className="absolute top-4 right-4 bg-slate-100 text-slate-600 hover:bg-slate-200 p-2.5 rounded-full cursor-pointer transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Invoice body paper */}
              <div id="print-invoice-sheet" className="font-sans space-y-6">
                
                {/* Visual Header */}
                <div className="flex justify-between items-start border-b border-slate-150 pb-6">
                  <div>
                    <h3 className="font-display font-black text-xl text-slate-900 tracking-tight">
                      {bookingSettings.invoiceTitle || 'ინვოისი მომსახურებაზე'}
                    </h3>
                    <p className="text-rose-600 font-mono text-xs font-semibold mt-1">
                      ინვოისი #: {selectedInvoiceBooking.invoiceNumber || 'INV-2026-000'}
                    </p>
                    <p className="text-slate-400 text-[10px] mt-0.5">თარიღი: {new Date().toISOString().split('T')[0]}</p>
                  </div>

                  <div className="text-right">
                    <span className="block font-display font-black text-sm text-slate-900">
                      {bookingSettings.invoiceOrgName || 'ფოთის ახალგაზრდული ჰაბი'}
                    </span>
                    <span className="block text-[10px] text-slate-400 uppercase font-black">Poti Youth Hub, Georgia</span>
                    <span className="block text-[10px] text-slate-400">{bookingSettings.hubEmail || 'yhub.poti@gmail.com'}</span>
                  </div>
                </div>

                {/* Billing Addresses section */}
                <div className="grid grid-cols-2 gap-6 text-xs sm:text-sm">
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1.5">გადამხდელი:</span>
                    <span className="block font-black text-slate-900">
                      {selectedInvoiceBooking.firstName} {selectedInvoiceBooking.lastName}
                    </span>
                    {selectedInvoiceBooking.organization && (
                      <span className="block text-slate-650 font-medium">ორგ: "{selectedInvoiceBooking.organization}"</span>
                    )}
                    <span className="block text-slate-500 font-mono text-xs mt-1">{selectedInvoiceBooking.phone}</span>
                    <span className="block text-slate-500 text-xs">{selectedInvoiceBooking.email}</span>
                  </div>

                  <div className="text-right">
                    <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1.5 font-sans">გადახდის პირობა:</span>
                    <span className="block font-semibold text-slate-800">უნაღდო ანგარიშსწორება</span>
                    <span className="block text-slate-500">ბანკი: <b>{bookingSettings.invoiceBankName || 'საქართველოს ბანკი'}</b></span>
                    <span className="block font-mono text-xs text-slate-600">ანგარიში (IBAN): {bookingSettings.invoiceIban || 'GE90BG0000000123456789'}</span>
                  </div>
                </div>

                {/* Invoice Table Grid */}
                <div>
                  <table className="w-full text-left text-xs sm:text-sm border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-150">
                        <th className="py-2 px-3">პუნქტი / აღწერა</th>
                        <th className="py-2 px-3 text-center">თარიღი</th>
                        <th className="py-2 px-3 text-center">საათები</th>
                        <th className="py-2 px-3 text-right">ტარიფი</th>
                        <th className="py-2 px-3 text-right">ჯამი</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-slate-100 font-medium text-slate-800">
                        <td className="py-3 px-3">
                          {selectedInvoiceBooking.roomName}
                          <span className="block text-[10px] text-slate-400 font-sans mt-0.5">
                            ჯავშანი {selectedInvoiceBooking.durationHours} | დარეგისტრირებულია: {selectedInvoiceBooking.numPeople} კაცზე
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-xs">{selectedInvoiceBooking.date}</td>
                        <td className="py-3 px-3 text-center font-mono">
                          {Math.round(selectedInvoiceBooking.totalPrice / (rooms.find(r => r.id === selectedInvoiceBooking.roomId)?.price || 15))}
                        </td>
                        <td className="py-3 px-3 text-right font-mono">₾{rooms.find(r => r.id === selectedInvoiceBooking.roomId)?.price || 15}</td>
                        <td className="py-3 px-3 text-right font-mono font-bold">₾{selectedInvoiceBooking.totalPrice}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Sub Total calculations and stamp mockup */}
                <div className="flex justify-between items-center bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  {/* Decorative Mock Stamp Circle */}
                  <div className="hidden sm:flex items-center space-x-2">
                    <div className="w-12 h-12 rounded-full border-2 border-dashed border-emerald-500/40 text-emerald-600/55 flex items-center justify-center font-display font-black text-[9px] uppercase tracking-widest leading-none rotate-12 text-center p-1">
                      Poti Hub Approved
                    </div>
                    <span className="text-[10px] text-slate-400 font-sans">ელექტრონული დადასტურება</span>
                  </div>

                  <div className="text-right ml-auto space-y-1">
                    <div className="text-xs text-slate-450 font-semibold uppercase">გადასახდელი თანხა</div>
                    <div className="font-display font-black text-2xl text-slate-900 font-mono">
                      ₾{selectedInvoiceBooking.totalPrice}.00 GEL
                    </div>
                  </div>
                </div>

                {/* Informational footer directions */}
                <div className="text-center text-[10px] text-slate-400 font-medium border-t border-slate-150 pt-5">
                  {bookingSettings.invoiceFooter || 'გიორგი წერეთლის ქუჩა #12, ფოთი, საქართველო. გმადლობთ, რომ სარგებლობთ ახალგაზრდული ჰაბის სივრცით!'}
                </div>

              </div>

              {/* Print action and back buttons */}
              <div className="mt-8 pt-4 border-t border-slate-150 flex flex-wrap gap-2 justify-end">
                <button
                  id="invoice-download-pdf-btn"
                  onClick={handleDownloadPdf}
                  className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 transition-colors"
                >
                  <FileText className="h-4 w-4" />
                  <span>PDF-ის ჩამოტვირთვა</span>
                </button>
                <button
                  id="invoice-print-btn"
                  onClick={handlePrintInvoice}
                  className="px-5 py-2.5 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 transition-colors"
                >
                  <Send className="h-4 w-4" />
                  <span>ბეჭდვა</span>
                </button>
                <button
                  id="invoice-back-btn"
                  onClick={() => setSelectedInvoiceBooking(null)}
                  className="px-4 py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  უკან დაბრუნება
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
