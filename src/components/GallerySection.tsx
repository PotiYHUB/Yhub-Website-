/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MediaItem } from '../types';
import { Image, Play, Calendar, X, Eye, Film } from 'lucide-react';

interface GallerySectionProps {
  mediaItems: MediaItem[];
}

export default function GallerySection({ mediaItems }: GallerySectionProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'photo' | 'video'>('all');
  const [lightboxItem, setLightboxItem] = useState<MediaItem | null>(null);

  const filteredMedia = mediaItems.filter((item) => {
    if (activeFilter === 'all') return true;
    return item.type === activeFilter;
  });

  return (
    <section id="gallery" className="py-16 bg-slate-900 text-white relative overflow-hidden">
      {/* Decorative maritime background element */}
      <div className="absolute right-0 bottom-0 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Gallery Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-brand-400 text-xs font-bold tracking-widest uppercase bg-brand-500/10 border border-brand-500/20 px-3 py-1.5 rounded-full">
            მედია გალერეა
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl font-display font-black text-white tracking-tight">
            ცხოვრება ჰაბში
          </h2>
          <p className="mt-3 text-lg text-slate-300 font-sans font-light">
            ჩვენი ყოველდღიურობა, ღონისძიებები, ვორქშოფები და ახალგაზრდების შემოქმედებითი პროცესი.
          </p>

          {/* Filtering buttons */}
          <div className="flex justify-center mt-8 space-x-2">
            <button
              id="gallery-filter-all"
              onClick={() => setActiveFilter('all')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-md'
                  : 'bg-white/10 hover:bg-white/15 text-slate-200'
              }`}
            >
              ყველა
            </button>
            <button
              id="gallery-filter-photos"
              onClick={() => setActiveFilter('photo')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                activeFilter === 'photo'
                  ? 'bg-white text-slate-900 shadow-md'
                  : 'bg-white/10 hover:bg-white/15 text-slate-200'
              }`}
            >
              <Image className="h-3.5 w-3.5" />
              <span>ფოტოები</span>
            </button>
            <button
              id="gallery-filter-videos"
              onClick={() => setActiveFilter('video')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                activeFilter === 'video'
                  ? 'bg-white text-slate-900 shadow-md'
                  : 'bg-white/10 hover:bg-white/15 text-slate-200'
              }`}
            >
              <Film className="h-3.5 w-3.5" />
              <span>ვიდეოები</span>
            </button>
          </div>
        </div>

        {/* Media Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMedia.map((item) => (
            <div
              key={item.id}
              className="group relative cursor-pointer overflow-hidden rounded-2xl bg-slate-800 border border-white/5 aspect-4/3 shadow-sm hover:shadow-xl transition-all duration-300"
              onClick={() => setLightboxItem(item)}
            >
              <img
                src={item.type === 'video' ? 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=800&q=80' : item.url}
                alt={item.caption}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100"
              />

              {/* Overlay styling */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex flex-col justify-end p-5">
                <div className="flex items-center space-x-1.5 text-xs text-brand-300 font-medium mb-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{item.date}</span>
                </div>
                <h4 className="font-display font-bold text-sm sm:text-base leading-snug line-clamp-2">
                  {item.caption}
                </h4>
              </div>

              {/* Play / Zoom Icon indicator */}
              <div className="absolute top-4 right-4 bg-slate-950/60 p-2.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 border border-white/10">
                {item.type === 'video' ? (
                  <Play className="h-4 w-4 text-brand-400 fill-brand-400" />
                ) : (
                  <Eye className="h-4 w-4 text-white" />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Lightbox Modal */}
        {lightboxItem && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-center items-center p-4">
            <button
              onClick={() => setLightboxItem(null)}
              className="absolute top-6 right-6 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full cursor-pointer transition-colors"
            >
              <X className="h-6 w-6" />
            </button>

            <div className="w-full max-w-4xl max-h-[80vh] flex justify-center items-center overflow-hidden">
              {lightboxItem.type === 'video' ? (
                // Beautifully simulated high-fidelity mock video layout with playback controls simulation
                <div className="relative w-full aspect-video max-w-3xl bg-slate-950 rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex flex-col justify-center items-center p-6 text-center">
                  <div className="absolute top-4 left-4 bg-red-600 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center space-x-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                    <span>HD ვიდეო</span>
                  </div>
                  <Film className="h-16 w-16 text-brand-500 mb-4 animate-bounce" />
                  <h3 className="font-display font-extrabold text-xl sm:text-2xl text-white mb-2">
                    {lightboxItem.caption}
                  </h3>
                  <p className="text-slate-400 text-sm max-w-md font-sans mb-6">
                    ვიდეო მასალა მზადდება და ჩაწერილია მედია და პოდკასტ ლაბორატორიაში.
                  </p>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => alert('ვიდეო პლეერი მზადებაშია! აპლიკაცია მუშაობს იმიტაციურ გარემოში.')}
                      className="px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-slate-900 rounded-xl text-sm font-black transition-colors flex items-center space-x-2 cursor-pointer"
                    >
                      <Play className="h-4 w-4 fill-slate-900" />
                      <span>ვიდეოს ჩართვა (YouTube)</span>
                    </button>
                    <button
                      onClick={() => setLightboxItem(null)}
                      className="px-5 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-xl text-sm font-bold border border-white/5 transition-colors cursor-pointer"
                    >
                      დახურვა
                    </button>
                  </div>
                </div>
              ) : (
                <img
                  src={lightboxItem.url}
                  alt={lightboxItem.caption}
                  referrerPolicy="no-referrer"
                  className="max-h-full max-w-full rounded-2xl object-contain border border-white/10 shadow-2xl"
                />
              )}
            </div>

            {/* Lightbox Caption */}
            <div className="mt-6 text-center max-w-2xl px-4">
              <span className="text-brand-400 text-xs font-semibold font-mono tracking-wider block mb-1.5">
                {lightboxItem.date}
              </span>
              <p className="font-display text-base text-slate-200">
                {lightboxItem.caption}
              </p>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
