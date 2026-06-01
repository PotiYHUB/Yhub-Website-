/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type HubCategory = 'news' | 'vacancy' | 'contest' | 'training';

export interface HubItem {
  id: string;
  category: HubCategory;
  title: string;
  summary: string;
  content: string; // supporting markdown/paragraphs
  date: string;
  coverImage: string;
  deadline?: string; // for vacancies, contests, and trainings
  location?: string; // for trainings/contests
  salaryRange?: string; // for vacancies
  requirements?: string[]; // for vacancies/contests/trainings Max capacity, etc.
  order?: number; // custom ordering
  additionalImages?: string[]; // extra gallery images
  trainingButtonText?: string; // custom button text for training category
  trainingButtonLink?: string; // custom button link for training category
}

export interface MediaItem {
  id: string;
  type: 'photo' | 'video';
  url: string; // image path or YouTube embed/video link
  caption: string;
  date: string;
}

export interface Room {
  id: string;
  name: string;
  description: string;
  capacity: number;
  price: number; // Fixed price (hourly or slot-based, we can let it be price representing booking event duration or hourly)
  dayPrice: number; // Day rate / full price in GEL if rented by day
  imageUrl: string;
  imageUrls?: string[]; // Multiple images for room info modal
  features: string[];
  panoramaUrl?: string; // 360 room photo URL (Pannellum embed or direct link)
  videoUrl?: string; // YouTube video link or embed URL
  order?: number; // custom ordering
}

export interface CustomQuestion {
  id: string;
  label: string;
  placeholder: string;
  required: boolean;
  type: 'text' | 'textarea' | 'select';
  options?: string[]; // if type is select
}

export interface Booking {
  id: string;
  roomId: string;
  roomName: string;
  date: string; // YYYY-MM-DD
  durationHours: string; // e.g. "12:00 - 15:00"
  numPeople: number;
  totalPrice: number;
  firstName: string;
  lastName: string;
  organization?: string;
  email: string;
  phone: string;
  answers: Record<string, string>; // answers to custom admin questions
  status: 'pending' | 'approved' | 'rejected';
  invoiceNumber?: string;
  adminNotes?: string;
  createdAt: string;
}
