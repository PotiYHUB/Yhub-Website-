/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MediaItem } from '../types';
import { Image, Play, Calendar, X, Eye, Film, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatToDayMonthYear } from '../utils/dateFormatter';

interface GallerySectionProps {
  mediaItems: MediaItem[];
}

export default function GallerySection({ mediaItems }: GallerySectionProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'photo' | 'video'>('all');
  const [lightboxItem, setLightboxItem] = useState<MediaItem | null>(null);
  const [playerTipActive, setPlayerTipActive] = useState(false);

  const filteredMedia = mediaItems.filter((item) => {
    if (activeFilter === 'all') return true;
    return item.type === activeFilter;
  });

  const currentItemsList = filteredMedia.length > 0 ? filteredMedia : mediaItems;
  const currentIndex = currentItemsList.findIndex(item => item.id === lightboxItem?.id);

  const handlePrev = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (currentItemsList.length === 0) return;
    const prevIndex = (currentIndex - 1 + currentItemsList.length) % currentItemsList.length;
    setLightboxItem(currentItemsList[prevIndex]);
    setPlayerTipActive(false);
  };

  const handleNext = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (currentItemsList.length === 0) return;
    const nextIndex = (currentIndex + 1) % currentItemsList.length;
    setLightboxItem(currentItemsList[nextIndex]);
    setPlayerTipActive(false);
  };

  React.useEffect(() => {
    if (!lightboxItem) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'Escape') {
        setLightboxItem(null);
        setPlayerTipActive(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxItem, currentIndex, currentItemsList]);

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
                  <span>{formatToDayMonthYear(item.date)}</span>
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
          <div 
            className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-6"
            onClick={() => {
              setLightboxItem(null);
              setPlayerTipActive(false);
            }}
          >
            {/* Top Control Bar */}
            <div className="w-full flex justify-between items-center z-10 py-2 border-b border-white/5" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center space-x-3 text-xs sm:text-sm font-sans text-slate-300">
                <span className="px-2.5 py-1 bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-wider text-brand-400">
                  {lightboxItem.type === 'video' ? 'ვიდეო' : 'ფოტო'}
                </span>
                <span className="font-mono text-slate-400">
                  {currentIndex + 1} / {currentItemsList.length}
                </span>
              </div>
              
              <button
                onClick={() => {
                  setLightboxItem(null);
                  setPlayerTipActive(false);
                }}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-white/10 hover:bg-rose-600/80 text-white hover:text-white rounded-xl text-xs font-bold cursor-pointer transition-all border border-white/15"
                title="დახურვა [Esc]"
              >
                <X className="h-4 w-4" />
                <span className="hidden sm:inline">დახურვა</span>
              </button>
            </div>

            {/* Middle Main Content Slider Stage */}
            <div className="flex-1 flex items-center justify-between my-auto w-full max-w-7xl mx-auto relative group">
              {/* Left Arrow Button */}
              <button
                onClick={handlePrev}
                className="absolute left-2 sm:left-4 z-10 p-3 sm:p-4 rounded-full bg-slate-900/85 hover:bg-brand-500 hover:text-slate-950 text-white border border-white/10 hover:border-brand-400 shadow-lg group-hover:scale-105 transition-all outline-hidden cursor-pointer flex items-center justify-center"
                title="წინა სურათი"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>

              {/* Main Media display container */}
              <div 
                className="w-full max-h-[65vh] flex justify-center items-center overflow-hidden px-12 sm:px-16"
                onClick={(e) => e.stopPropagation()}
              >
                {lightboxItem.type === 'video' ? (
                  // Beautifully simulated high-fidelity mock video layout with playback controls simulation
                  <div className="relative w-full aspect-video max-w-3xl bg-slate-950 rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex flex-col justify-center items-center p-6 text-center">
                    {playerTipActive && (
                      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900 border border-white/10 px-4 py-2 rounded-xl text-[11px] text-amber-300 font-sans shadow-xl animate-bounce">
                        ვიდეო მასალები მალე ხელმისაწვდომი იქნება YouTube-ზე!
                      </div>
                    )}
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
                        onClick={() => {
                          setPlayerTipActive(true);
                          setTimeout(() => setPlayerTipActive(false), 3500);
                        }}
                        className="px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-slate-900 rounded-xl text-sm font-black transition-colors flex items-center space-x-2 cursor-pointer"
                      >
                        <Play className="h-4 w-4 fill-slate-900" />
                        <span>ვიდეოს ჩართვა (YouTube)</span>
                      </button>
                      <button
                        onClick={() => {
                          setLightboxItem(null);
                          setPlayerTipActive(false);
                        }}
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
                    className="max-h-[60vh] max-w-full rounded-2xl object-contain border border-white/10 shadow-2xl transition-all duration-300"
                  />
                )}
              </div>

              {/* Right Arrow Button */}
              <button
                onClick={handleNext}
                className="absolute right-2 sm:right-4 z-10 p-3 sm:p-4 rounded-full bg-slate-900/85 hover:bg-brand-500 hover:text-slate-950 text-white border border-white/10 hover:border-brand-400 shadow-lg group-hover:scale-105 transition-all outline-hidden cursor-pointer flex items-center justify-center"
                title="შემდეგი სურათი"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>

            {/* Bottom Info Bar representing Date & Text Description clearly */}
            <div 
              className="w-full bg-slate-950/60 border-t border-white/5 rounded-2xl p-4 sm:p-5 text-center mt-auto z-10 max-w-3xl mx-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-center items-center space-x-2 text-brand-400 text-xs font-semibold font-mono tracking-wider mb-2">
                <Calendar className="h-3.5 w-3.5 text-brand-400" />
                <span>{formatToDayMonthYear(lightboxItem.date)}</span>
              </div>
              <h4 className="font-display text-sm sm:text-base text-slate-100 font-bold max-w-2xl mx-auto leading-relaxed">
                {lightboxItem.caption}
              </h4>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
