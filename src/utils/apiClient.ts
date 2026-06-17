/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Room, CustomQuestion, HubItem, MediaItem, Booking } from '../types';

// API Configuration
const API_BASE_URL = (import.meta as any).env.VITE_API_URL || '';
const ADMIN_SECRET_HEADER = (import.meta as any).env.VITE_ADMIN_SECRET || '';

// Type-safe fetch wrapper helper
async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Base headers
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (ADMIN_SECRET_HEADER) {
    headers.set('X-Admin-Secret', ADMIN_SECRET_HEADER);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error (${response.status}): ${errorText || response.statusText}`);
  }

  const result = await response.json();
  if (result && result.success === false) {
    throw new Error(result.error || 'Unknown API Error');
  }

  return (result && 'data' in result) ? result.data : result;
}

export const apiClient = {
  // Rooms
  async getRooms(): Promise<Room[]> {
    return apiFetch<Room[]>('/api.php?action=get_rooms');
  },
  async saveRoom(room: Room): Promise<void> {
    return apiFetch<void>('/api.php?action=save_room', {
      method: 'POST',
      body: JSON.stringify(room),
    });
  },
  async deleteRoom(id: string): Promise<void> {
    return apiFetch<void>(`/api.php?action=delete_room&id=${encodeURIComponent(id)}`, {
      method: 'POST',
    });
  },

  // Custom Questions
  async getCustomQuestions(): Promise<CustomQuestion[]> {
    return apiFetch<CustomQuestion[]>('/api.php?action=get_questions');
  },
  async saveCustomQuestion(question: CustomQuestion): Promise<void> {
    return apiFetch<void>('/api.php?action=save_question', {
      method: 'POST',
      body: JSON.stringify(question),
    });
  },
  async deleteCustomQuestion(id: string): Promise<void> {
    return apiFetch<void>(`/api.php?action=delete_question&id=${encodeURIComponent(id)}`, {
      method: 'POST',
    });
  },

  // Hub Items
  async getHubItems(): Promise<HubItem[]> {
    return apiFetch<HubItem[]>('/api.php?action=get_hub_items');
  },
  async saveHubItem(item: HubItem): Promise<void> {
    return apiFetch<void>('/api.php?action=save_hub_item', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  },
  async deleteHubItem(id: string): Promise<void> {
    return apiFetch<void>(`/api.php?action=delete_hub_item&id=${encodeURIComponent(id)}`, {
      method: 'POST',
    });
  },

  // Booking Settings
  async getBookingSettings(): Promise<any> {
    return apiFetch<any>('/api.php?action=get_settings');
  },
  async saveBookingSettings(settings: any): Promise<void> {
    return apiFetch<void>('/api.php?action=save_settings', {
      method: 'POST',
      body: JSON.stringify(settings),
    });
  },

  // Media Items (Gallery)
  async getMediaItems(): Promise<MediaItem[]> {
    return apiFetch<MediaItem[]>('/api.php?action=get_media_items');
  },
  async saveMediaItem(item: MediaItem): Promise<void> {
    return apiFetch<void>('/api.php?action=save_media_item', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  },
  async deleteMediaItem(id: string): Promise<void> {
    return apiFetch<void>(`/api.php?action=delete_media_item&id=${encodeURIComponent(id)}`, {
      method: 'POST',
    });
  },

  // Bookings
  async getBookings(): Promise<Booking[]> {
    return apiFetch<Booking[]>('/api.php?action=get_bookings');
  },
  async saveBooking(booking: Booking): Promise<void> {
    return apiFetch<void>('/api.php?action=save_booking', {
      method: 'POST',
      body: JSON.stringify(booking),
    });
  },
  async deleteBooking(id: string): Promise<void> {
    return apiFetch<void>(`/api.php?action=delete_booking&id=${encodeURIComponent(id)}`, {
      method: 'POST',
    });
  },

  // Emails
  async getEmails(): Promise<any[]> {
    return apiFetch<any[]>('/api.php?action=get_emails');
  },
  async saveEmail(email: any): Promise<void> {
    return apiFetch<void>('/api.php?action=save_email', {
      method: 'POST',
      body: JSON.stringify(email),
    });
  },
  async deleteEmail(id: string): Promise<void> {
    return apiFetch<void>(`/api.php?action=delete_email&id=${encodeURIComponent(id)}`, {
      method: 'POST',
    });
  }
};
