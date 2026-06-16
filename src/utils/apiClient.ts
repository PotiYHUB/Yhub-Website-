/**
 * Poti Youth Hub - API Client Driver
 * Bypasses Firestore using the cPanel api.php endpoints in production,
 * and falls back to robust LocalStorage persistence in the development workspace.
 */

import { Room, Booking, CustomQuestion, HubItem, MediaItem } from '../types';
import { 
  INITIAL_ROOMS, 
  INITIAL_HUB_ITEMS, 
  INITIAL_MEDIA_ITEMS, 
  DEFAULT_CUSTOM_QUESTIONS, 
  INITIAL_BOOKINGS 
} from '../mockData';

// Determine if we are running in cPanel production (checks if URL doesn't contain dev patterns)
const isProduction = !window.location.hostname.includes('localhost') && 
                     !window.location.hostname.includes('google.app') &&
                     !window.location.hostname.includes('run.app');

const API_BASE_URL = isProduction ? './api.php' : '';

// Helper to assemble authorization headers
async function getHeaders(token?: string) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Also pass the default admin secret as fallback header for easy hosting configurations
  headers['X-Admin-Secret'] = 'yhub_poti_secure_cpanel_token_2026';
  
  return headers;
}

// Dev LocalStorage Mock database runner
const LOCAL_STORAGE_KEY = 'yhub_local_db';

function getDevLocalDb() {
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      // fallback
    }
  }
  
  const initialDb = {
    rooms: INITIAL_ROOMS,
    bookings: INITIAL_BOOKINGS,
    customQuestions: DEFAULT_CUSTOM_QUESTIONS,
    hubItems: INITIAL_HUB_ITEMS,
    mediaItems: INITIAL_MEDIA_ITEMS,
    settings: {
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
    },
    emails: []
  };
  
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialDb));
  return initialDb;
}

function saveDevLocalDb(db: any) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(db));
}

