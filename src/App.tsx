/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import HubContent from './components/HubContent';
import GallerySection from './components/GallerySection';
import RoomBooking from './components/RoomBooking';
import AdminPanel from './components/AdminPanel';
import HubItemPage from './components/HubItemPage';
import { Room, Booking, CustomQuestion, HubItem, MediaItem } from './types';
// @ts-ignore
import heroBg from './assets/images/hero_bg_1779452320998.png';
// @ts-ignore
import logoImg from './assets/images/small-logo.png';

import { 
  INITIAL_ROOMS, 
  INITIAL_HUB_ITEMS, 
  INITIAL_MEDIA_ITEMS, 
  DEFAULT_CUSTOM_QUESTIONS, 
  INITIAL_BOOKINGS 
} from './mockData';

import { 
  Compass, Users, Calendar, Award, MapPin, Mail, Phone, Anchor, ArrowDown, HelpCircle, ShieldCheck, ShieldAlert, X, ArrowUp, MessageCircle, Facebook
} from 'lucide-react';

// Live Firestore integration imports
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, loginWithGoogle, OperationType, sanitizeForFirestore } from './firebase';
import { apiClient } from './utils/apiClient';

import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();

  const shouldScrollToNews = useRef(false);

  // Derived state directly from URL pathname
  const currentTab = location.pathname.startsWith('/admin') ? 'admin' : 'user';
  
  let activeSection = 'news';
  if (location.pathname === '/booking') {
    activeSection = 'booking';
  } else if (location.pathname === '/gallery') {
    activeSection = 'gallery';
  } else if (location.pathname === '/admin') {
    activeSection = 'admin';
  }

  const handleNavigate = (sec: string) => {
    if (sec === 'home') {
      if (location.pathname === '/') {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      } else {
        navigate('/');
      }
      return;
    }

    if (sec === 'news') {
      if (location.pathname === '/') {
        const el = document.getElementById('news');
        if (el) {
          const headerOffset = 90;
          const elementPosition = el.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      } else {
        shouldScrollToNews.current = true;
        navigate('/');
      }
    } else {
      navigate(`/${sec}`);
    }
  };

  // Authenticated state
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Core databases initialized via fallback defaults initially
  const [rooms, setRooms] = useState<Room[]>(INITIAL_ROOMS);
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);
  const [customQuestions, setCustomQuestions] = useState<CustomQuestion[]>(DEFAULT_CUSTOM_QUESTIONS);
  const [hubItems, setHubItems] = useState<HubItem[]>(INITIAL_HUB_ITEMS);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>(INITIAL_MEDIA_ITEMS);
  const [bookingSettings, setBookingSettings] = useState({
    fullDayDiscount: 10,
    multiDayDiscount: 15,
    hubAddress: 'გიორგი წერეთლის ქუჩა #12, ფოთი, საქართველო',
    hubEmail: 'yhub.poti@gmail.com',
    hubPhone: '+995 599 123 456',
    hubWorkHours: 'ორშაბათი - პარასკევი: 10:00 - 20:00',
    chatFacebook: 'https://facebook.com/PotiYouthHub/',
    chatWhatsapp: 'https://wa.me/995599123456',
    chatEmail: 'yhub.poti@gmail.com',
    chatPhone: '+995599123456',
    invoiceTitle: 'ინვოისი მომსახურებაზე',
    invoiceOrgName: 'ფოთის ახალგაზრდული ჰაბი',
    invoiceBankName: 'საქართველოს ბანკი',
    invoiceIban: 'GE90BG0000000123456789',
    invoiceFooter: 'გმადლობთ, რომ სარგებლობთ ახალგაზრდული ჰაბის სივრცით!',
    footerTextUnderLogo: 'განათლების, ტექნოლოგიების, კარიერული ზრდისა და კულტურული განვითარების ცენტრი ქალაქ ფოთში. შემოგვიერთდი და მიიღე მონაწილეობა ჰაბის აქტივობებში.',
    stat1Value: '4+',
    stat1Label: 'თანამედროვე სივრცე',
    stat2Value: '2k+',
    stat2Label: 'აქტიური წევრი',
    stat3Value: '100%',
    stat3Label: 'მხარდაჭერა',
    stat4Value: '12+',
    stat4Label: 'მიმდინარე პროექტი',
    seoTitle: 'ფოთის ახალგაზრდული ჰაბი | Poti Youth Hub',
    seoDescription: 'განათლების, ტექნოლოგიების, კარიერული ზრდისა და კულტურული განვითარების ცენტრი ქალაქ ფოთში. შემოგვიერთდი და მიიღე მონაწილეობა ჰაბის აქტივობებში.',
    seoKeywords: 'ფოთი, ახალგაზრდობა, ჰაბი, ტრენინგი, კარიერა, სივრცე',
    seoImage: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&h=630&q=80',
    seoGoogleAnalytics: 'G-XXXXXXXXXX',
    seoRobotIndex: true
  });

  // Tracking individual visitors' guest bookings submissions globally
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  // Floating chat toggle state
  const [chatOpen, setChatOpen] = useState(false);

  // Emails tracking state
  const [emails, setEmails] = useState<any[]>([]);

  // Custom confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const triggerConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Custom banner notification state
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
    id: string;
  } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message, type, id: Math.random().toString() });
  };

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Detect genuine Admin permissions
  const isSystemAdmin = user?.email === 'yhub.poti@gmail.com';

  // Scroll to top on route changes
  useEffect(() => {
    if (shouldScrollToNews.current) {
      shouldScrollToNews.current = false;
      const timer = setTimeout(() => {
        const el = document.getElementById('news');
        if (el) {
          const headerOffset = 90;
          const elementPosition = el.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }, 150);
      return () => clearTimeout(timer);
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [location.pathname]);

  // 1. Authenticate check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Backend Data Loader (Dual local Storage and cPanel SQL API)
  const [loadingData, setLoadingData] = useState(true);

  const loadAllData = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const payload = await apiClient.getAllData(token, submittedId || undefined);
      
      if (payload.rooms && payload.rooms.length > 0) {
        setRooms(payload.rooms);
      } else {
        setRooms(INITIAL_ROOMS);
      }
      
      if (payload.customQuestions && payload.customQuestions.length > 0) {
        setCustomQuestions(payload.customQuestions);
      } else {
        setCustomQuestions(DEFAULT_CUSTOM_QUESTIONS);
      }
      
      if (payload.hubItems && payload.hubItems.length > 0) {
        setHubItems(payload.hubItems);
      } else {
        setHubItems(INITIAL_HUB_ITEMS);
      }
      
      if (payload.mediaItems && payload.mediaItems.length > 0) {
        setMediaItems(payload.mediaItems);
      } else {
        setMediaItems(INITIAL_MEDIA_ITEMS);
      }
      
      if (payload.bookingSettings && Object.keys(payload.bookingSettings).length > 0) {
        setBookingSettings(prev => ({
          ...prev,
          ...payload.bookingSettings
        }));
      }
      
      setBookings(payload.bookings || []);
      setEmails(payload.emails || []);
    } catch (err) {
      console.warn("API load error, carrying on with fallbacks.", err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      loadAllData();
    }
  }, [user, authLoading, submittedId]);

  // Dynamic Browser Tab / SEO Meta Tag Injection
  useEffect(() => {
    // 1. Update document title
    if (bookingSettings.seoTitle) {
      document.title = bookingSettings.seoTitle;
    }

    // 2. Update/create Helper for meta tag updates
    const updateOrCreateMeta = (nameAttr: string, value: string, isProperty: boolean = false) => {
      const attrName = isProperty ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attrName}="${nameAttr}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attrName, nameAttr);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', value);
    };

    if (bookingSettings.seoDescription) {
      updateOrCreateMeta('description', bookingSettings.seoDescription);
      updateOrCreateMeta('og:description', bookingSettings.seoDescription, true);
    }
    if (bookingSettings.seoKeywords) {
      updateOrCreateMeta('keywords', bookingSettings.seoKeywords);
    }
    if (bookingSettings.seoTitle) {
      updateOrCreateMeta('og:title', bookingSettings.seoTitle, true);
    }
    if (bookingSettings.seoImage) {
      updateOrCreateMeta('og:image', bookingSettings.seoImage, true);
    }
    updateOrCreateMeta('robots', bookingSettings.seoRobotIndex ? 'index, follow' : 'noindex, nofollow');

    // 3. Dynamic Google Analytics Injection
    if (bookingSettings.seoGoogleAnalytics && bookingSettings.seoGoogleAnalytics !== 'G-XXXXXXXXXX') {
      const gId = bookingSettings.seoGoogleAnalytics;
      // Check if tag already exists
      const existingScript = document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${gId}"]`);
      if (!existingScript) {
        const scEl = document.createElement('script');
        scEl.async = true;
        scEl.src = `https://www.googletagmanager.com/gtag/js?id=${gId}`;
        document.head.appendChild(scEl);

        const configSc = document.createElement('script');
        configSc.innerHTML = `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gId}');
        `;
        document.head.appendChild(configSc);
      }
    }
  }, [bookingSettings.seoTitle, bookingSettings.seoDescription, bookingSettings.seoKeywords, bookingSettings.seoImage, bookingSettings.seoRobotIndex, bookingSettings.seoGoogleAnalytics]);



  // Mutative Action handlers syncing live writes directly to backend API
  const handleAddBooking = async (newBookingData: Omit<Booking, 'id' | 'createdAt' | 'status'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    try {
      await apiClient.addBooking(newBookingData, id);
      setSubmittedId(id);
      showNotification('ჯავშნის მოთხოვნა წარმატებით გაიგზავნა', 'success');
      loadAllData();
    } catch (err) {
      console.error("Booking error:", err);
      showNotification('ჯავშნის გაგზავნა ვერ მოხერხდა', 'error');
    }
  };

  const handleAddRoom = async (room: Room) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      await apiClient.addRoom(room, token || '');
      showNotification('ოთახი წარმატებით დაემატა', 'success');
      loadAllData();
    } catch (err) {
      console.error("Add room error:", err);
      showNotification('ოთახის დამატება ვერ მოხერხდა', 'error');
    }
  };

  const handleUpdateRoom = async (updatedRoom: Room) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      await apiClient.updateRoom(updatedRoom, token || '');
      showNotification('ოთახი წარმატებით განახლდა', 'success');
      loadAllData();
    } catch (err) {
      console.error("Update room error:", err);
      showNotification('ოთახის განახლება ვერ მოხერხდა', 'error');
    }
  };

  const handleDeleteRoom = (id: string) => {
    triggerConfirm(
      'ოთახის წაშლა',
      'ნამდვილად გსურთ ამ ოთახის წაშლა?',
      async () => {
        try {
          const token = await auth.currentUser?.getIdToken();
          await apiClient.deleteRoom(id, token || '');
          showNotification('ოთახი წარმატებით წაიშალა', 'success');
          loadAllData();
        } catch (err) {
          console.error("Delete room error:", err);
          showNotification('ოთახის წაშლა ვერ მოხერხდა', 'error');
        }
      }
    );
  };

  const handleDeleteBooking = (id: string) => {
    triggerConfirm(
      'ჯავშნის წაშლა',
      'ნამდვილად გსურთ ამ ჯავშნის სამუდამოდ წაშლა? (ეს ქმედება შეუქცევადია)',
      async () => {
        try {
          const token = await auth.currentUser?.getIdToken();
          await apiClient.deleteBooking(id, token || '');
          showNotification('ჯავშანი წარმატებით წაიშალა', 'success');
          loadAllData();
        } catch (err) {
          console.error("Delete booking error:", err);
          showNotification('ჯავშნის წაშლა ვერ მოხერხდა', 'error');
        }
      }
    );
  };

  const handleReorderRoom = async (roomId: string, direction: 'up' | 'down') => {
    const currentRooms = [...rooms].sort((a, b) => {
      const orderA = a.order !== undefined ? a.order : (Number(a.id) || 999);
      const orderB = b.order !== undefined ? b.order : (Number(b.id) || 999);
      return orderA - orderB;
    });

    const index = currentRooms.findIndex(r => r.id === roomId);
    if (index === -1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentRooms.length) return;

    const itemA = { ...currentRooms[index] };
    const itemB = { ...currentRooms[targetIndex] };

    const indexOrder = itemA.order !== undefined ? itemA.order : index;
    const targetOrder = itemB.order !== undefined ? itemB.order : targetIndex;

    itemA.order = targetOrder;
    itemB.order = indexOrder;

    if (itemA.order === itemB.order) {
      if (direction === 'up') {
        itemA.order = index - 1;
        itemB.order = index;
      } else {
        itemA.order = index + 1;
        itemB.order = index;
      }
    }

    try {
      const token = await auth.currentUser?.getIdToken();
      await apiClient.updateRoom(itemA, token || '');
      await apiClient.updateRoom(itemB, token || '');
      showNotification('ოთახების თანამიმდევრობა განახლდა', 'success');
      loadAllData();
    } catch (err) {
      console.error("Reorder room error:", err);
      showNotification('თანამიმდევრობის შენახვა ვერ მოხერხდა', 'error');
    }
  };

  const handleApproveBooking = async (id: string, invoiceNum: string) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const existing = bookings.find(b => b.id === id);
      await apiClient.approveBooking(id, invoiceNum, token || '', existing, bookingSettings);
      showNotification('ჯავშანი წარმატებით დადასტურდა და ინვოისი გაიგზავნა', 'success');
      loadAllData();
    } catch (err) {
      console.error("Approve booking error:", err);
      showNotification('შეცდომა ჯავშნის დადასტურებისას', 'error');
    }
  };

  const handleRejectBooking = async (id: string, reason: string) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const existing = bookings.find(b => b.id === id);
      await apiClient.rejectBooking(id, reason, token || '', existing, bookingSettings);
      showNotification('ჯავშანი უარყოფილია', 'info');
      loadAllData();
    } catch (err) {
      console.error("Reject booking error:", err);
      showNotification('შეცდომა ჯავშნის უარყოფისას', 'error');
    }
  };

  const handleDeleteEmail = async (id: string) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      await apiClient.deleteEmail(id, token || '');
      showNotification('წერილი წარმატებით წაიშალა', 'success');
      loadAllData();
    } catch (err) {
      console.error("Delete email error:", err);
      showNotification('წერილის წაშლა ვერ მოხერხდა', 'error');
    }
  };

  const handleAddQuestion = async (q: CustomQuestion) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      await apiClient.addQuestion(q, token || '');
      showNotification('კითხვა წარმატებით დაემატა', 'success');
      loadAllData();
    } catch (err) {
      console.error("Add question error:", err);
      showNotification('კითხვის დამატება ვერ მოხერხდა', 'error');
    }
  };

  const handleDeleteQuestion = (id: string) => {
    triggerConfirm(
      'კითხვის წაშლა',
      'დარწმუნებული ხართ, რომ გსურთ კითხვის წაშლა?',
      async () => {
        try {
          const token = await auth.currentUser?.getIdToken();
          await apiClient.deleteQuestion(id, token || '');
          showNotification('კითხვა წარმატებით წაიშალა', 'success');
          loadAllData();
        } catch (err) {
          console.error("Delete question error:", err);
          showNotification('კითხვის წაშლა ვერ მოხერხდა', 'error');
        }
      }
    );
  };

  const handleAddHubItem = async (item: HubItem) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      await apiClient.addHubItem(item, token || '');
      showNotification('პოსტი წარმატებით დაემატა', 'success');
      loadAllData();
    } catch (err) {
      console.error("Add post error:", err);
      showNotification('პოსტის დამატება ვერ მოხერხდა', 'error');
    }
  };

  const handleUpdateHubItem = async (item: HubItem) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      await apiClient.updateHubItem(item, token || '');
      showNotification('პოსტი წარმატებით განახლდა', 'success');
      loadAllData();
    } catch (err) {
      console.error("Update post error:", err);
      showNotification('პოსტის განახლება ვერ მოხერხდა', 'error');
    }
  };

  const handleDeleteHubItem = (id: string) => {
    triggerConfirm(
      'პოსტის წაშლა',
      'ნამდვილად გსურთ პოსტის წაშლა?',
      async () => {
        try {
          const token = await auth.currentUser?.getIdToken();
          await apiClient.deleteHubItem(id, token || '');
          showNotification('პოსტი წარმატებით წაიშალა', 'success');
          loadAllData();
        } catch (err) {
          console.error("Delete post error:", err);
          showNotification('პოსტის წაშლა ვერ მოხერხდა', 'error');
        }
      }
    );
  };

  const handleReorderHubItem = async (itemId: string, direction: 'up' | 'down') => {
    const currentItems = [...hubItems].sort((a, b) => {
      const orderA = a.order !== undefined ? a.order : 0;
      const orderB = b.order !== undefined ? b.order : 0;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return b.date.localeCompare(a.date);
    });

    const index = currentItems.findIndex(i => i.id === itemId);
    if (index === -1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentItems.length) return;

    const itemA = { ...currentItems[index] };
    const itemB = { ...currentItems[targetIndex] };

    if (itemA.order === undefined) itemA.order = index;
    if (itemB.order === undefined) itemB.order = targetIndex;

    const tempOrder = itemA.order;
    itemA.order = itemB.order;
    itemB.order = tempOrder;

    if (itemA.order === itemB.order) {
      if (direction === 'up') {
        itemA.order = index - 1;
        itemB.order = index;
      } else {
        itemA.order = index + 1;
        itemB.order = index;
      }
    }

    try {
      const token = await auth.currentUser?.getIdToken();
      await apiClient.updateHubItem(itemA, token || '');
      await apiClient.updateHubItem(itemB, token || '');
      showNotification('პოსტების თანამიმდევრობა განახლდა', 'success');
      loadAllData();
    } catch (err) {
      console.error("Reorder post error:", err);
      showNotification('თანამიმდევრობის შენახვა ვერ მოხერხდა', 'error');
    }
  };

  const handleAddMediaItem = async (item: MediaItem) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      await apiClient.addMediaItem(item, token || '');
      showNotification('მედია წარმატებით დაემატა', 'success');
      loadAllData();
    } catch (err) {
      console.error("Add media error:", err);
      showNotification('მედიის დამატება ვერ მოხერხდა', 'error');
    }
  };

  const handleUpdateMediaItem = async (item: MediaItem) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      await apiClient.updateMediaItem(item, token || '');
      showNotification('მედია წარმატებით განახლდა', 'success');
      loadAllData();
    } catch (err) {
      console.error("Update media error:", err);
      showNotification('მედიის განახლება ვერ მოხერხდა', 'error');
    }
  };

  const handleDeleteMediaItem = (id: string) => {
    triggerConfirm(
      'მედიის წაშლა',
      'ნამდვილად გსურთ მედია ფაილის წაშლა გალერეიდან?',
      async () => {
        try {
          const token = await auth.currentUser?.getIdToken();
          await apiClient.deleteMediaItem(id, token || '');
          showNotification('მედია წარმატებით წაიშალა', 'success');
          loadAllData();
        } catch (err) {
          console.error("Delete media error:", err);
          showNotification('მედიის წაშლა ვერ მოხერხდა', 'error');
        }
      }
    );
  };

  const handleUpdateSettings = async (settings: any) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      await apiClient.updateSettings(settings, token || '');
      showNotification('პარამეტრები წარმატებით შეინახა', 'success');
      loadAllData();
    } catch (err) {
      console.error("Update settings error:", err);
      showNotification('პარამეტრების შენახვა ვერ მოხერხდა', 'error');
    }
  };

  return (
    <div className="flex flex-col min-h-screen text-slate-800 selection:bg-slate-900 selection:text-white">
      
      {/* Navigation Header */}
      <Navbar 
        currentTab={currentTab} 
        setCurrentTab={(tab) => navigate(tab === 'admin' ? '/admin' : '/')} 
        activeSection={activeSection} 
        setActiveSection={handleNavigate} 
      />

      <main className="flex-grow">
        <Routes>
          {/* Page: / (Home) */}
          <Route path="/" element={
            <div className="animate-fadeIn">
              {/* Maritime Sea-Themed Hero Banner */}
              <section className="relative bg-slate-900 py-24 sm:py-32 overflow-hidden text-white leading-snug">
                <div className="absolute inset-0 z-0 opacity-100">
                  <img 
                    src={bookingSettings.homepageBannerUrl || heroBg} 
                    alt="Background" 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div 
                  className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-brand-900/60 z-10"
                  style={{ opacity: (bookingSettings.homepageBannerOverlayOpacity !== undefined) ? (bookingSettings.homepageBannerOverlayOpacity / 100) : 0.5 }}
                />
                
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
                  <div className="max-w-3xl">
                    {/* Poti Tag Flag */}
                    <div className="inline-flex items-center space-x-2 bg-brand-500/10 border border-brand-500/20 px-3.5 py-1.5 rounded-full text-brand-300 text-xs font-bold uppercase tracking-wider mb-6">
                      <Compass className="h-4.5 w-4.5 text-brand-400 rotate-12" />
                      <span>ქალაქ ფოთის ახალგაზრდული ჰაბი</span>
                    </div>
                    
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-black leading-tight tracking-tight">
                      შენი სივრცე <br />
                      <span className="text-brand-400">განვითარებისა</span> და <span className="text-amber-400">ინოვაციებისთვის</span>.
                    </h1>
                    
                    <p className="mt-6 text-base sm:text-lg text-slate-300 font-sans leading-relaxed">
                      ადგილი სადაც მემკვიდრეობა ხვდება ახალ შესაძლებლობებს
                    </p>
                    
                    <div className="mt-10 flex flex-wrap gap-4">
                      <button 
                        onClick={() => {
                          const el = document.getElementById('home-booking');
                          if (el) {
                            el.scrollIntoView({ behavior: 'smooth' });
                          } else {
                            handleNavigate('booking');
                          }
                        }}
                        className="px-6 py-3.5 bg-white text-slate-900 font-bold rounded-xl text-sm hover:bg-slate-100 transition-colors cursor-pointer shadow-lg font-sans"
                      >
                        დაჯავშნე ოთახი
                      </button>
                      <button 
                        onClick={() => {
                          const el = document.getElementById('news');
                          if (el) {
                            el.scrollIntoView({ behavior: 'smooth' });
                          }
                        }}
                        className="px-6 py-3.5 bg-white/10 hover:bg-white/15 text-white font-semibold rounded-xl text-sm border border-white/10 transition-colors cursor-pointer font-sans"
                      >
                        გაიგე სიახლეები
                      </button>
                    </div>
                  </div>

                   {/* Hub Stats Overlay */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 pt-8 border-t border-white/10 text-center">
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                      <span className="block font-display font-black text-2xl text-white">{bookingSettings.stat1Value || '4+'}</span>
                      <span className="block text-xs text-slate-400 mt-1 uppercase font-semibold">{bookingSettings.stat1Label || 'თანამედროვე სივრცე'}</span>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                      <span className="block font-display font-black text-2xl text-white">{bookingSettings.stat2Value || '2k+'}</span>
                      <span className="block text-xs text-slate-400 mt-1 uppercase font-semibold">{bookingSettings.stat2Label || 'აქტიური წევრი'}</span>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                      <span className="block font-display font-black text-2xl text-white">{bookingSettings.stat3Value || '100%'}</span>
                      <span className="block text-xs text-slate-400 mt-1 uppercase font-semibold">{bookingSettings.stat3Label || 'მხარდაჭერა'}</span>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                      <span className="block font-display font-black text-2xl text-white">{bookingSettings.stat4Value || '12+'}</span>
                      <span className="block text-xs text-slate-400 mt-1 uppercase font-semibold">{bookingSettings.stat4Label || 'მიმდინარე პროექტი'}</span>
                    </div>
                  </div>

                </div>
              </section>

              {/* SECTION 1: News, Vacancies, Contests & Trainings CMS Grid wrapper */}
              <HubContent 
                hubItems={hubItems} 
                onNavigateToBooking={() => {
                  const el = document.getElementById('home-booking');
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    handleNavigate('booking');
                  }
                }}
              />

              {/* Embedded Room Booking Module on the Homepage */}
              <div id="home-booking" className="bg-slate-50/50 border-t border-b border-slate-100 py-16">
                <RoomBooking 
                  rooms={rooms}
                  bookings={bookings}
                  customQuestions={customQuestions}
                  onAddBooking={handleAddBooking}
                  bookingSettings={bookingSettings}
                />
              </div>
            </div>
          } />

          {/* Redirect legacy /news URL to / */}
          <Route path="/news" element={<Navigate to="/" replace />} />

          {/* Dynamic News Page: /news/:id */}
          <Route path="/news/:id" element={
            <div className="animate-fadeIn">
              <HubItemPage 
                hubItems={hubItems} 
                onNavigateToBooking={() => handleNavigate('booking')} 
              />
            </div>
          } />

          {/* Page: /booking */}
          <Route path="/booking" element={
            <div className="animate-fadeIn">
              {/* Custom header for Booking page */}
              <section className="relative bg-slate-900 py-16 sm:py-20 overflow-hidden text-white leading-snug">
                <div className="absolute inset-0 z-0 opacity-100">
                  <img 
                    src={bookingSettings.homepageBannerUrl || heroBg} 
                    alt="Background" 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div 
                  className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/95 to-brand-950/70 z-10"
                  style={{ opacity: (bookingSettings.homepageBannerOverlayOpacity !== undefined) ? (bookingSettings.homepageBannerOverlayOpacity / 100) : 0.5 }}
                />
                
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
                  <div className="max-w-3xl">
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black leading-tight tracking-tight">
                      სივრცეების <span className="text-brand-400">დაჯავშნა</span>
                    </h1>
                    <p className="mt-3 text-sm sm:text-base text-slate-300 font-sans leading-relaxed">
                      დაჯავშნეთ თქვენთვის სასურველი ოთახი, სამუშაო სივრცე თუ საკონფერენციო დარბაზი ფოთის ახალგაზრდულ ჰაბში მარტივად.
                    </p>
                  </div>
                </div>
              </section>

              {/* Rooms Booker */}
              <RoomBooking 
                rooms={rooms}
                bookings={bookings}
                customQuestions={customQuestions}
                onAddBooking={handleAddBooking}
                bookingSettings={bookingSettings}
              />
            </div>
          } />

          {/* Page: /gallery */}
          <Route path="/gallery" element={
            <div className="animate-fadeIn">
              {/* Custom header for Gallery page */}
              <section className="relative bg-slate-900 py-16 sm:py-20 overflow-hidden text-white leading-snug">
                <div className="absolute inset-0 z-0 opacity-100">
                  <img 
                    src={bookingSettings.homepageBannerUrl || heroBg} 
                    alt="Background" 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div 
                  className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/95 to-brand-950/70 z-10"
                  style={{ opacity: (bookingSettings.homepageBannerOverlayOpacity !== undefined) ? (bookingSettings.homepageBannerOverlayOpacity / 100) : 0.5 }}
                />
                
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
                  <div className="max-w-3xl">
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black leading-tight tracking-tight">
                      მედია <span className="text-amber-400">გალერეა</span>
                    </h1>
                    <p className="mt-3 text-sm sm:text-base text-slate-300 font-sans leading-relaxed">
                      დაათვალიერეთ ფოთის ახალგაზრდულ ჰაბში გამართული ღონისძიებების, ტრენინგებისა და აქტივობების ამსახველი ფოტო და ვიდეო მასალა.
                    </p>
                  </div>
                </div>
              </section>

              {/* Visual Media Gallery */}
              <GallerySection mediaItems={mediaItems} />
            </div>
          } />

          {/* Page: /admin */}
          <Route path="/admin" element={
            authLoading ? (
              <div className="flex items-center justify-center min-h-[60vh] text-slate-500 font-sans font-medium text-sm">
                იტვირთება მონაცემები...
              </div>
            ) : !isSystemAdmin ? (
              /* Beautiful Secure Login screen targeting yhub.poti@gmail.com */
              <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-16 bg-slate-50">
                 <div className="max-w-md w-full bg-white border border-slate-200 p-8 rounded-3xl shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-brand-500 to-amber-400"></div>
                    
                    <div className="text-center space-y-4">
                       <div className="mx-auto w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-800 border border-slate-200">
                          <ShieldCheck className="h-8 w-8 text-brand-600" />
                       </div>
                       
                       <h2 className="font-display font-black text-2xl text-slate-900">
                          ადმინისტრატორის მართვის პანელი
                       </h2>
                       
                       <p className="text-sm font-sans text-slate-500 leading-relaxed">
                          სისტემის პარამეტრებისა და ჯავშნების სამართავად გთხოვთ გაიაროთ ავტორიზაცია Google ანგარიშით:
                       </p>
                       
                       <div className="bg-brand-50/50 border border-brand-100 rounded-2xl p-4 text-left">
                          <span className="block text-[10px] text-brand-600 font-bold uppercase tracking-wider">ავტორიზებული ანგარიში</span>
                          <span className="block text-sm font-mono font-semibold text-slate-700 select-all mt-0.5">
                             yhub.poti@gmail.com
                          </span>
                       </div>

                       {user ? (
                         <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs font-sans text-left space-y-2 border border-rose-100">
                           <p className="font-bold">წვდომა უარყოფილია (Access Denied)</p>
                           <p>თქვენ შესული ხართ როგორც <strong>{user.email}</strong>, რაც არ წარმოადგენს სისტემის ოფიციალურ ადმინ მეილს.</p>
                           <button 
                             onClick={() => auth.signOut()}
                             className="text-xs font-semibold underline text-rose-800 hover:text-rose-950 block"
                           >
                             გამოსვლა (Sign Out)
                           </button>
                         </div>
                       ) : null}

                       <button
                         onClick={async () => {
                           try {
                             await loginWithGoogle();
                           } catch (err) {
                             showNotification("ავტორიზაცია ვერ მოხერხდა. გთხოვთ სცადოთ თავიდან.", "error");
                           }
                         }}
                         className="w-full py-4 bg-slate-900 hover:bg-slate-850 text-white rounded-2xl font-bold text-sm tracking-wide transition-all shadow-md active:scale-98 flex items-center justify-center space-x-3 cursor-pointer"
                       >
                         <svg className="h-5 w-5 fill-white shrink-0" viewBox="0 0 24 24">
                           <path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.7 0 3.25.61 4.5 1.635l2.45-2.45C17.435 1.69 15.02 1 12.24 1 6.58 1 2 5.58 2 11.24s4.58 10.24 10.24 10.24c5.79 0 10.24-4.1 10.24-10.24 0-.64-.06-1.29-.18-1.91H12.24z"/>
                         </svg>
                         <span>ავტორიზაცია Google-ით</span>
                       </button>

                       <div className="pt-4 border-t border-slate-100">
                         <p className="text-[11px] text-slate-400 font-sans">
                           ავტორიზაცია ხელმისაწვდომია მხოლოდ დადასტურებული ადმინისტრატორებისთვის.
                         </p>
                       </div>
                    </div>
                 </div>
              </div>
            ) : (
              <div className="animate-fadeIn">
                <AdminPanel 
                  rooms={rooms}
                  bookings={bookings}
                  customQuestions={customQuestions}
                  hubItems={hubItems}
                  mediaItems={mediaItems}
                  bookingSettings={bookingSettings}
                  simulatedEmails={emails}
                  onUpdateSettings={handleUpdateSettings}
                  onAddRoom={handleAddRoom}
                  onUpdateRoom={handleUpdateRoom}
                  onDeleteRoom={handleDeleteRoom}
                  onApproveBooking={handleApproveBooking}
                  onRejectBooking={handleRejectBooking}
                  onAddQuestion={handleAddQuestion}
                  onDeleteQuestion={handleDeleteQuestion}
                  onAddHubItem={handleAddHubItem}
                  onUpdateHubItem={handleUpdateHubItem}
                  onDeleteHubItem={handleDeleteHubItem}
                  onAddMediaItem={handleAddMediaItem}
                  onUpdateMediaItem={handleUpdateMediaItem}
                  onDeleteMediaItem={handleDeleteMediaItem}
                  onDeleteBooking={handleDeleteBooking}
                  onDeleteEmail={handleDeleteEmail}
                  onReorderRoom={handleReorderRoom}
                  onReorderHubItem={handleReorderHubItem}
                  onLogOut={() => auth.signOut()}
                />
              </div>
            )
          } />
        </Routes>
      </main>

      {/* Styled Footer */}
      <footer className="bg-slate-950 text-white border-t border-slate-900 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-12 border-b border-white/10">
            
            <div className="md:col-span-4 space-y-4">
              <div className="flex items-center space-x-3">
                <div className="bg-white p-1.5 rounded-xl">
                  <img src={logoImg} alt="Logo" className="h-7 w-7 object-contain" />
                </div>
                <div>
                  <span className="block font-display font-bold text-sm sm:text-base text-white leading-tight">ფოთის ახალგაზრდული ჰაბი</span>
                  <span className="block font-sans text-[10px] sm:text-[11px] font-semibold text-brand-400 tracking-wider uppercase leading-none mt-0.5">Poti Youth Hub</span>
                </div>
              </div>
              <p className="text-slate-400 text-xs sm:text-sm font-sans font-light leading-relaxed">
                {bookingSettings.footerTextUnderLogo || 'განათლების, ტექნოლოგიების, კარიერული ზრდისა და კულტურული განვითარების ცენტრი ქალაქ ფოთში. შემოგვიერთდი და მიიღე მონაწილეობა ჰაბის აქტივობებში.'}
              </p>
            </div>

            <div className="md:col-span-4 space-y-3">
              <span className="block font-display font-bold text-sm tracking-wide text-white">სწრაფი ნავიგაცია</span>
              <ul className="space-y-2 text-xs sm:text-sm">
                <li>
                  <a 
                    href="/news" 
                    onClick={(e) => { e.preventDefault(); handleNavigate('news'); }}
                    className="text-slate-400 hover:text-white transition-colors font-sans"
                  >
                    სიახლეები & ტრენინგები
                  </a>
                </li>
                <li>
                  <a 
                    href="/booking" 
                    onClick={(e) => { e.preventDefault(); handleNavigate('booking'); }}
                    className="text-slate-400 hover:text-white transition-colors font-sans"
                  >
                    ოთახების დაჯავშნის კალენდარი
                  </a>
                </li>
                <li>
                  <a 
                    href="/gallery" 
                    onClick={(e) => { e.preventDefault(); handleNavigate('gallery'); }}
                    className="text-slate-400 hover:text-white transition-colors font-sans"
                  >
                    ფოტო-ვიდეო მასალები
                  </a>
                </li>
              </ul>
            </div>

            <div className="md:col-span-4 space-y-3">
              <span className="block font-display font-bold text-sm tracking-wide text-white">კონტაქტი & სამუშაო საათები</span>
              <ul className="space-y-2 text-xs sm:text-sm font-sans font-light text-slate-400">
                <li className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-brand-400 shrink-0" />
                  <span>{bookingSettings.hubAddress}</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-brand-400 shrink-0" />
                  <span>{bookingSettings.hubEmail}</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-brand-400 shrink-0" />
                  <span>{bookingSettings.hubPhone}</span>
                </li>
                <li className="pt-2 border-t border-white/5 text-[11px] font-mono font-medium">
                  {bookingSettings.hubWorkHours}
                </li>
              </ul>
            </div>

          </div>

          <div className="mt-8 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 gap-4">
            <span className="font-sans font-medium flex flex-wrap items-center gap-x-2">
              <span>© {new Date().getFullYear()} ფოთის ახალგაზრდული ჰაბი. ყველა უფლება დაცულია.</span>
              <span className="text-slate-600 hidden sm:inline">|</span>
              <span className="text-brand-400/95 font-semibold">დამზადებულია AI ხელსაწყოების გამოყენებით</span>
            </span>
            <div className="flex items-center space-x-4">
              <button
                id="footer-admin-sh"
                onClick={() => navigate(currentTab === 'admin' ? '/' : '/admin')}
                className="flex items-center space-x-1.5 hover:text-slate-300 font-bold transition-colors cursor-pointer"
              >
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span>{currentTab === 'admin' ? 'საიტის ნახვა' : 'ადმინისტრატორის მართვა'}</span>
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Custom Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-100 shadow-2xl animate-scaleIn text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <h3 className="font-display font-black text-slate-900 text-lg mb-2">{confirmModal.title}</h3>
            <p className="text-slate-500 text-xs font-sans leading-relaxed mb-6">{confirmModal.message}</p>
            <div className="flex space-x-3">
              <button
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-705 text-xs font-bold rounded-xl cursor-pointer transition-all"
              >
                გაუქმება
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-all shadow-md shadow-rose-100 animate-pulse-subtle"
              >
                დიახ, წაშლა
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Chat Widget with expandable contact options */}
      <div id="floating-chat-container" className="fixed bottom-6 right-6 z-55 flex flex-col items-end space-y-3">
        {chatOpen && (
          <div className="flex flex-col items-end space-y-2 mb-2 animate-fadeIn">
            {/* Facebook Link Option */}
            <a
              href={bookingSettings.chatFacebook || 'https://facebook.com/PotiYouthHub/'}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center space-x-3 bg-slate-900 hover:bg-slate-850 text-white px-3.5 py-1.5 rounded-2xl shadow-xl border border-slate-850 transition-all hover:-translate-y-0.5"
              id="chat-fb-link"
            >
              <span className="text-[11px] font-sans font-black text-slate-200 tracking-wide uppercase select-none">
                Facebook
              </span>
              <div className="w-10 h-10 rounded-xl bg-[#1877f2] text-white flex items-center justify-center shadow-md grow-0 shrink-0">
                <Facebook className="h-5 w-5 text-white" />
              </div>
            </a>

            {/* Whatsapp Link Option */}
            <a
              href={bookingSettings.chatWhatsapp || 'https://wa.me/995599123456'}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center space-x-3 bg-slate-900 hover:bg-slate-850 text-white px-3.5 py-1.5 rounded-2xl shadow-xl border border-slate-850 transition-all hover:-translate-y-0.5"
              id="chat-wa-link"
            >
              <span className="text-[11px] font-sans font-black text-slate-200 tracking-wide uppercase select-none">
                WhatsApp
              </span>
              <div className="w-10 h-10 rounded-xl bg-[#25d366] text-white flex items-center justify-center shadow-md grow-0 shrink-0">
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
            </a>

            {/* Email Link Option */}
            <a
              href={`mailto:${bookingSettings.chatEmail || 'yhub.poti@gmail.com'}`}
              className="group flex items-center space-x-3 bg-slate-900 hover:bg-slate-850 text-white px-3.5 py-1.5 rounded-2xl shadow-xl border border-slate-850 transition-all hover:-translate-y-0.5"
              id="chat-email-link"
            >
              <span className="text-[11px] font-sans font-black text-slate-200 tracking-wide uppercase select-none">
                ელ-ფოსტა
              </span>
              <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-md grow-0 shrink-0">
                <Mail className="h-5 w-5 text-white" />
              </div>
            </a>

            {/* Phone Link Option */}
            <a
              href={`tel:${bookingSettings.chatPhone || '+995599123456'}`}
              className="group flex items-center space-x-3 bg-slate-900 hover:bg-slate-850 text-white px-3.5 py-1.5 rounded-2xl shadow-xl border border-slate-850 transition-all hover:-translate-y-0.5"
              id="chat-phone-link"
            >
              <span className="text-[11px] font-sans font-black text-slate-200 tracking-wide uppercase select-none">
                ტელეფონი
              </span>
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md grow-0 shrink-0">
                <Phone className="h-5 w-5 text-white" />
              </div>
            </a>
          </div>
        )}

        {/* Main Floating Button */}
        <button
          id="chat-main-toggle"
          onClick={() => setChatOpen(!chatOpen)}
          className={`w-14 h-14 rounded-full flex items-center justify-center text-white transition-all shadow-xl hover:scale-110 active:scale-95 cursor-pointer relative ${
            chatOpen ? 'bg-slate-800 rotate-90' : 'bg-slate-900'
          }`}
          title="კონტაქტი"
        >
          {chatOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <>
              <MessageCircle className="h-6 w-6 animate-pulse" />
              <span className="absolute -top-1 -right-0.5 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-450 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-500"></span>
              </span>
            </>
          )}
        </button>
      </div>

      {/* Custom Toast Alert Banners */}
      {notification && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-55 flex items-center space-x-2 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl border border-white/10 animate-slideDown max-w-sm w-[90%] justify-between text-xs sm:text-sm font-sans font-medium">
          <div className="flex items-center space-x-2.5">
            {notification.type === 'success' ? (
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
            ) : notification.type === 'error' ? (
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
            ) : (
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-white/60 hover:text-white pl-2">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

    </div>
  );
}
