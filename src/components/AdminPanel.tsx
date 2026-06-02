/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Room, Booking, CustomQuestion, HubItem, HubCategory } from '../types';
import AdminCalendar from './AdminCalendar';
import { 
  Check, X, Plus, Trash2, Edit, Calendar, Users, DollarSign, Mail, 
  Clock, ShieldAlert, FileText, LayoutList, ListPlus, Send, MessageSquarePlus, Sparkles, HelpCircle, Settings as SettingsIcon, Percent,
  ArrowUp, ArrowDown, Table, Download, Globe, Eye, Share2, Search,
  Upload, Image as ImageIcon, Loader2, Printer, FileSpreadsheet
} from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import { optimizeImageForWeb, blobToBase64 } from '../utils/imageOptimizer';

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
  onUpdateHubItem?: (item: HubItem) => void;
  onDeleteHubItem: (id: string) => void;
  onDeleteBooking: (id: string) => void;
  onDeleteEmail?: (id: string) => void;
  onReorderRoom?: (id: string, direction: 'up' | 'down') => void;
  onReorderHubItem?: (id: string, direction: 'up' | 'down') => void;
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
  onUpdateHubItem,
  onDeleteHubItem,
  onDeleteBooking,
  onDeleteEmail,
  onReorderRoom,
  onReorderHubItem
}: AdminPanelProps) {
  const [activeAdminTab, setActiveAdminTab] = useState<'bookings' | 'rooms' | 'questions' | 'hub' | 'emails' | 'calendar' | 'settings'>('bookings');
  
  // SEO Local States for Live Metadata Previews
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [seoKeywords, setSeoKeywords] = useState('');
  const [seoImage, setSeoImage] = useState('');
  const [seoGoogleAnalytics, setSeoGoogleAnalytics] = useState('');
  const [seoRobotIndex, setSeoRobotIndex] = useState(true);
  const [hasInitializedSeo, setHasInitializedSeo] = useState(false);

  // Sync with bookingSettings once loaded
  useEffect(() => {
    if (bookingSettings && !hasInitializedSeo) {
      setSeoTitle(bookingSettings.seoTitle ?? 'ფოთის ახალგაზრდული ჰაბი | Poti Youth Hub');
      setSeoDescription(bookingSettings.seoDescription ?? 'განათლების, ტექნოლოგიების, კარიერული ზრდისა და კულტურული განვითარების ცენტრი ქალაქ ფოთში. შემოგვიერთდი და მიიღე მონაწილეობა ჰაბის აქტივობებში.');
      setSeoKeywords(bookingSettings.seoKeywords ?? 'ფოთი, ახალგაზრდობა, ჰაბი, ტრენინგი, კარიერა, სივრცე');
      setSeoImage(bookingSettings.seoImage ?? 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&h=630&q=80');
      setSeoGoogleAnalytics(bookingSettings.seoGoogleAnalytics ?? 'G-XXXXXXXXXX');
      setSeoRobotIndex(bookingSettings.seoRobotIndex ?? true);
      setHasInitializedSeo(true);
    }
  }, [bookingSettings, hasInitializedSeo]);
  
  // Filtering states
  const [bookingFilter, setBookingFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  
  // Custom interactive modulations
  const [selectedInvoiceBooking, setSelectedInvoiceBooking] = useState<Booking | null>(null);

  const handlePrintInvoice = () => {
    window.print();
  };

  const handleDownloadXls = () => {
    if (!selectedInvoiceBooking) return;
    
    let content = "\uFEFF"; // UTF-8 BOM
    
    // Header
    content += "ფოთის ახალგაზრდული ჰაბი | YOUTH HUB POTI\n";
    content += `ანგარიშსწორების დოკუმენტი / ინვოისი: ,"${bookingSettings.invoiceTitle || 'ინვოისი მომსახურებაზე'}"\n`;
    content += `ინვოისი #: ,${selectedInvoiceBooking.invoiceNumber || 'INV-2026-000'}\n`;
    content += `თარიღი: ,${new Date().toISOString().split('T')[0]}\n\n`;
    
    // Vendor info
    content += "გამცემი ორგანიზაცია:\n";
    content += `დასახელება: ,"${bookingSettings.invoiceOrgName || 'ფოთის ახალგაზრდული ჰაბი'}"\n`;
    content += `ელ-ფოსტა: ,${bookingSettings.hubEmail || 'yhub.poti@gmail.com'}\n`;
    content += `ბანკი: ,"${bookingSettings.invoiceBankName || 'საქართველოს ბანკი'}"\n`;
    content += `ანგარიშის ნომერი (IBAN): ,${bookingSettings.invoiceIban || 'GE90BG0000000123456789'}\n\n`;
    
    // Buyer info
    content += "დამკვეთი / გადამხდელი:\n";
    content += `სახელი გვარი: ,"${selectedInvoiceBooking.firstName} ${selectedInvoiceBooking.lastName}"\n`;
    if (selectedInvoiceBooking.organization) {
      content += `ორგანიზაცია: ,"${selectedInvoiceBooking.organization.replace(/"/g, '""')}"\n`;
    }
    content += `ტელეფონი: ,${selectedInvoiceBooking.phone}\n`;
    content += `ელ-ფოსტა: ,${selectedInvoiceBooking.email}\n\n`;
    
    // Table Details
    content += "მომსახურების აღწერა,ჯავშნის თარიღი,საათები,ტარიფი (₾),ჯამური ღირებულება (₾)\n";
    
    const baseHourRate = rooms.find(r => r.id === selectedInvoiceBooking.roomId)?.price || 15;
    const hoursCount = Math.round(selectedInvoiceBooking.totalPrice / baseHourRate);
    
    content += `"${selectedInvoiceBooking.roomName.replace(/"/g, '""')} - დარბაზის/სივრცის დაჯავშნა (დეტალები: ${selectedInvoiceBooking.durationHours.replace(/"/g, '""')}, ${selectedInvoiceBooking.numPeople} კაცი)",${selectedInvoiceBooking.date},${hoursCount},${baseHourRate},${selectedInvoiceBooking.totalPrice}\n\n`;
    
    // Totals
    content += `,,ლიმიტი/ჯამი:,,₾${selectedInvoiceBooking.totalPrice}.00 GEL\n`;
    content += `,,სტატუსი:,,დადასტურებული\n\n`;
    content += `შენიშვნა: ,"${bookingSettings.invoiceFooter || 'გიორგი წერეთლის ქუჩა #12, ფოთი, საქართველო. გმადლობთ, რომ სარგებლობთ ახალგაზრდული ჰაბის სივრცით!'}"\n`;

    const blob = new Blob([content], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Invoice_${selectedInvoiceBooking.invoiceNumber || 'INV-2026'}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Google Spreadsheet Modulations
  const [isSpreadsheetOpen, setIsSpreadsheetOpen] = useState(false);
  const [spreadsheetTab, setSpreadsheetTab] = useState<'rooms' | 'bookings'>('rooms');
  const [sheetRooms, setSheetRooms] = useState<any[]>([]);
  const [sheetBookings, setSheetBookings] = useState<any[]>([]);
  const [activeCell, setActiveCell] = useState<{ id: string; field: string } | null>(null);

  const initSpreadsheetData = () => {
    setSheetRooms(rooms.map((r, idx) => ({
      rowNum: idx + 2,
      id: r.id,
      name: r.name,
      order: r.order !== undefined ? r.order : (idx + 1),
      capacity: r.capacity || 10,
      price: r.price || 15,
      dayPrice: r.dayPrice || Math.round((r.price || 15) * 8),
      bookingsCount: bookings.filter(b => b.roomId.includes(r.id)).length,
      earnings: bookings.filter(b => b.roomId.includes(r.id) && b.status === 'approved').reduce((acc, b) => acc + (b.totalPrice || 0), 0)
    })));

    setSheetBookings(bookings.map((b, idx) => ({
      rowNum: idx + 2,
      id: b.id,
      roomName: b.roomName,
      date: b.date,
      durationHours: b.durationHours,
      firstName: b.firstName,
      lastName: b.lastName,
      organization: b.organization || '',
      email: b.email,
      phone: b.phone,
      totalPrice: b.totalPrice,
      status: b.status
    })));
  };

  const handleUpdateSheetRoom = (roomId: string, field: string, value: any) => {
    setSheetRooms(prev => prev.map(item => {
      if (item.id === roomId) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleUpdateSheetBooking = (bookingId: string, field: string, value: any) => {
    setSheetBookings(prev => prev.map(item => {
      if (item.id === bookingId) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleExportCSV = () => {
    let csvContent = "\uFEFF"; // Add UTF-8 BOM so MS Excel opens Georgian characters perfectly!
    if (spreadsheetTab === 'rooms') {
      csvContent += "რიგი,ოთახის ID,ოთახის დასახელება,რიგითობა,ტევადობა,საათობრივი საფასური (₾),დღიური საფასური (₾),ჯავშნების რაოდენობა,ჯამური შემოსავალი (₾)\n";
      sheetRooms.forEach((r, idx) => {
        csvContent += `${idx + 2},${r.id},"${r.name.replace(/"/g, '""')}",${r.order},${r.capacity},${r.price},${r.dayPrice},${r.bookingsCount},${r.earnings}\n`;
      });
    } else {
      csvContent += "რიგი,ჯავშნის ID,ოთახის დასახელება,თარიღი,ხანგრძლივობა,სახელი,გვარი,ორგანიზაცია,ელ-ფოსტა,ტელეფონი,საერთო ფასი (₾),სტატუსი\n";
      sheetBookings.forEach((b, idx) => {
        csvContent += `${idx + 2},RSV-${b.id},"${b.roomName.replace(/"/g, '""')}",${b.date},"${b.durationHours}",${b.firstName},${b.lastName},"${b.organization.replace(/"/g, '""')}",${b.email},${b.phone},${b.totalPrice},${b.status}\n`;
      });
    }
    const blob = new Blob([csvContent], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `YHub_Poti_${spreadsheetTab === 'rooms' ? 'Rooms_Order' : 'Bookings_Report'}_${new Date().toISOString().substring(0, 10)}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSyncSpreadsheet = async () => {
    try {
      if (spreadsheetTab === 'rooms') {
        for (const sr of sheetRooms) {
          const original = rooms.find(r => r.id === sr.id);
          if (original) {
            if (
              original.order !== Number(sr.order) || 
              original.capacity !== Number(sr.capacity) || 
              original.price !== Number(sr.price) || 
              original.dayPrice !== Number(sr.dayPrice)
            ) {
              await onUpdateRoom({
                ...original,
                order: Number(sr.order),
                capacity: Number(sr.capacity),
                price: Number(sr.price),
                dayPrice: Number(sr.dayPrice)
              });
            }
          }
        }
        alert('მონაცემები წარმატებით სინქრონიზდა ბაზასთან!');
      } else {
        alert('შენიშვნა: ჯავშნების ცხრილი განკუთვნილია მხოლოდ საყურებლად და საექსპორტოდ.');
      }
    } catch (err) {
      console.error(err);
      alert('რედაქტირებულ მონაცემთა შენახვა/სინქრონიზაცია ვერ მოხერხდა.');
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
  const [hubTrainingButtonText, setHubTrainingButtonText] = useState('');
  const [hubTrainingButtonLink, setHubTrainingButtonLink] = useState('');
  const [trainingButtonValidationError, setTrainingButtonValidationError] = useState('');
  const [hubAdditionalImages, setHubAdditionalImages] = useState<string[]>([]);
  const [coverUploading, setCoverUploading] = useState(false);
  const [additionalUploading, setAdditionalUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [editHubItemId, setEditHubItemId] = useState<string | null>(null);
  const [hubCustomUrl, setHubCustomUrl] = useState('');

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

  // Upload and Web-Optimize image function (Fallback to Base64 on storage fail or timeout)
  const processAndUploadImage = async (file: File): Promise<string> => {
    try {
      // 1. Client-side canvas compression to webp/jpeg with max 1000px dimension and 0.65 quality (ultra-optimized for fast web load and compact size)
      const optimizedBlob = await optimizeImageForWeb(file, 1000, 1000, 0.65);
      
      try {
        // 2. Try Firebase Storage upload with a fast 3.5-second timeout
        const cleanName = file.name.replace(/[^a-zA-Z0-9.]/g, '');
        const storageRef = ref(storage, `hub_posts/${Date.now()}_${cleanName}`);
        
        const uploadPromise = uploadBytes(storageRef, optimizedBlob);
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Firebase Storage upload timeout')), 3500)
        );
        
        const uploadResult = await Promise.race([uploadPromise, timeoutPromise]);
        
        // Fetch download URL with a fast 2-second timeout as well
        const urlPromise = getDownloadURL(uploadResult.ref);
        const urlTimeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Firebase Download URL timeout')), 2000)
        );
        
        const downloadUrl = await Promise.race([urlPromise, urlTimeoutPromise]);
        return downloadUrl;
      } catch (storageErr) {
        console.warn('Firebase Storage blocked, timed out, or unconfigured. Falling back to client-side optimized Base64 string:', storageErr);
        // Fallback: Convert optimized WebP blob directly to Base64 and return
        const base64Str = await blobToBase64(optimizedBlob);
        return base64Str;
      }
    } catch (err) {
      console.error('Image compression and optimization failed:', err);
      throw err;
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCoverUploading(true);
    setUploadError('');
    try {
      const url = await processAndUploadImage(file);
      setHubCover(url);
    } catch (err: any) {
      setUploadError('ფოტოს ატვირთვა ვერ მოხერხდა: ' + (err.message || String(err)));
    } finally {
      setCoverUploading(false);
    }
  };

  const handleAdditionalImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setAdditionalUploading(true);
    setUploadError('');
    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const url = await processAndUploadImage(file);
        uploadedUrls.push(url);
      }
      setHubAdditionalImages((prev) => [...prev, ...uploadedUrls]);
    } catch (err: any) {
      setUploadError('დამატებითი ფოტოების ატვირთვა ვერ მოხერხდა: ' + (err.message || String(err)));
    } finally {
      setAdditionalUploading(false);
    }
  };

  const handleRemoveAdditionalImage = (index: number) => {
    setHubAdditionalImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Hub Content submitter
  const handleHubSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hubTitle || !hubSummary || !hubContent) return;

    // Validate custom button fields for training posts
    if (hubCat === 'training') {
      const btnTextCleaned = hubTrainingButtonText.trim();
      const btnLinkCleaned = hubTrainingButtonLink.trim();

      if (!btnTextCleaned || !btnLinkCleaned) {
        setTrainingButtonValidationError('გთხოვთ მიუთითოთ სპეციფიკური ღილაკის სახელი და რეგისტრაციის ბმული ტრენინგის პოსტისთვის.');
        return;
      }

      const lowerText = btnTextCleaned.toLowerCase();
      const blockedTerms = ['დამატებითი ინფორმაცია', 'სარეგისტრაციო ფორმა', 'განაცხადი'];
      for (const term of blockedTerms) {
        if (lowerText === term || lowerText.includes(term)) {
          setTrainingButtonValidationError(`ღილაკის სახელი არ შეიძლება იყოს "${term}" ან შეიცავდეს მას! გთხოვთ გამოიყენოთ სხვა სპეციფიკური სახელი.`);
          return;
        }
      }
    }

    const reqsArr = hubReqs ? hubReqs.split('\n').map(r => r.trim()).filter(Boolean) : undefined;
    const fallbackImage = hubCover || 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80';

    if (editHubItemId) {
      if (onUpdateHubItem) {
        onUpdateHubItem({
          id: editHubItemId,
          category: hubCat,
          title: hubTitle,
          summary: hubSummary,
          content: hubContent,
          coverImage: fallbackImage,
          date: hubItems.find(item => item.id === editHubItemId)?.date || new Date().toISOString().split('T')[0],
          deadline: hubDeadline || undefined,
          location: hubLocation || undefined,
          salaryRange: hubSalary || undefined,
          requirements: reqsArr,
          additionalImages: hubAdditionalImages.length > 0 ? hubAdditionalImages : undefined,
          trainingButtonText: hubCat === 'training' ? hubTrainingButtonText.trim() : undefined,
          trainingButtonLink: hubCat === 'training' ? hubTrainingButtonLink.trim() : undefined,
          customUrl: hubCustomUrl.trim() || undefined
        });
      }
      setEditHubItemId(null);
    } else {
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
        requirements: reqsArr,
        additionalImages: hubAdditionalImages.length > 0 ? hubAdditionalImages : undefined,
        trainingButtonText: hubCat === 'training' ? hubTrainingButtonText.trim() : undefined,
        trainingButtonLink: hubCat === 'training' ? hubTrainingButtonLink.trim() : undefined,
        customUrl: hubCustomUrl.trim() || undefined
      });
    }

    setHubTitle('');
    setHubSummary('');
    setHubContent('');
    setHubCover('');
    setHubDeadline('');
    setHubLocation('');
    setHubSalary('');
    setHubReqs('');
    setHubTrainingButtonText('');
    setHubTrainingButtonLink('');
    setHubCustomUrl('');
    setTrainingButtonValidationError('');
    setHubAdditionalImages([]);
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

                  <div className="flex flex-wrap gap-2 items-center">
                    <button
                      onClick={() => {
                        initSpreadsheetData();
                        setIsSpreadsheetOpen(true);
                      }}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-97 text-white text-xs font-black rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer shadow-md shadow-emerald-100 border border-emerald-500"
                    >
                      <Table className="h-3.5 w-3.5" />
                      <span>ფორმატი</span>
                    </button>

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

                            <button
                              onClick={() => onDeleteBooking(b.id)}
                              className="px-3 py-2 bg-slate-100 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-all text-slate-600 text-xs font-bold rounded-xl flex items-center space-x-1 cursor-pointer border border-slate-200"
                              title="ჯავშნის წაშლა"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>წაშლა</span>
                            </button>
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
                  
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        initSpreadsheetData();
                        setIsSpreadsheetOpen(true);
                      }}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-97 text-white text-xs font-black rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer shadow-md shadow-emerald-50 border border-emerald-500"
                    >
                      <Table className="h-3.5 w-3.5" />
                      <span>ფორმატი</span>
                    </button>

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
                        <div className="flex space-x-1.5 items-center">
                          {onReorderRoom && (
                            <div className="flex space-x-1 border-r border-slate-200 pr-2 mr-1">
                              <button
                                onClick={() => onReorderRoom(room.id, 'up')}
                                className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md cursor-pointer transition-colors"
                                title="ზემოთ გადანაცვლება"
                              >
                                <ArrowUp className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => onReorderRoom(room.id, 'down')}
                                className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md cursor-pointer transition-colors"
                                title="ქვემოთ გადანაცვლება"
                              >
                                <ArrowDown className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
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
                        type="button"
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
                    <p className="text-slate-500 text-xs font-sans mt-1">მართეთ ბლოგები, სიახლეები, ტრენინგები, სხვადასხვა პოსტები და კონკურსები.</p>
                  </div>

                  <button
                    type="button"
                    id="admin-hub-add-btn"
                    onClick={() => {
                      if (showHubForm) {
                        setShowHubForm(false);
                      } else {
                        setEditHubItemId(null);
                        setHubTitle('');
                        setHubSummary('');
                        setHubContent('');
                        setHubCover('');
                        setHubDeadline('');
                        setHubLocation('');
                        setHubSalary('');
                        setHubReqs('');
                        setHubTrainingButtonText('');
                        setHubTrainingButtonLink('');
                        setHubCustomUrl('');
                        setTrainingButtonValidationError('');
                        setHubAdditionalImages([]);
                        setShowHubForm(true);
                      }
                    }}
                    className="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center space-x-1 shadow-xs cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>ახალი პოსტის შექმნა</span>
                  </button>
                </div>

                {/* Hub post drawer form */}
                {showHubForm && (
                  <form id="admin-hub-form" onSubmit={handleHubSubmit} className="p-6 bg-slate-50 border border-slate-150 rounded-2xl mb-8 space-y-4 animate-fadeIn">
                    <h3 className="font-display font-bold text-slate-900 text-sm">
                      {editHubItemId ? 'პოსტის რედაქტირება' : 'ახალი პუბლიკაციის შექმნა'}
                    </h3>

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
                          <option value="general">სხვადასხვა</option>
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

                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">სპეციფიკური ბმული (Custom URL - რეფერალური/გარე ბმული, სურვილისამებრ)</label>
                      <input
                        id="admin-hub-custom-url"
                        type="url"
                        value={hubCustomUrl}
                        onChange={(e) => setHubCustomUrl(e.target.value)}
                        placeholder="მაგ: https://facebook.com/posts/12345 (პოსტზე დაკლიკებისას მომხმარებელი გადამისამართდება ამ ბმულზე)"
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-sans focus:outline-hidden"
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
                          <label className="block text-xs font-bold text-slate-500 mb-1">ლოკაცია</label>
                          <input
                            id="admin-hub-location"
                            type="text"
                            value={hubLocation}
                            onChange={(e) => setHubLocation(e.target.value)}
                            placeholder="მაგ: ფოთის ჰაბი, მეორე სართული"
                            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-hidden"
                          />
                        </div>

                        {hubCat === 'vacancy' && (
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-bold text-slate-500 mb-1">ანაზღაურება / სახელფასო ბადე</label>
                            <input
                              id="admin-hub-salary"
                              type="text"
                              value={hubSalary}
                              onChange={(e) => setHubSalary(e.target.value)}
                              placeholder="მაგ: 1200 - 1500 GEL"
                              className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-hidden"
                            />
                          </div>
                        )}

                        {hubCat === 'training' && (
                          <div className="sm:col-span-2 border-t border-dashed border-slate-300 pt-4 mt-2 space-y-3">
                            <h4 className="text-xs font-bold text-brand-600 uppercase tracking-wider">რეგისტრაციის ღილაკის ინტერფეისი</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[11px] font-bold text-slate-500 mb-1">ღილაკის სათაური *</label>
                                <input
                                  id="admin-hub-training-btn-text"
                                  type="text"
                                  value={hubTrainingButtonText}
                                  onChange={(e) => {
                                    setHubTrainingButtonText(e.target.value);
                                    const text = e.target.value.toLowerCase();
                                    const blockedTerms = ['დამატებითი ინფორმაცია', 'სარეგისტრაციო ფორმა', 'განაცხადი'];
                                    let errorFound = '';
                                    for (const term of blockedTerms) {
                                      if (text === term || text.includes(term)) {
                                        errorFound = `ღილაკის სახელი არ შეიძლება იყოს "${term}" ან შეიცავდეს მას!`;
                                        break;
                                      }
                                    }
                                    setTrainingButtonValidationError(errorFound);
                                  }}
                                  placeholder="მაგ: დაიწყე სწავლა"
                                  className={`w-full p-2.5 bg-white border ${trainingButtonValidationError ? 'border-red-400 focus:border-red-500 bg-red-50/20' : 'border-slate-200'} rounded-xl text-xs focus:outline-hidden`}
                                  required={hubCat === 'training'}
                                />
                                {trainingButtonValidationError && (
                                  <p className="text-red-500 text-[10px] mt-1 font-bold">
                                    {trainingButtonValidationError}
                                  </p>
                                )}
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-slate-500 mb-1">რეგისტრაციის ბმული (URL) *</label>
                                <input
                                  id="admin-hub-training-btn-link"
                                  type="url"
                                  value={hubTrainingButtonLink}
                                  onChange={(e) => setHubTrainingButtonLink(e.target.value)}
                                  placeholder="მაგ: https://forms.gle/your-form"
                                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-hidden"
                                  required={hubCat === 'training'}
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="sm:col-span-2">
                          <label className="block text-xs font-bold text-slate-500 mb-1">მოთხოვნები (თითო ხაზზე თითო მოთხოვნა)</label>
                          <textarea
                            id="admin-hub-reqs"
                            rows={3}
                            value={hubReqs}
                            onChange={(e) => setHubReqs(e.target.value)}
                            placeholder="მაგ: რეაქტის ცოდნა&#10;ინგლისურის ცოდნა"
                            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-hidden resize-none"
                          />
                        </div>
                      </div>
                    )}

                    {/* Image uploads block */}
                    <div className="space-y-4 p-4.5 bg-slate-100 rounded-2xl border border-slate-200">
                      <span className="block text-xs font-extrabold uppercase text-slate-600 tracking-wider">მედია ფაილების ატვირთვა (ოპტიმიზებული ვებ-ჩატვირთვისთვის)</span>

                      {uploadError && (
                        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-xs font-sans">
                          {uploadError}
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* 1. Cover Image Upload */}
                        <div className="p-4 bg-white rounded-xl border border-slate-200/60 shadow-xs space-y-3">
                          <label className="block text-xs font-bold text-slate-700">მთავარი გარეკანის ფოტო (Cover Image)</label>
                          
                          <div className="flex items-center space-x-3">
                            <div className="relative w-24 h-16 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                              {hubCover ? (
                                <img
                                  src={hubCover}
                                  alt="Cover preview"
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <ImageIcon className="h-5 w-5 text-slate-400" />
                              )}
                              {coverUploading && (
                                <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                                  <Loader2 className="h-4 w-4 text-slate-800 animate-spin" />
                                </div>
                              )}
                            </div>

                            <div className="flex-1 space-y-1.5">
                              <label className="inline-flex items-center px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-lg cursor-pointer transition-colors shadow-2xs">
                                <Upload className="h-3 w-3 mr-1" />
                                <span>ფაილის ატვირთვა</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleCoverUpload}
                                  className="hidden"
                                />
                              </label>
                              <span className="block text-[10px] text-slate-400 font-sans">ან ჩაწერეთ ლინკი:</span>
                            </div>
                          </div>

                          <input
                            id="admin-hub-cover"
                            type="text"
                            value={hubCover}
                            onChange={(e) => setHubCover(e.target.value)}
                            placeholder="https://images.unsplash.com/... ან ატვირთული ფოტოს ლინკი"
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-hidden font-mono"
                          />
                        </div>

                        {/* 2. Additional Pictures Upload */}
                        <div className="p-4 bg-white rounded-xl border border-slate-200/60 shadow-xs space-y-3">
                          <label className="block text-xs font-bold text-slate-700">დამატებითი სურათები (გალერეა)</label>
                          
                          <div className="flex items-center space-x-3">
                            <div className="flex-1 space-y-1">
                              <label className="inline-flex items-center px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg cursor-pointer transition-colors shadow-2xs">
                                <Plus className="h-3 w-3 mr-1" />
                                <span>რამდენიმე ფოტოს ატვირთვა</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  onChange={handleAdditionalImagesUpload}
                                  className="hidden"
                                />
                              </label>
                              <span className="block text-[10px] text-slate-400 font-sans leading-tight">
                                შეგიძლიათ აირჩიოთ რამდენიმე ფოტო ერთად. ფოტოები კომპრესირდება ვებ-ოპტიმიზებული ზომისთვის.
                              </span>
                            </div>
                            
                            {additionalUploading && (
                              <div className="flex items-center space-x-1.5 shrink-0 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                                <Loader2 className="h-3.5 w-3.5 text-slate-700 animate-spin" />
                                <span className="text-[10px] font-bold text-slate-600 font-sans">იტვირთება...</span>
                              </div>
                            )}
                          </div>

                          {/* Extra uploaded list container */}
                          {hubAdditionalImages.length > 0 && (
                            <div className="mt-2 space-y-1.5 max-h-36 overflow-y-auto border border-slate-100 p-2 rounded-lg bg-slate-50">
                              <span className="block text-[9px] font-black uppercase text-slate-450 tracking-wider">დამატებული ფოტოები ({hubAdditionalImages.length}):</span>
                              
                              <div className="grid grid-cols-4 gap-2">
                                {hubAdditionalImages.map((imgUrl, idx) => (
                                  <div key={idx} className="relative aspect-video rounded-md overflow-hidden bg-slate-200 border border-slate-300">
                                    <img
                                      src={imgUrl}
                                      alt={`Preview ${idx + 1}`}
                                      className="w-full h-full object-cover"
                                      referrerPolicy="no-referrer"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveAdditionalImage(idx)}
                                      className="absolute top-0.5 right-0.5 p-1 bg-red-650 hover:bg-red-700 text-white rounded-md cursor-pointer transition-colors"
                                      title="წაშლა"
                                    >
                                      <Trash2 className="h-2.5 w-2.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">პუბლიკაციის სრული ტექსტი *</label>
                      <textarea
                        id="admin-hub-content"
                        rows={6}
                        value={hubContent}
                        onChange={(e) => setHubContent(e.target.value)}
                        placeholder="შეიყვანეთ პოსტის სრული ტექსტი..."
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-sans focus:outline-hidden"
                        required
                      />
                    </div>

                    <div className="flex justify-end space-x-2">
                      <button
                        id="admin-hub-cancel"
                        type="button"
                        onClick={() => {
                          setShowHubForm(false);
                          setEditHubItemId(null);
                          setHubTitle('');
                          setHubSummary('');
                          setHubContent('');
                          setHubCover('');
                          setHubDeadline('');
                          setHubLocation('');
                          setHubSalary('');
                          setHubReqs('');
                          setHubTrainingButtonText('');
                          setHubTrainingButtonLink('');
                          setHubCustomUrl('');
                          setTrainingButtonValidationError('');
                          setHubAdditionalImages([]);
                        }}
                        className="px-4 py-2 bg-white text-slate-600 border border-slate-200 rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        გაუქმება
                      </button>
                      <button
                        id="admin-hub-submit"
                        type="submit"
                        className="px-5 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                      >
                        {editHubItemId ? 'შენახვა' : 'შექმნა'}
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
                            <span className="bg-slate-200/60 text-slate-700 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md">
                              {item.category === 'news' ? 'ბლოგი' : item.category === 'training' ? 'ტრენინგი' : item.category === 'contest' ? 'კონკურსი' : item.category === 'general' ? 'სხვადასხვა' : 'ვაკანსია'}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">გამოქვეყნდა: {item.date}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        {onReorderHubItem && (
                          <div className="flex space-x-1 border-r border-slate-200 pr-2 mr-1">
                            <button
                              type="button"
                              onClick={() => onReorderHubItem(item.id, 'up')}
                              className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md cursor-pointer transition-colors"
                              title="ზემოთ გადანაცვლება"
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onReorderHubItem(item.id, 'down')}
                              className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md cursor-pointer transition-colors"
                              title="ქვემოთ გადანაცვლება"
                            >
                              <ArrowDown className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setEditHubItemId(item.id);
                            setHubCat(item.category);
                            setHubTitle(item.title);
                            setHubSummary(item.summary);
                            setHubContent(item.content);
                            setHubCover(item.coverImage);
                            setHubDeadline(item.deadline || '');
                            setHubLocation(item.location || '');
                            setHubSalary(item.salaryRange || '');
                            setHubReqs(item.requirements ? item.requirements.join('\n') : '');
                            setHubTrainingButtonText(item.trainingButtonText || '');
                            setHubTrainingButtonLink(item.trainingButtonLink || '');
                            setHubCustomUrl(item.customUrl || '');
                            setTrainingButtonValidationError('');
                            setHubAdditionalImages(item.additionalImages || []);
                            setShowHubForm(true);
                            // Scroll to form smoothly
                            document.getElementById('admin-hub-form')?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg cursor-pointer transition-colors"
                          title="რედაქტირება"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          id={`admin-hub-delete-${item.id}`}
                          onClick={() => onDeleteHubItem(item.id)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg cursor-pointer transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
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
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest flex items-center">
                              <Send className="h-3 w-3 mr-1" /> SMTP STATUS: SENT
                            </span>
                            <span className="text-[10px] text-slate-400">| {ml.timestamp}</span>
                          </div>
                          {onDeleteEmail && (
                            <button
                              type="button"
                              onClick={() => onDeleteEmail(ml.id)}
                              className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                              title="ჟურნალიდან წაშლა"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
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

                  const footerTextUnderLogo = formData.get('footerTextUnderLogo') as string;
                  const stat1Value = formData.get('stat1Value') as string;
                  const stat1Label = formData.get('stat1Label') as string;
                  const stat2Value = formData.get('stat2Value') as string;
                  const stat2Label = formData.get('stat2Label') as string;
                  const stat3Value = formData.get('stat3Value') as string;
                  const stat3Label = formData.get('stat3Label') as string;
                  const stat4Value = formData.get('stat4Value') as string;
                  const stat4Label = formData.get('stat4Label') as string;

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
                    invoiceFooter,
                    footerTextUnderLogo,
                    stat1Value,
                    stat1Label,
                    stat2Value,
                    stat2Label,
                    stat3Value,
                    stat3Label,
                    stat4Value,
                    stat4Label,
                    seoTitle,
                    seoDescription,
                    seoKeywords,
                    seoImage,
                    seoGoogleAnalytics,
                    seoRobotIndex
                  });
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

                  {/* Part C: Design & Homepage Statistics */}
                  <div className="space-y-4 pt-4 border-t border-slate-150">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest font-sans border-b border-slate-150 pb-2 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-505 bg-purple-500" />
                      3. საიტის ფუტერი & მთავარი გვერდის სტატისტიკა
                    </h3>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">ფუტერის ტექსტი ლოგოს ქვეშ *</label>
                      <textarea
                        rows={2}
                        name="footerTextUnderLogo"
                        defaultValue={bookingSettings?.footerTextUnderLogo ?? 'განათლების, ტექნოლოგიების, კარიერული ზრდისა და კულტურული განვითარების ცენტრი ქალაქ ფოთში. შემოგვიერთდი და მიიღე მონაწილეობა ჰაბის აქტივობებში.'}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-sans focus:outline-hidden resize-none"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {/* Stat 1 */}
                      <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-2">
                        <span className="block text-[10px] text-slate-400 font-bold uppercase">სტატისტიკა #1</span>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 mb-0.5">მნიშვნელობა</label>
                          <input
                            type="text"
                            name="stat1Value"
                            defaultValue={bookingSettings?.stat1Value ?? '4+'}
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold font-sans"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 mb-0.5">დასახელება</label>
                          <input
                            type="text"
                            name="stat1Label"
                            defaultValue={bookingSettings?.stat1Label ?? 'თანამედროვე სივრცე'}
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-sans"
                            required
                          />
                        </div>
                      </div>

                      {/* Stat 2 */}
                      <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-2">
                        <span className="block text-[10px] text-slate-400 font-bold uppercase">სტატისტიკა #2</span>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 mb-0.5">მნიშვნელობა</label>
                          <input
                            type="text"
                            name="stat2Value"
                            defaultValue={bookingSettings?.stat2Value ?? '2k+'}
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold font-sans"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 mb-0.5">დასახელება</label>
                          <input
                            type="text"
                            name="stat2Label"
                            defaultValue={bookingSettings?.stat2Label ?? 'აქტიური წევრი'}
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-sans"
                            required
                          />
                        </div>
                      </div>

                      {/* Stat 3 */}
                      <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-2">
                        <span className="block text-[10px] text-slate-400 font-bold uppercase">სტატისტიკა #3</span>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 mb-0.5">მნიშვნელობა</label>
                          <input
                            type="text"
                            name="stat3Value"
                            defaultValue={bookingSettings?.stat3Value ?? '100%'}
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold font-sans"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 mb-0.5">დასახელება</label>
                          <input
                            type="text"
                            name="stat3Label"
                            defaultValue={bookingSettings?.stat3Label ?? 'მხარდაჭერა'}
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-sans"
                            required
                          />
                        </div>
                      </div>

                      {/* Stat 4 */}
                      <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-2">
                        <span className="block text-[10px] text-slate-400 font-bold uppercase">სტატისტიკა #4</span>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 mb-0.5">მნიშვნელობა</label>
                          <input
                            type="text"
                            name="stat4Value"
                            defaultValue={bookingSettings?.stat4Value ?? '12+'}
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold font-sans"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 mb-0.5">დასახელება</label>
                          <input
                            type="text"
                            name="stat4Label"
                            defaultValue={bookingSettings?.stat4Label ?? 'მიმდინარე პროექტი'}
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-sans"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Part D: SEO & Meta Integration (Social Share Customizer with Live Preview) */}
                  <div className="space-y-6 pt-6 border-t border-slate-150">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-150 pb-3">
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest font-sans flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        4. SEO ოპტიმიზაცია & სოციალური ქსელის ლინკები (OG Tags)
                      </h3>
                      <span className="bg-emerald-50 text-emerald-700 text-[10px] font-mono px-2 py-0.5 rounded-lg border border-emerald-100 font-bold">
                        Live Preview Engine Active
                      </span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      {/* Left Side: SEO Controls */}
                      <div className="lg:col-span-6 space-y-4">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="block text-xs font-bold text-slate-500">საიტის SEO სათაური (Meta Title) *</label>
                            <span className={`text-[10px] font-mono ${seoTitle.length > 60 ? 'text-rose-500 font-bold' : 'text-slate-400'}`}>
                              {seoTitle.length} / 60 სიმბოლო
                            </span>
                          </div>
                          <input
                            type="text"
                            name="seoTitle"
                            value={seoTitle}
                            onChange={(e) => setSeoTitle(e.target.value)}
                            placeholder="მაგ: ფოთის ახალგაზრდული ჰაბი | Poti Youth Hub"
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-sans focus:outline-hidden font-medium"
                            required
                          />
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="block text-xs font-bold text-slate-500">საიტის მოკლე აღწერა (Meta Description) *</label>
                            <span className={`text-[10px] font-mono ${seoDescription.length > 160 ? 'text-amber-600 font-bold' : 'text-slate-400'}`}>
                              {seoDescription.length} / 160 სიმბოლო
                            </span>
                          </div>
                          <textarea
                            rows={3}
                            name="seoDescription"
                            value={seoDescription}
                            onChange={(e) => setSeoDescription(e.target.value)}
                            placeholder="შეიყვანეთ საძიებო სისტემისთვის განკუთვნილი აღწერა..."
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-sans focus:outline-hidden resize-none leading-relaxed"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">საძიებო სიტყვები (Meta Keywords) - მძიმით გამოყოფილი</label>
                          <input
                            type="text"
                            name="seoKeywords"
                            value={seoKeywords}
                            onChange={(e) => setSeoKeywords(e.target.value)}
                            placeholder="ფოთი, ჰაბი, ახალგაზრდობა, რობოტიქსი, ტრენინგი..."
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-sans focus:outline-hidden"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">გასაზიარებელი სურათის ლინკი (Share/OG Image URL) *</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              name="seoImage"
                              value={seoImage}
                              onChange={(e) => setSeoImage(e.target.value)}
                              placeholder="https://images.unsplash.com/... ან ატვირთული ფოტოს ლინკი"
                              className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-sans focus:outline-hidden font-mono"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setSeoImage('https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&h=630&q=80')}
                              className="px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-colors shrink-0 whitespace-nowrap"
                              title="Default-ზე დაბრუნება"
                            >
                              სტანდარტული
                            </button>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1">ეს სურათი გამოჩნდება Facebook, LinkedIn, Viber, Telegram და სხვა სოციალურ ქსელებში საიტის ბმულის გაზიარებისას. რეკომენდებული ზომა: 1200x630 პიქსელი.</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Google Analytics ID</label>
                            <input
                              type="text"
                              name="seoGoogleAnalytics"
                              value={seoGoogleAnalytics}
                              onChange={(e) => setSeoGoogleAnalytics(e.target.value)}
                              placeholder="G-XXXXXXXXXX"
                              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-hidden"
                            />
                          </div>
                          
                          <div className="flex items-center space-x-2.5 pt-5">
                            <input
                              id="seoRobotIndex"
                              type="checkbox"
                              checked={seoRobotIndex}
                              onChange={(e) => setSeoRobotIndex(e.target.checked)}
                              className="h-4 w-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer"
                            />
                            <label htmlFor="seoRobotIndex" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                              საძიებო რობოტების დაშვება (Index/Follow)
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Right Side: Live Visual Simulation Previews */}
                      <div className="lg:col-span-6 space-y-6 bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/60 font-sans">
                        
                        {/* Box 1: Google Results */}
                        <div className="space-y-2">
                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                            <Search className="h-3 w-3 text-slate-400 shrink-0" />
                            გუგლის საძიებო შედეგის სიმულაცია (Google Search Appearance)
                          </span>
                          
                          <div className="bg-white p-4 rounded-xl border border-slate-150 shadow-xs space-y-1 max-w-lg">
                            <div className="flex items-center space-x-2 text-xs text-slate-600 font-sans">
                              <span className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-mono border border-slate-200 text-slate-700 font-bold shrink-0">Y</span>
                              <div className="flex flex-col">
                                <span className="text-slate-800 text-[11px] font-sans leading-none">YHub Poti</span>
                                <span className="text-slate-400 text-[9px] font-sans leading-none mt-0.5">https://poti.yhub.ge</span>
                              </div>
                            </div>
                            
                            <h4 className="text-[15px] text-[#1a0dab] font-sans hover:underline cursor-pointer leading-tight line-clamp-1 font-medium select-none">
                              {seoTitle || 'ფოთის ახალგაზრდული ჰაბი | Poti Youth Hub'}
                            </h4>
                            
                            <p className="text-[12px] text-[#4d5156] font-sans leading-relaxed line-clamp-2 select-none">
                              {seoDescription || 'განათლების, ტექნოლოგიების, კარიერული ზრდისა და კულტურული განვითარების ცენტრი ქალაქ ფოთში...'}
                            </p>
                          </div>
                        </div>

                        {/* Box 2: Social Media Link Preview Card */}
                        <div className="space-y-2">
                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                            <Share2 className="h-3 w-3 text-slate-400 shrink-0" />
                            სოციალური ქსელის გაზიარება (Facebook, Messenger, Viber, Direct Link)
                          </span>
                          
                          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden max-w-sm">
                            {/* Simulated shared image */}
                            <div className="relative aspect-video bg-slate-900 border-b border-slate-100 flex items-center justify-center overflow-hidden">
                              {seoImage ? (
                                <img 
                                  src={seoImage} 
                                  alt="OG Link Preview" 
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover animate-fadeIn"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&h=630&q=80";
                                  }}
                                />
                              ) : (
                                <div className="text-center text-slate-400 p-4">
                                  <Eye className="h-8 w-8 mx-auto mb-1 text-slate-500 opacity-60" />
                                  <span className="text-[10px] block font-mono">სურათი არ არის</span>
                                </div>
                              )}
                              <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-xs text-[9px] text-white px-2 py-0.5 rounded-md font-mono font-bold uppercase tracking-wider select-none">
                                Link Image
                              </div>
                            </div>
                            
                            {/* Simulated share meta columns */}
                            <div className="p-3 bg-slate-50 border-t border-slate-200/50 text-left">
                              <span className="text-[9px] text-slate-400 font-mono uppercase tracking-wider block">POTI.YHUB.GE</span>
                              <h5 className="text-xs font-bold text-slate-800 line-clamp-1 mt-0.5 select-none leading-snug">
                                {seoTitle || 'ფოთის ახალგაზრდული ჰაბი'}
                              </h5>
                              <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5 leading-normal select-none">
                                {seoDescription || 'განათლების, ტექნოლოგიების, კარიერული ზრდისა და კულტურული განვითარების ცენტრი ქალაქ ფოთში...'}
                              </p>
                            </div>
                          </div>
                        </div>

                      </div>
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

        {/* Google Spreadsheet-like Detailed Grid and Report Panel */}
        {isSpreadsheetOpen && (
          <div className="fixed inset-0 z-55 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-hidden">
            <div className="bg-[#f9fbf9] rounded-2xl w-full max-w-6xl shadow-2xl flex flex-col h-[85vh] overflow-hidden border border-emerald-600/20 font-sans text-slate-800">
              
              {/* Google Sheets Header bar */}
              <div className="bg-emerald-800 text-white px-5 py-4 shrink-0 flex items-center justify-between shadow-md">
                <div className="flex items-center space-x-3.5">
                  <div className="w-9 h-9 bg-emerald-100 text-emerald-800 rounded-xl flex items-center justify-center font-black text-lg shadow-sm">
                    田
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-display font-medium text-sm text-emerald-50 tracking-tight">YHub Poti - Room Ordering & Bookings DB.xlsx</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="text-xs text-emerald-100 font-mono hidden sm:inline mr-2">ბოლო რედაქტირება: წამების წინ</span>
                  <button
                    onClick={() => setIsSpreadsheetOpen(false)}
                    className="p-1.5 bg-emerald-900/40 hover:bg-emerald-950 text-emerald-100 hover:text-white rounded-lg cursor-pointer transition-colors"
                    title="ცხრილის დახურვა"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Toolbar & Formula Bar */}
              <div className="bg-slate-50 border-b border-slate-200 p-2.5 shrink-0 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                {/* Spreadsheet formulas indicator and action utilities */}
                <div className="flex items-center space-x-2 w-full md:w-auto">
                  <div className="bg-slate-200/80 px-2.5 py-1 rounded-md text-[11px] font-mono text-slate-500 flex items-center">
                    <span className="font-bold text-slate-700 mr-1">Cell:</span> 
                    <span>{activeCell ? `${activeCell.field.toUpperCase().substring(0,2)}${activeCell.id.substring(0,3)}` : 'N/A'}</span>
                  </div>
                  <div className="text-slate-400 font-mono text-xs px-1">fx</div>
                  <input
                    type="text"
                    readOnly
                    value={activeCell 
                      ? spreadsheetTab === 'rooms' 
                        ? `=${activeCell.field.toUpperCase()}(Room:${activeCell.id.substring(0,4)}) = "${sheetRooms.find(r => r.id === activeCell.id)?.[activeCell.field] || ''}"`
                        : `=${activeCell.field.toUpperCase()}(Booking:${activeCell.id.substring(0,4)}) = "${sheetBookings.find(b => b.id === activeCell.id)?.[activeCell.field] || ''}"`
                      : spreadsheetTab === 'rooms'
                        ? `=SUM(Room_Earnings: ₾${sheetRooms.reduce((acc, r) => acc + Number(r.earnings || 0), 0)})`
                        : `=SUM(Approved_Bookings_Cash: ₾${sheetBookings.filter(b=>b.status==='approved').reduce((acc, b) => acc + Number(b.totalPrice || 0), 0)})`
                    }
                    className="flex-1 bg-white border border-slate-200 px-3 py-1 rounded-lg text-xs font-mono font-medium focus:outline-hidden text-slate-700"
                    placeholder="ფორმულის ველი"
                  />
                </div>

                {/* Database Operations buttons */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleExportCSV}
                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-black rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer shadow-xs uppercase tracking-wider"
                    title="მოხსენების ჩამოტვირთვა Excel-ის ფორმატში"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>ექსპორტი Excel-ში (.xls)</span>
                  </button>
                  {spreadsheetTab === 'rooms' && (
                    <button
                      onClick={handleSyncSpreadsheet}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer shadow-xs uppercase tracking-wider animate-pulse-subtle"
                      title="სინქრონიზაცია მონაცემთა ბაზასთან"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>ბაზაში შენახვა / სინქრონიზაცია</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Sheet navigation tabs at top */}
              <div className="bg-slate-100/80 px-4 py-1.5 border-b border-slate-200 flex space-x-1.5 shrink-0 select-none">
                <button
                  onClick={() => setSpreadsheetTab('rooms')}
                  className={`px-3 py-1 text-xs font-black rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 ${
                    spreadsheetTab === 'rooms'
                      ? 'bg-white text-emerald-80 border border-slate-200 font-bold shadow-xs'
                      : 'text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  <span className="text-[#107c41]">田</span>
                  <span>ფურცელი 1: ოთახები & რიგითობა</span>
                </button>
                <button
                  onClick={() => setSpreadsheetTab('bookings')}
                  className={`px-3 py-1 text-xs font-black rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 ${
                    spreadsheetTab === 'bookings'
                      ? 'bg-white text-emerald-80 border border-slate-200 font-bold shadow-xs'
                      : 'text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  <span className="text-blue-600">田</span>
                  <span>ფურცელი 2: ჯავშნები</span>
                </button>
              </div>

              {/* Main Spreadsheet Grid (excel format table) */}
              <div className="flex-1 overflow-auto bg-white">
                <table className="w-full text-left border-collapse table-fixed select-none">
                  {/* Alphabet column indicators (Google Spreadsheet layout) */}
                  <thead className="bg-[#f3f3f3] text-slate-500 text-[11px] font-mono leading-none border-b border-slate-200 font-bold uppercase sticky top-0 z-10">
                    <tr>
                      <th className="w-12 bg-[#e6e6e6] border-r border-[#d4d4d4] text-center font-bold text-slate-600">#</th>
                      {spreadsheetTab === 'rooms' ? (
                        <>
                          <th className="w-24 px-2 border-r border-[#d4d4d4] text-center bg-[#f3f3f3]">ოთახის ID</th>
                          <th className="w-48 px-2 border-r border-[#d4d4d4] text-center bg-[#f3f3f3]">დასახელება</th>
                          <th className="w-32 px-2 border-r border-[#d4d4d4] text-center bg-amber-50 text-amber-900 border-b-2 border-b-amber-500">რიგითობა</th>
                          <th className="w-28 px-2 border-r border-[#d4d4d4] text-center bg-emerald-50 text-emerald-900">ტევადობა</th>
                          <th className="w-32 px-2 border-r border-[#d4d4d4] text-center bg-blue-50 text-blue-900">ფასი საათში (₾)</th>
                          <th className="w-32 px-2 border-r border-[#d4d4d4] text-center bg-[#f3f3f3]">დღიური ფასი (₾)</th>
                          <th className="w-36 px-2 border-r border-[#d4d4d4] text-center bg-[#f3f3f3]">ჯავშნები</th>
                          <th className="w-36 px-2 text-center bg-[#f3f3f3]">შემოსავალი (₾)</th>
                        </>
                      ) : (
                        <>
                          <th className="w-28 px-2 border-r border-[#d4d4d4] text-center bg-[#f3f3f3]">ჯავშნის ID</th>
                          <th className="w-44 px-2 border-r border-[#d4d4d4] text-center bg-[#f3f3f3]">ოთახის დასახელება</th>
                          <th className="w-28 px-2 border-r border-[#d4d4d4] text-center bg-[#f3f3f3]">თარიღი</th>
                          <th className="w-36 px-2 border-r border-[#d4d4d4] text-center bg-[#f3f3f3]">საათები</th>
                          <th className="w-44 px-2 border-r border-[#d4d4d4] text-center bg-[#f3f3f3]">სახელი და გვარი</th>
                          <th className="w-48 px-2 border-r border-[#d4d4d4] text-center bg-[#f3f3f3]">ორგანიზაცია</th>
                          <th className="w-44 px-2 border-r border-[#d4d4d4] text-center bg-[#f3f3f3]">საკონტაქტო</th>
                          <th className="w-32 px-2 border-r border-[#d4d4d4] text-center bg-[#f3f3f3]">თანხა (₾)</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  
                  <tbody className="divide-y divide-[#e1e1e1] text-xs font-sans">
                    {spreadsheetTab === 'rooms' ? (
                      sheetRooms.map((sr, idx) => (
                        <tr key={sr.id} className="hover:bg-slate-50/50 align-middle h-9">
                          {/* Row Indicator */}
                          <td className="bg-[#f3f3f3] border-r border-[#d4d4d4] text-center text-[10px] font-mono font-black text-slate-500">
                            {idx + 2}
                          </td>
                          {/* Room ID (Read Only) */}
                          <td className="px-3 border-r border-[#e1e1e1] font-mono text-[10px] font-semibold text-[#107c41]">
                            {sr.id.substring(0, 8)}...
                          </td>
                          {/* Room Name (Read Only) */}
                          <td className="px-3 border-r border-[#e1e1e1] font-bold text-slate-900 truncate">
                            {sr.name}
                          </td>
                          {/* Editable Order (Priority) */}
                          <td className={`p-0 border-r border-[#e1e1e1] text-center bg-amber-50/30 ${activeCell?.id === sr.id && activeCell?.field === 'order' ? 'ring-2 ring-amber-500 z-10' : ''}`}>
                            <input
                              type="number"
                              value={sr.order}
                              onChange={(e) => handleUpdateSheetRoom(sr.id, 'order', e.target.value)}
                              onFocus={() => setActiveCell({ id: sr.id, field: 'order' })}
                              className="w-full h-full border-0 focus:outline-hidden px-3 text-center text-xs font-black font-mono text-amber-800 bg-transparent transition-colors"
                            />
                          </td>
                          {/* Editable Capacity */}
                          <td className={`p-0 border-r border-[#e1e1e1] text-center bg-emerald-50/20 ${activeCell?.id === sr.id && activeCell?.field === 'capacity' ? 'ring-2 ring-emerald-500 z-10' : ''}`}>
                            <input
                              type="number"
                              value={sr.capacity}
                              onChange={(e) => handleUpdateSheetRoom(sr.id, 'capacity', e.target.value)}
                              onFocus={() => setActiveCell({ id: sr.id, field: 'capacity' })}
                              className="w-full h-full border-0 focus:outline-hidden px-3 text-center text-xs font-bold font-mono text-emerald-800 bg-transparent"
                            />
                          </td>
                          {/* Editable Hourly Price */}
                          <td className={`p-0 border-r border-[#e1e1e1] text-right bg-blue-50/20 ${activeCell?.id === sr.id && activeCell?.field === 'price' ? 'ring-2 ring-blue-500 z-10' : ''}`}>
                            <div className="flex items-center justify-end px-2.5 h-full">
                              <span className="text-slate-400 font-mono scale-90 mr-0.5">₾</span>
                              <input
                                type="number"
                                value={sr.price}
                                onChange={(e) => handleUpdateSheetRoom(sr.id, 'price', e.target.value)}
                                onFocus={() => setActiveCell({ id: sr.id, field: 'price' })}
                                className="w-14 border-0 focus:outline-hidden text-right text-xs font-bold font-mono text-slate-800 bg-transparent"
                              />
                            </div>
                          </td>
                          {/* Editable Day Price */}
                          <td className={`p-0 border-r border-[#e1e1e1] text-right ${activeCell?.id === sr.id && activeCell?.field === 'dayPrice' ? 'ring-2 ring-emerald-500 z-10' : ''}`}>
                            <div className="flex items-center justify-end px-2.5 h-full">
                              <span className="text-slate-400 font-mono scale-90 mr-0.5">₾</span>
                              <input
                                type="number"
                                value={sr.dayPrice}
                                onChange={(e) => handleUpdateSheetRoom(sr.id, 'dayPrice', e.target.value)}
                                onFocus={() => setActiveCell({ id: sr.id, field: 'dayPrice' })}
                                className="w-16 border-0 focus:outline-hidden text-right text-xs font-medium font-mono text-slate-700 bg-transparent"
                              />
                            </div>
                          </td>
                          {/* Bookings Count (Read Only) */}
                          <td className="px-3 border-r border-[#e1e1e1] text-center font-mono font-bold text-slate-500">
                            {sr.bookingsCount} ჯავშანი
                          </td>
                          {/* Earnings (Read Only formula calculation) */}
                          <td className="px-3 text-right font-mono font-black text-slate-900 bg-slate-50/40">
                            ₾{sr.earnings}.00
                          </td>
                        </tr>
                      ))
                    ) : (
                      sheetBookings.map((b, idx) => (
                        <tr key={b.id} className="hover:bg-slate-50/50 align-middle h-9">
                          <td className="bg-[#f3f3f3] border-r border-[#d4d4d4] text-center text-[10px] font-mono font-black text-slate-500">
                            {idx + 2}
                          </td>
                          <td className="px-3 border-r border-[#e1e1e1] font-mono text-[10px] font-bold text-slate-600">
                            RSV-{b.id.substring(0, 6)}
                          </td>
                          <td className="px-3 border-r border-[#e1e1e1] font-bold text-slate-800 truncate">
                            {b.roomName}
                          </td>
                          <td className="px-3 border-r border-[#e1e1e1] font-mono text-[10.5px] text-slate-600 truncate">
                            {b.date}
                          </td>
                          <td className="px-3 border-r border-[#e1e1e1] font-sans text-[11px] text-slate-500 truncate">
                            {b.durationHours}
                          </td>
                          <td className="px-3 border-r border-[#e1e1e1] font-medium text-slate-900 truncate">
                            {b.firstName} {b.lastName}
                          </td>
                          <td className="px-3 border-r border-[#e1e1e1] font-medium text-[#107c41] truncate" title={b.organization}>
                            {b.organization || '-'}
                          </td>
                          <td className="px-3 border-r border-[#e1e1e1] font-mono text-[10px] text-slate-500 truncate">
                            {b.phone}
                          </td>
                          <td className={`px-3 text-right font-mono font-black ${b.status === 'approved' ? 'text-emerald-700 bg-emerald-50/10' : 'text-slate-400'}`}>
                            ₾{b.totalPrice}.00
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {/* Spreadsheet formulas and summaries row */}
                  <tfoot className="bg-[#f3f3f3] border-t-2 border-[#d4d4d4] font-mono text-xs font-black shadow-inner sticky bottom-0 z-10 leading-none h-10">
                    {spreadsheetTab === 'rooms' ? (
                      <tr>
                        <td className="bg-[#e6e6e6] border-r border-[#d4d4d4]"></td>
                        <td className="px-3 border-r border-[#e1e1e1] text-[#107c41]">AVERAGE</td>
                        <td className="px-3 border-r border-[#e1e1e1]">საშუალო მაჩვენებლები ➔</td>
                        <td className="px-3 border-r border-[#e1e1e1]"></td>
                        <td className="px-3 border-r border-[#e1e1e1] text-center font-bold text-[#107c41]">
                          {Math.round(sheetRooms.reduce((acc, r) => acc + Number(r.capacity || 0), 0) / Math.max(1, sheetRooms.length))} / ოთახზე
                        </td>
                        <td className="px-3 border-r border-[#e1e1e1] text-right text-blue-800">
                          ₾{Math.round(sheetRooms.reduce((acc, r) => acc + Number(r.price || 0), 0) / Math.max(1, sheetRooms.length))}
                        </td>
                        <td className="px-3 border-r border-[#e1e1e1]"></td>
                        <td className="px-3 border-r border-[#e1e1e1] text-center text-slate-600">ჯამური ბრუნვა (SUM) ➜</td>
                        <td className="px-3 text-right text-[#107c41] bg-emerald-50/30 text-xs font-black ring-1 ring-emerald-300">
                          ₾{sheetRooms.reduce((acc, r) => acc + Number(r.earnings || 0), 0)}.00
                        </td>
                      </tr>
                    ) : (
                      <tr>
                        <td className="bg-[#e6e6e6] border-r border-[#d4d4d4]"></td>
                        <td className="px-3 border-r border-[#e1e1e1] text-slate-500">SUM = {sheetBookings.length} ჯავშანი</td>
                        <td className="px-3 border-r border-[#e1e1e1]"></td>
                        <td className="px-3 border-r border-[#e1e1e1]"></td>
                        <td className="px-3 border-r border-[#e1e1e1]"></td>
                        <td className="px-3 border-r border-[#e1e1e1]"></td>
                        <td className="px-3 border-r border-[#e1e1e1]"></td>
                        <td className="px-3 border-r border-[#e1e1e1] text-right text-slate-600 pr-4 font-sans">დამტკიცებული ჯამი:</td>
                        <td className="px-3 text-right text-emerald-700 bg-emerald-50/30 font-black ring-1 ring-emerald-300">
                          ₾{sheetBookings.filter(b=>b.status==='approved').reduce((acc, b) => acc + Number(b.totalPrice || 0), 0)}.00
                        </td>
                      </tr>
                    )}
                  </tfoot>
                </table>
              </div>

              {/* Status footer bar */}
              <div className="bg-[#f3f3f3] border-t border-slate-200 px-5 py-2.5 shrink-0 flex items-center justify-between text-[11px] text-slate-550 select-none">
                <div className="flex items-center space-x-4">
                  <span className="flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="font-bold text-[#107c41]">მზადაა მუშაობისთვის</span>
                  </span>
                  <span>თავსებადობა: Excel, Google Sheets, CSV formatters</span>
                </div>
                <div className="flex items-center space-x-2.5 font-mono">
                  <span>ხაზები: {spreadsheetTab === 'rooms' ? sheetRooms.length + 1 : sheetBookings.length + 1}</span>
                  <span>სვეტები: 9</span>
                  <span>SUM(Earnings) = ₾{spreadsheetTab === 'rooms' ? sheetRooms.reduce((acc, r) => acc + Number(r.earnings || 0), 0) : sheetBookings.reduce((acc, b) => acc + Number(b.totalPrice || 0), 0)}</span>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Dynamic PDF-Invoice Simulation overlay rendering modal */}
        {selectedInvoiceBooking && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex justify-center items-center p-4 overflow-y-auto">
            <style dangerouslySetInnerHTML={{ __html: `
              @media print {
                body * {
                  visibility: hidden !important;
                }
                #print-invoice-sheet, #print-invoice-sheet * {
                  visibility: visible !important;
                }
                #print-invoice-sheet {
                  position: absolute !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 100% !important;
                  max-width: 100% !important;
                  margin: 0 !important;
                  padding: 8mm !important;
                  box-shadow: none !important;
                  border: none !important;
                  background: white !important;
                }
                * {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
              }
            `}} />
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
              <div className="mt-8 pt-4 border-t border-slate-150 flex flex-col items-end space-y-2">
                <div className="flex flex-wrap gap-2 justify-end w-full">
                  <button
                    id="invoice-download-xls-btn"
                    onClick={handleDownloadXls}
                    className="p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl border border-emerald-200 cursor-pointer transition-colors flex items-center justify-center shadow-xs"
                    title="XLS-ის ჩამოტვირთვა (Excel)"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                  </button>
                  <button
                    id="invoice-print-btn"
                    onClick={handlePrintInvoice}
                    className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 transition-colors"
                  >
                    <Printer className="h-4 w-4" />
                    <span>ბეჭდვა / PDF შენახვა</span>
                  </button>
                  <button
                    id="invoice-back-btn"
                    onClick={() => setSelectedInvoiceBooking(null)}
                    className="px-4 py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    უკან დაბრუნება
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 text-right w-full">
                  💡 რჩევა: PDF ფაილის ჩამოსატვირთად აირჩიეთ <b>"Save as PDF" (PDF-ად შენახვა)</b> ბეჭდვის ფანჯარაში
                </p>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