export const apiClient = {
  // 1. Fetch entire database in single batch
  async getAllData(token?: string, submittedId?: string): Promise<{
    rooms: Room[];
    customQuestions: CustomQuestion[];
    hubItems: HubItem[];
    mediaItems: MediaItem[];
    bookingSettings: any;
    bookings: Booking[];
    emails: any[];
  }> {
    if (!isProduction) {
      const db = getDevLocalDb();
      // Filter bookings for guest tracking if not authenticated
      let bookings = db.bookings || [];
      if (!token) {
        if (submittedId) {
          bookings = bookings.filter((b: any) => b.id === submittedId);
        } else {
          bookings = [];
        }
      }
      return {
        rooms: db.rooms || [],
        customQuestions: db.customQuestions || [],
        hubItems: db.hubItems || [],
        mediaItems: db.mediaItems || [],
        bookingSettings: db.settings || {},
        bookings: bookings,
        emails: token ? (db.emails || []) : []
      };
    }

    const url = `${API_BASE_URL}?action=get_all_data${submittedId ? `&submittedId=${submittedId}` : ''}`;
    const headers = await getHeaders(token);
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error('API server fetch failure');
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    
    return {
      rooms: json.data.rooms || [],
      customQuestions: json.data.customQuestions || [],
      hubItems: json.data.hubItems || [],
      mediaItems: json.data.mediaItems || [],
      bookingSettings: json.data.bookingSettings || {},
      bookings: json.data.bookings || [],
      emails: json.data.emails || []
    };
  },

  // 2. Guest booking submission
  async addBooking(booking: Omit<Booking, 'id' | 'createdAt' | 'status'>, generatedId: string): Promise<string> {
    const rawBooking = {
      ...booking,
      id: generatedId,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    if (!isProduction) {
      const db = getDevLocalDb();
      if (!db.bookings) db.bookings = [];
      db.bookings.unshift(rawBooking);
      
      const emailId = Math.random().toString(36).substr(2, 9);
      if (!db.emails) db.emails = [];
      db.emails.unshift({
        id: emailId,
        to: booking.email,
        subject: 'მოთხოვნა მიღებულია - ფოთის ახალგაზრდული ჰაბი',
        type: 'pending',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        body: `გამარჯობა ${booking.firstName} ${booking.lastName}, \n\nთქვენი მოთხოვნა ოთახ(ებ)ზე „${booking.roomName}“ დარეგისტრირდა სისტემაში.\n\nჯავშანი ამჟამად არის განხილვის სტატუსში.`
      });
      
      saveDevLocalDb(db);
      return generatedId;
    }

    const headers = await getHeaders();
    const res = await fetch(`${API_BASE_URL}?action=add_booking`, {
      method: 'POST',
      headers,
      body: JSON.stringify(rawBooking)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data.id;
  },

  // 3. Admin Setting Modifications
  async updateSettings(settings: any, token: string): Promise<void> {
    if (!isProduction) {
      const db = getDevLocalDb();
      db.settings = { ...db.settings, ...settings };
      saveDevLocalDb(db);
      return;
    }

    const headers = await getHeaders(token);
    const res = await fetch(`${API_BASE_URL}?action=update_settings`, {
      method: 'POST',
      headers,
      body: JSON.stringify(settings)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
  },

  // 4. Admin Rooms manipulations
  async addRoom(room: Room, token: string): Promise<void> {
    if (!isProduction) {
      const db = getDevLocalDb();
      if (!db.rooms) db.rooms = [];
      db.rooms.push(room);
      saveDevLocalDb(db);
      return;
    }

    const headers = await getHeaders(token);
    const res = await fetch(`${API_BASE_URL}?action=add_room`, {
      method: 'POST',
      headers,
      body: JSON.stringify(room)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
  },

  async updateRoom(room: Room, token: string): Promise<void> {
    if (!isProduction) {
      const db = getDevLocalDb();
      db.rooms = (db.rooms || []).map((r: Room) => r.id === room.id ? room : r);
      saveDevLocalDb(db);
      return;
    }

    const headers = await getHeaders(token);
    const res = await fetch(`${API_BASE_URL}?action=update_room`, {
      method: 'POST',
      headers,
      body: JSON.stringify(room)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
  },

  async deleteRoom(id: string, token: string): Promise<void> {
    if (!isProduction) {
      const db = getDevLocalDb();
      db.rooms = (db.rooms || []).filter((r: Room) => r.id !== id);
      saveDevLocalDb(db);
      return;
    }

    const headers = await getHeaders(token);
    const res = await fetch(`${API_BASE_URL}?action=delete_room&id=${id}`, {
      method: 'GET',
      headers
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
  },

  // 5. Approvals & Rejections
  async approveBooking(id: string, invoiceNumber: string, token: string, originalBooking?: Booking, settings?: any): Promise<void> {
    if (!isProduction) {
      const db = getDevLocalDb();
      db.bookings = (db.bookings || []).map((b: Booking) => b.id === id ? { ...b, status: 'approved', invoiceNumber } : b);
      
      if (originalBooking) {
        const orgName = settings?.invoiceOrgName || 'ფოთის ახალგაზრდული ჰაბი';
        db.emails = db.emails || [];
        db.emails.unshift({
          id: Math.random().toString(36).substr(2, 9),
          to: originalBooking.email,
          subject: 'თანხმობა ოთახის დაჯავშნაზე',
          type: 'approved',
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
          body: `გამარჯობა ${originalBooking.firstName}, \n\nჯავშანი RSV-${originalBooking.id} დადასტურებულია ინვოისით #${invoiceNumber}.`
        });
      }
      
      saveDevLocalDb(db);
      return;
    }

    const headers = await getHeaders(token);
    const res = await fetch(`${API_BASE_URL}?action=approve_booking`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ id, invoiceNumber })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
  },

  async rejectBooking(id: string, reason: string, token: string, originalBooking?: Booking, settings?: any): Promise<void> {
    if (!isProduction) {
      const db = getDevLocalDb();
      db.bookings = (db.bookings || []).map((b: Booking) => b.id === id ? { ...b, status: 'rejected', adminNotes: reason } : b);
      
      if (originalBooking) {
        db.emails = db.emails || [];
        db.emails.unshift({
          id: Math.random().toString(36).substr(2, 9),
          to: originalBooking.email,
          subject: 'უარყოფა ოთახის დაჯავშნაზე',
          type: 'rejected',
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
          body: `გამარჯობა ${originalBooking.firstName}, \n\nმოთხოვნა „${originalBooking.roomName}“-ს დაჯავშნაზე უარყოფილია: \n\n"${reason}"`
        });
      }

      saveDevLocalDb(db);
      return;
    }

    const headers = await getHeaders(token);
    const res = await fetch(`${API_BASE_URL}?action=reject_booking`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ id, reason })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
  },

  async deleteBooking(id: string, token: string): Promise<void> {
    if (!isProduction) {
      const db = getDevLocalDb();
      db.bookings = (db.bookings || []).filter((b: Booking) => b.id !== id);
      saveDevLocalDb(db);
      return;
    }

    const headers = await getHeaders(token);
    const res = await fetch(`${API_BASE_URL}?action=delete_booking&id=${id}`, {
      method: 'GET',
      headers
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
  },

  // 6. Custom Questions (FAQ forms)
  async addQuestion(question: CustomQuestion, token: string): Promise<void> {
    if (!isProduction) {
      const db = getDevLocalDb();
      if (!db.customQuestions) db.customQuestions = [];
      db.customQuestions = db.customQuestions.filter((q: CustomQuestion) => q.id !== question.id);
      db.customQuestions.push(question);
      saveDevLocalDb(db);
      return;
    }

    const headers = await getHeaders(token);
    const res = await fetch(`${API_BASE_URL}?action=add_question`, {
      method: 'POST',
      headers,
      body: JSON.stringify(question)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
  },

  async deleteQuestion(id: string, token: string): Promise<void> {
    if (!isProduction) {
      const db = getDevLocalDb();
      db.customQuestions = (db.customQuestions || []).filter((q: CustomQuestion) => q.id !== id);
      saveDevLocalDb(db);
      return;
    }

    const headers = await getHeaders(token);
    const res = await fetch(`${API_BASE_URL}?action=delete_question&id=${id}`, {
      method: 'GET',
      headers
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
  },

  // 7. CMS Hub Items
  async addHubItem(item: HubItem, token: string): Promise<void> {
    if (!isProduction) {
      const db = getDevLocalDb();
      if (!db.hubItems) db.hubItems = [];
      db.hubItems.push(item);
      saveDevLocalDb(db);
      return;
    }

    const headers = await getHeaders(token);
    const res = await fetch(`${API_BASE_URL}?action=add_hub_item`, {
      method: 'POST',
      headers,
      body: JSON.stringify(item)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
  },

  async updateHubItem(item: HubItem, token: string): Promise<void> {
    if (!isProduction) {
      const db = getDevLocalDb();
      db.hubItems = (db.hubItems || []).map((h: HubItem) => h.id === item.id ? item : h);
      saveDevLocalDb(db);
      return;
    }

    const headers = await getHeaders(token);
    const res = await fetch(`${API_BASE_URL}?action=update_hub_item`, {
      method: 'POST',
      headers,
      body: JSON.stringify(item)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
  },

  async deleteHubItem(id: string, token: string): Promise<void> {
    if (!isProduction) {
      const db = getDevLocalDb();
      db.hubItems = (db.hubItems || []).filter((h: HubItem) => h.id !== id);
      saveDevLocalDb(db);
      return;
    }

    const headers = await getHeaders(token);
    const res = await fetch(`${API_BASE_URL}?action=delete_hub_item&id=${id}`, {
      method: 'GET',
      headers
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
  },

  // 8. Media Items (Gallery)
  async addMediaItem(item: MediaItem, token: string): Promise<void> {
    if (!isProduction) {
      const db = getDevLocalDb();
      if (!db.mediaItems) db.mediaItems = [];
      db.mediaItems.push(item);
      saveDevLocalDb(db);
      return;
    }

    const headers = await getHeaders(token);
    const res = await fetch(`${API_BASE_URL}?action=add_media_item`, {
      method: 'POST',
      headers,
      body: JSON.stringify(item)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
  },

  async updateMediaItem(item: MediaItem, token: string): Promise<void> {
    if (!isProduction) {
      const db = getDevLocalDb();
      db.mediaItems = (db.mediaItems || []).map((m: MediaItem) => m.id === item.id ? item : m);
      saveDevLocalDb(db);
      return;
    }

    const headers = await getHeaders(token);
    const res = await fetch(`${API_BASE_URL}?action=update_media_item`, {
      method: 'POST',
      headers,
      body: JSON.stringify(item)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
  },

  async deleteMediaItem(id: string, token: string): Promise<void> {
    if (!isProduction) {
      const db = getDevLocalDb();
      db.mediaItems = (db.mediaItems || []).filter((m: MediaItem) => m.id !== id);
      saveDevLocalDb(db);
      return;
    }

    const headers = await getHeaders(token);
    const res = await fetch(`${API_BASE_URL}?action=delete_media_item&id=${id}`, {
      method: 'GET',
      headers
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
  },

  // 9. Admin Logs (Email history)
  async deleteEmail(id: string, token: string): Promise<void> {
    if (!isProduction) {
      const db = getDevLocalDb();
      db.emails = (db.emails || []).filter((e: any) => e.id !== id);
      saveDevLocalDb(db);
      return;
    }

    const headers = await getHeaders(token);
    const res = await fetch(`${API_BASE_URL}?action=delete_email&id=${id}`, {
      method: 'GET',
      headers
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
  }
};
