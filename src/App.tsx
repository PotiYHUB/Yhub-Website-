/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HubContent from './components/HubContent';
import GallerySection from './components/GallerySection';
import RoomBooking from './components/RoomBooking';
import AdminPanel from './components/AdminPanel';
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
  Compass, Users, Calendar, Award, MapPin, Mail, Phone, Anchor, ArrowDown, HelpCircle, ShieldCheck
} from 'lucide-react';

// Live Firestore integration imports
import { 
  collection, 
  onSnapshot, 
  setDoc, 
  doc, 
  deleteDoc,
  getDocs
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { db, auth, loginWithGoogle, OperationType, handleFirestoreError, sanitizeForFirestore } from './firebase';

import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();

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
    navigate(`/${sec}`);
  };

  // Authenticated state
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Core databases initialized via fallback defaults initially
  const [rooms, setRooms] = useState<Room[]>(INITIAL_ROOMS);
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);
  const [customQuestions, setCustomQuestions] = useState<CustomQuestion[]>(DEFAULT_CUSTOM_QUESTIONS);
  const [hubItems, setHubItems] = useState<HubItem[]>(INITIAL_HUB_ITEMS);
  const [mediaItems] = useState<MediaItem[]>(INITIAL_MEDIA_ITEMS);
  const [bookingSettings, setBookingSettings] = useState({
    fullDayDiscount: 10,
    multiDayDiscount: 15,
    hubAddress: 'გიორგი წერეთლის ქუჩა #12, ფოთი, საქართველო',
    hubEmail: 'yhub.poti@gmail.com',
    hubPhone: '+995 599 123 456',
    hubWorkHours: 'ორშაბათი - პარასკევი: 10:00 - 20:00',
    invoiceTitle: 'ინვოისი მომსახურებაზე',
    invoiceOrgName: 'ფოთის ახალგაზრდული ჰაბი',
    invoiceBankName: 'საქართველოს ბანკი',
    invoiceIban: 'GE90BG0000000123456789',
    invoiceFooter: 'გმადლობთ, რომ სარგებლობთ ახალგაზრდული ჰაბის სივრცით!'
  });

  // Tracking individual visitors' guest bookings submissions globally
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  // Emails tracking state
  const [emails, setEmails] = useState<any[]>([]);

  // Detect genuine Admin permissions
  const isSystemAdmin = user?.email === 'yhub.poti@gmail.com';

  // Automatically scroll to the exact start of the news grid component if /news is chosen, otherwise top
  useEffect(() => {
    if (location.pathname === '/news') {
      const timer = setTimeout(() => {
        const el = document.getElementById('news');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 150);
      return () => clearTimeout(timer);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
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

  // 2. Real-time Firebase Firestore Synchronizations
  useEffect(() => {
    // A. Subscribe to Rooms
    const unsubscribeRooms = onSnapshot(
      collection(db, 'rooms'),
      (snapshot) => {
        const roomsList: Room[] = [];
        snapshot.forEach((doc) => {
          roomsList.push(doc.data() as Room);
        });
        
        if (roomsList.length === 0) {
          setRooms(INITIAL_ROOMS);
          // Auto-seed if the admin opens initially
          if (auth.currentUser?.email === 'yhub.poti@gmail.com') {
            INITIAL_ROOMS.forEach(async (room) => {
              try {
                await setDoc(doc(db, 'rooms', room.id), sanitizeForFirestore(room));
              } catch (err) {
                console.error("Bootstrapping error:", err);
              }
            });
          }
        } else {
          setRooms(roomsList);
        }
      },
      (error) => {
        console.warn("Firestore collection rooms offline, Using fallback data.", error);
        setRooms(INITIAL_ROOMS);
      }
    );

    // B. Subscribe to Custom Questions
    const unsubscribeQuestions = onSnapshot(
      collection(db, 'customQuestions'),
      (snapshot) => {
        const questionsList: CustomQuestion[] = [];
        snapshot.forEach((doc) => {
          questionsList.push(doc.data() as CustomQuestion);
        });
        
        if (questionsList.length === 0) {
          setCustomQuestions(DEFAULT_CUSTOM_QUESTIONS);
          if (auth.currentUser?.email === 'yhub.poti@gmail.com') {
            DEFAULT_CUSTOM_QUESTIONS.forEach(async (q) => {
              try {
                await setDoc(doc(db, 'customQuestions', q.id), sanitizeForFirestore(q));
              } catch (err) {
                console.error("Bootstrapping error:", err);
              }
            });
          }
        } else {
          setCustomQuestions(questionsList);
        }
      },
      (error) => {
        console.warn("Firestore customQuestions collection read failed. Using fallback.", error);
        setCustomQuestions(DEFAULT_CUSTOM_QUESTIONS);
      }
    );

    // C. Subscribe to CMS Hub items (News, jobs, vacancies)
    const unsubscribeHub = onSnapshot(
      collection(db, 'hubItems'),
      (snapshot) => {
        const list: HubItem[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as HubItem);
        });
        
        if (list.length === 0) {
          setHubItems(INITIAL_HUB_ITEMS);
          if (auth.currentUser?.email === 'yhub.poti@gmail.com') {
            INITIAL_HUB_ITEMS.forEach(async (item) => {
              try {
                await setDoc(doc(db, 'hubItems', item.id), sanitizeForFirestore(item));
              } catch (err) {
                console.error("Bootstrapping error:", err);
              }
            });
          }
        } else {
          list.sort((a, b) => b.date.localeCompare(a.date));
          setHubItems(list);
        }
      },
      (error) => {
        console.warn("Firestore hubItems read failed. Using fallback.", error);
        setHubItems(INITIAL_HUB_ITEMS);
      }
    );

    // D. Subscribe to bookingSettings
    const unsubscribeSettings = onSnapshot(
      doc(db, 'settings', 'bookingSettings'),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setBookingSettings((prev) => ({
            ...prev,
            ...data
          }));
        } else {
          if (auth.currentUser?.email === 'yhub.poti@gmail.com') {
            setDoc(doc(db, 'settings', 'bookingSettings'), {
              fullDayDiscount: 10,
              multiDayDiscount: 15,
              hubAddress: 'გიორგი წერეთლის ქუჩა #12, ფოთი, საქართველო',
              hubEmail: 'yhub.poti@gmail.com',
              hubPhone: '+995 599 123 456',
              hubWorkHours: 'ორშაბათი - პარასკევი: 10:00 - 20:00',
              invoiceTitle: 'ინვოისი მომსახურებაზე',
              invoiceOrgName: 'ფოთის ახალგაზრდული ჰაბი',
              invoiceBankName: 'საქართველოს ბანკი',
              invoiceIban: 'GE90BG0000000123456789',
              invoiceFooter: 'გმადლობთ, რომ სარგებლობთ ახალგაზრდული ჰაბის სივრცით!'
            }).catch(err => console.error("Error setting initial settings:", err));
          }
        }
      },
      (error) => {
        console.warn("Firestore settings read failed. Using fallback.", error);
      }
    );

    return () => {
      unsubscribeRooms();
      unsubscribeQuestions();
      unsubscribeHub();
      unsubscribeSettings();
    };
  }, [user]);

  // 3. Admin bookings list subscription
  useEffect(() => {
    if (!user || user.email !== 'yhub.poti@gmail.com') {
      setBookings([]);
      return;
    }

    const unsubscribeBookings = onSnapshot(
      collection(db, 'bookings'),
      (snapshot) => {
        const list: Booking[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as Booking);
        });
        list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setBookings(list);
      },
      (error) => {
        console.warn("Failed retrieving standard bookings list:", error);
        setBookings([]);
      }
    );

    return () => unsubscribeBookings();
  }, [user]);

  // 4. Live subscription to visitor's newly created guest booking
  useEffect(() => {
    if (!submittedId) return;

    const unsubscribeSubmitted = onSnapshot(
      doc(db, 'bookings', submittedId),
      (snapshot) => {
        if (snapshot.exists()) {
          const freshData = snapshot.data() as Booking;
          setBookings(prev => {
            const index = prev.findIndex(b => b.id === submittedId);
            if (index !== -1) {
              return prev.map(b => b.id === submittedId ? freshData : b);
            } else {
              return [freshData, ...prev];
            }
          });
        }
      },
      (error) => {
        console.warn("Guest tracking subscription error:", error);
      }
    );

    return () => unsubscribeSubmitted();
  }, [submittedId]);

  // 5. Emails log live subscription
  useEffect(() => {
    if (!user || user.email !== 'yhub.poti@gmail.com') {
      setEmails([]);
      return;
    }

    const unsubscribeEmails = onSnapshot(
      collection(db, 'emails'),
      (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        list.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
        setEmails(list);
      },
      (error) => {
        console.warn("Failed retrieving standard emails list:", error);
        setEmails([]);
      }
    );

    return () => unsubscribeEmails();
  }, [user]);

  // Mutative Action handlers syncing live writes directly to Firestore
  const handleAddBooking = async (newBookingData: Omit<Booking, 'id' | 'createdAt' | 'status'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newBooking: Booking = {
      ...newBookingData,
      id,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    try {
      await setDoc(doc(db, 'bookings', id), sanitizeForFirestore(newBooking));
      setSubmittedId(id);

      // Save initial review email receipt in Firestore
      const initialEmail = {
        to: newBooking.email,
        subject: `მოთხოვნა მიღებულია - ${bookingSettings.invoiceOrgName}`,
        type: 'pending',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        body: `გამარჯობა ${newBooking.firstName} ${newBooking.lastName}, \n\nთქვენი მოთხოვნა ოთახ(ებ)ზე „${newBooking.roomName}“ დარეგისტრირდა სისტემაში.\n\nდეტალები:\n- თარიღი: ${newBooking.date}\n- საათები: ${newBooking.durationHours}\n- ადამიანების რაოდენობა: ${newBooking.numPeople} კაცი\n\nჯავშანი ამჟამად არის განხილვის სტატუსში. ფოთის ახალგაზრდული ჰაბის ადმინისტრაცია უკვე განიხილავს ჯავშანს და დადასტურების შემთხვევაში ამავე ელ-ფოსტაზე გაგიზიარებთ საგადახდო ინვოისს, ხოლო უარყოფის შემთხვევაში შესაბამის შეტყობინებას.\n\nპატივისცემით,\n${bookingSettings.invoiceOrgName}.`
      };
      const emailId = Math.random().toString(36).substr(2, 9);
      await setDoc(doc(db, 'emails', emailId), sanitizeForFirestore(initialEmail));
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `bookings/${id}`);
    }
  };

  const handleAddRoom = async (room: Room) => {
    try {
      await setDoc(doc(db, 'rooms', room.id), sanitizeForFirestore(room));
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `rooms/${room.id}`);
    }
  };

  const handleUpdateRoom = async (updatedRoom: Room) => {
    try {
      await setDoc(doc(db, 'rooms', updatedRoom.id), sanitizeForFirestore(updatedRoom));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `rooms/${updatedRoom.id}`);
    }
  };

  const handleDeleteRoom = async (id: string) => {
    if (confirm('ნამდვილად გსურთ ამ ოთახის წაშლა?')) {
      try {
        await deleteDoc(doc(db, 'rooms', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `rooms/${id}`);
      }
    }
  };

  const handleApproveBooking = async (id: string, invoiceNum: string) => {
    try {
      const existing = bookings.find(b => b.id === id);
      if (!existing) return;
      const updated: Booking = {
        ...existing,
        status: 'approved',
        invoiceNumber: invoiceNum
      };
      await setDoc(doc(db, 'bookings', id), sanitizeForFirestore(updated));

      // Save approval with invoice email in Firestore
      const approveEmail = {
        to: updated.email,
        subject: `თანხმობა ოთახის დაჯავშნაზე [${updated.roomName}] - ${bookingSettings.invoiceOrgName}`,
        type: 'approved',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        body: `გამარჯობა ${updated.firstName} ${updated.lastName}, \n\nმოხარულები ვართ გაცნობოთ, რომ თქვენი მოთხოვნა „${updated.roomName}“-ს დაჯავშნაზე (${updated.date}, ${updated.durationHours}) წარმატებით დადასტურდა! \n\nჯავშნის კოდი: RSV-${updated.id}.\nსაერთო საფასური შეადგენს: ₾${updated.totalPrice}.00.\n\nმიბმულია საგადახდო ინვოისი #${invoiceNum}. გთხოვთ გადაიხადოთ მითითებულ საბანკო ანგარიშზე ჰაბში მოსვლამდე.\n\nსაბანკო რეკვიზიტები:\n- მიმღები: ${bookingSettings.invoiceOrgName}\n- ბანკი: ${bookingSettings.invoiceBankName}\n- ანგარიში (IBAN): ${bookingSettings.invoiceIban}\n\nპატივისცემით, \n${bookingSettings.invoiceOrgName}.`,
        invoiceNum: invoiceNum
      };
      const emailId = Math.random().toString(36).substr(2, 9);
      await setDoc(doc(db, 'emails', emailId), sanitizeForFirestore(approveEmail));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `bookings/${id}`);
    }
  };

  const handleRejectBooking = async (id: string, reason: string) => {
    try {
      const existing = bookings.find(b => b.id === id);
      if (!existing) return;
      const updated: Booking = {
        ...existing,
        status: 'rejected',
        adminNotes: reason
      };
      await setDoc(doc(db, 'bookings', id), sanitizeForFirestore(updated));

      // Save rejection email in Firestore
      const rejectEmail = {
        to: updated.email,
        subject: `უარყოფა ოთახის დაჯავშნაზე - ${bookingSettings.invoiceOrgName}`,
        type: 'rejected',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        body: `გამარჯობა ${updated.firstName} ${updated.lastName}, \n\nსამწუხაროდ, თქვენი მოთხოვნა „${updated.roomName}“-ს დაჯავშნაზე (${updated.date}, ${updated.durationHours}) ამ ეტაპზე ვერ დაკმაყოფილდა.\n\nუარყოფის მიზეზი:\n"${reason}"\n\nსხვა ალტერნატიული დროის ასარჩევად გთხოვთ ეწვიოთ ჩვენს პორტალს ან დაგვიკავშირდეთ ნომერზე: ${bookingSettings.hubPhone}.\n\nპატივისცემით, \n${bookingSettings.invoiceOrgName} ადმინისტრაცია.`
      };
      const emailId = Math.random().toString(36).substr(2, 9);
      await setDoc(doc(db, 'emails', emailId), sanitizeForFirestore(rejectEmail));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `bookings/${id}`);
    }
  };

  const handleAddQuestion = async (q: CustomQuestion) => {
    try {
      await setDoc(doc(db, 'customQuestions', q.id), sanitizeForFirestore(q));
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `customQuestions/${q.id}`);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (confirm('დარწმუნებული ხართ, რომ გსურთ კითხვის წაშლა?')) {
      try {
        await deleteDoc(doc(db, 'customQuestions', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `customQuestions/${id}`);
      }
    }
  };

  const handleAddHubItem = async (item: HubItem) => {
    try {
      await setDoc(doc(db, 'hubItems', item.id), sanitizeForFirestore(item));
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `hubItems/${item.id}`);
    }
  };

  const handleDeleteHubItem = async (id: string) => {
    if (confirm('ნამდვილად გსურთ პოსტის წაშლა?')) {
      try {
        await deleteDoc(doc(db, 'hubItems', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `hubItems/${id}`);
      }
    }
  };

  const handleUpdateSettings = async (settings: { fullDayDiscount: number; multiDayDiscount: number }) => {
    try {
      await setDoc(doc(db, 'settings', 'bookingSettings'), sanitizeForFirestore(settings));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'settings/bookingSettings');
    }
  };

  return (
    <div className="flex flex-col min-h-screen text-slate-800 selection:bg-slate-900 selection:text-white">
      
      {/* Navigation Header */}
      <Navbar 
        currentTab={currentTab} 
        setCurrentTab={(tab) => navigate(tab === 'admin' ? '/admin' : '/news')} 
        activeSection={activeSection} 
        setActiveSection={handleNavigate} 
      />

      <main className="flex-grow">
        <Routes>
          {/* Redirect root URL to /news */}
          <Route path="/" element={<Navigate to="/news" replace />} />

          {/* Page: /news */}
          <Route path="/news" element={
            <div className="animate-fadeIn">
              {/* Maritime Sea-Themed Hero Banner */}
              <section className="relative bg-slate-900 py-24 sm:py-32 overflow-hidden text-white leading-snug">
                <div className="absolute inset-0 z-0 opacity-50">
                  <img 
                    src={heroBg} 
                    alt="Background" 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-brand-900/60 z-10"></div>
                
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
                      <span className="block font-display font-black text-2xl text-white">4+</span>
                      <span className="block text-xs text-slate-400 mt-1 uppercase font-semibold">თანამედროვე სივრცე</span>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                      <span className="block font-display font-black text-2xl text-white">2k+</span>
                      <span className="block text-xs text-slate-400 mt-1 uppercase font-semibold">აქტიური წევრი</span>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                      <span className="block font-display font-black text-2xl text-white">100%</span>
                      <span className="block text-xs text-slate-400 mt-1 uppercase font-semibold">მხარდაჭერა</span>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                      <span className="block font-display font-black text-2xl text-white">12+</span>
                      <span className="block text-xs text-slate-400 mt-1 uppercase font-semibold">მიმდინარე პროექტი</span>
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

          {/* Page: /booking */}
          <Route path="/booking" element={
            <div className="animate-fadeIn">
              {/* Custom header for Booking page */}
              <section className="relative bg-slate-900 py-16 sm:py-20 overflow-hidden text-white leading-snug">
                <div className="absolute inset-0 z-0 opacity-45">
                  <img 
                    src={heroBg} 
                    alt="Background" 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/95 to-brand-950/70 z-10"></div>
                
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
                <div className="absolute inset-0 z-0 opacity-45">
                  <img 
                    src={heroBg} 
                    alt="Background" 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/95 to-brand-950/70 z-10"></div>
                
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
                             alert("ავტორიზაცია ვერ მოხერხდა. გთხოვთ სცადოთ თავიდან.");
                           }
                         }}
                         className="w-full py-4 bg-slate-900 hover:bg-slate-850 text-white rounded-2xl font-bold text-sm tracking-wide transition-all shadow-md active:scale-98 flex items-center justify-center space-x-3 cursor-pointer"
                       >
                         <svg className="h-5 w-5 fill-white shrink-0" viewBox="0 0 24 24">
                           <path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.7 0 3.25.61 4.5 1.635l2.45-2.45C17.435 1.69 15.02 1 12.24 1 6.58 1 2 5.58 2 11.24s4.58 10.24 10.24 10.24c5.79 0 10.24-4.1 10.24-10.24 0-.64-.06-1.29-.18-1.91H12.24z"/>
                         </svg>
                         <span>ავტორიზაცია Google-ით</span>
                       </button>

                       {/* Guest / Demo Option */}
                       <div className="pt-4 border-t border-slate-100">
                         <span className="block text-xs text-slate-400">ან გააგრძელეთ სატესტო რეჟიმში:</span>
                         <button
                           onClick={() => {
                             alert("თქვენ იმყოფებით საჩვენებელ დემო რეჟიმში. ცვლილებები შეინახება მხოლოდ ბრაუზერში სანამ არ გადატვირთავთ საიტს.");
                             setUser({
                               email: 'yhub.poti@gmail.com',
                               emailVerified: true,
                               uid: 'demo-admin-uid',
                             } as any);
                           }}
                           className="mt-2 text-xs font-semibold text-brand-600 hover:text-brand-700 underline cursor-pointer"
                         >
                           ლოკალური დემო ადმინისტრატორი ➜
                         </button>
                       </div>
                    </div>
                 </div>
              </div>
            ) : (
              <div className="animate-fadeIn">
                {/* Admin info bar */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
                  <div className="bg-emerald-50 border border-emerald-150 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-center text-xs font-sans text-emerald-800 gap-4">
                    <div className="flex items-center space-x-2">
                      <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>შესული ხართ როგორც ადმინისტრატორი: <strong>{user?.email}</strong></span>
                    </div>
                    <button 
                      onClick={() => auth.signOut()}
                      className="px-4 py-1.5 bg-white border border-emerald-200 text-emerald-700 font-bold rounded-xl hover:bg-emerald-100 transition-colors cursor-pointer"
                    >
                      სისტემიდან გამოსვლა
                    </button>
                  </div>
                </div>
                
                <AdminPanel 
                  rooms={rooms}
                  bookings={bookings}
                  customQuestions={customQuestions}
                  hubItems={hubItems}
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
                  onDeleteHubItem={handleDeleteHubItem}
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
                განათლების, ტექნოლოგიების, კარიერული ზრდისა და კულტურული განვითარების ცენტრი ქალაქ ფოთში. შემოგვიერთდი და მიიღე მონაწილეობა ჰაბის აქტივობებში.
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
            <span className="font-sans font-medium">
              © {new Date().getFullYear()} ფოთის ახალგაზრდული ჰაბი. ყველა უფლება დაცულია.
            </span>
            <div className="flex items-center space-x-4">
              <button
                id="footer-admin-sh"
                onClick={() => navigate(currentTab === 'admin' ? '/news' : '/admin')}
                className="flex items-center space-x-1.5 hover:text-slate-300 font-bold transition-colors cursor-pointer"
              >
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span>{currentTab === 'admin' ? 'საიტის ნახვა' : 'ადმინისტრატორის მართვა'}</span>
              </button>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
