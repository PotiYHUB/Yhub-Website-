/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HubItem, HubCategory } from '../types';
import { Calendar, MapPin, Award, Search, ArrowRight, Briefcase, Trophy, GraduationCap, Clock, HelpCircle, X } from 'lucide-react';
import { formatDisplayDate } from '../utils/dateFormatter';

interface HubContentProps {
  hubItems: HubItem[];
  onNavigateToBooking?: () => void;
  isPreview?: boolean;
}

export default function HubContent({ hubItems, onNavigateToBooking, isPreview = false }: HubContentProps) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<HubCategory | 'all'>('all');
  const [selectedItem, setSelectedItem] = useState<HubItem | null>(null);

  const handleItemClick = (item: HubItem) => {
    if (item.customUrl) {
      const url = item.customUrl.startsWith('http://') || item.customUrl.startsWith('https://')
        ? item.customUrl 
        : 'https://' + item.customUrl;
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      navigate('/news/' + item.id);
    }
  };

  // Sort items descending by date (latest first)
  const sortedHubItems = [...hubItems].sort((a, b) => {
    const dateA = a.date || '';
    const dateB = b.date || '';
    return dateB.localeCompare(dateA);
  });

  // Filter sorted items
  const filteredItems = sortedHubItems.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.summary.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' ? true : item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // If isPreview is true, we show up to 6 latest items overall
  const displayItems = isPreview ? sortedHubItems.slice(0, 6) : filteredItems;

  // Get icons and color themes for categories
  const getCategoryMeta = (category: HubCategory) => {
    switch (category) {
      case 'news':
        return {
          label: 'ბლოგი & სიახლე',
          colorClass: 'bg-blue-50 text-blue-700 border-blue-200',
          badgeClass: 'bg-blue-600',
          icon: Clock
        };
      case 'training':
        return {
          label: 'ტრენინგი',
          colorClass: 'bg-amber-50 text-amber-700 border-amber-200',
          badgeClass: 'bg-amber-600',
          icon: GraduationCap
        };
      case 'contest':
        return {
          label: 'კონკურსი',
          colorClass: 'bg-purple-50 text-purple-700 border-purple-200',
          badgeClass: 'bg-purple-600',
          icon: Trophy
        };
      case 'general':
        return {
          label: 'სხვადასხვა',
          colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          badgeClass: 'bg-emerald-600',
          icon: HelpCircle
        };
      default:
        return {
          label: 'სხვადასხვა',
          colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          badgeClass: 'bg-emerald-600',
          icon: HelpCircle
        };
    }
  };

  return (
    <section id="news" className="py-16 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-brand-600 text-xs font-bold tracking-widest uppercase bg-brand-50 px-3 py-1.5 rounded-full">
            ჰაბის აქტივობები
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl font-display font-extrabold text-slate-900 tracking-tight">
            აღმოაჩინე ახალი შესაძლებლობები
          </h2>
          <p className="mt-3 text-lg text-slate-600 font-sans">
            სიახლეები, უფასო სასწავლო პროგრამები და კონკურსები ფოთელი ახალგაზრდებისთვის ერთ სივრცეში.
          </p>
        </div>

        {/* Filter and Search Bar */}
        {!isPreview && (
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-center mb-10 bg-white p-4 rounded-2xl shadow-xs border border-slate-100">
            {/* Categories Tab */}
            <div className="flex flex-wrap gap-2 w-full lg:w-auto">
              <button
                id="filter-all"
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                ყველა
              </button>
              <button
                id="filter-news"
                onClick={() => setSelectedCategory('news')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer transition-all ${
                  selectedCategory === 'news'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                სიახლეები
              </button>
              <button
                id="filter-training"
                onClick={() => setSelectedCategory('training')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer transition-all ${
                  selectedCategory === 'training'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                ტრენინგები
              </button>
              <button
                id="filter-contest"
                onClick={() => setSelectedCategory('contest')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer transition-all ${
                  selectedCategory === 'contest'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                კონკურსები
              </button>
              <button
                id="filter-general"
                onClick={() => setSelectedCategory('general')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer transition-all ${
                  selectedCategory === 'general'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                სხვადასხვა
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full lg:w-80">
              <Search className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-400" />
              <input
                id="hub-search-input"
                type="text"
                placeholder="ძიება ტექსტით..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-400/20 focus:border-slate-400 transition-all font-sans"
              />
            </div>
          </div>
        )}

        {/* Content Grid */}
        {displayItems.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-xs max-w-sm mx-auto">
            <HelpCircle className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">შედეგები ვერ მოიძებნა</p>
            <button
              onClick={() => { setSearchTerm(''); setSelectedCategory('all'); }}
              className="mt-3 px-4 py-2 text-xs font-semibold text-brand-600 hover:underline"
            >
              ფილტრების გასუფთავება
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayItems.map((item) => {
              const meta = getCategoryMeta(item.category);
              const CatIcon = meta.icon;
              return (
                <div
                  key={item.id}
                  id={`hub-item-card-${item.id}`}
                  className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group"
                >
                  {/* Card Cover */}
                  <div className="relative h-52 overflow-hidden bg-slate-150 cursor-pointer" onClick={() => handleItemClick(item)}>
                    <img
                      src={item.coverImage}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Floating badge */}
                    <div className="absolute top-4 left-4">
                      <span className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold border ${meta.colorClass} shadow-xs`}>
                        <CatIcon className="h-3.5 w-3.5" />
                        <span>{meta.label}</span>
                      </span>
                    </div>
                  </div>

                  {/* Card Description */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-semibold mb-2.5">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{item.date ? formatDisplayDate(item.date.substring(0, 10)) : ''}</span>
                      </div>
                      <h3 
                        className="font-display font-extrabold text-lg text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-2 leading-snug cursor-pointer"
                        onClick={() => handleItemClick(item)}
                      >
                        {item.title}
                      </h3>
                      <p className="mt-3 text-slate-500 text-sm line-clamp-3 font-sans leading-relaxed">
                        {item.summary}
                      </p>
                    </div>

                    {/* Metadata indicators inside card for specific types */}
                    <div className="mt-5 pt-4 border-t border-slate-50 flex items-center justify-between">
                      {item.deadline ? (
                        <div className="text-left">
                          <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">განაცხადის ვადა</span>
                          <span className="font-mono text-xs font-semibold text-rose-500">{formatDisplayDate(item.deadline)}</span>
                        </div>
                      ) : (
                        <div className="text-left">
                          <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">რუბრიკა</span>
                          <span className="text-xs font-medium text-slate-650">ახალგაზრდობა</span>
                        </div>
                      )}
                      
                      <button
                        onClick={() => handleItemClick(item)}
                        className="flex items-center space-x-1 text-xs font-bold text-slate-800 hover:text-brand-650 group/btn transition-colors cursor-pointer"
                      >
                        <span>სრულად</span>
                        <ArrowRight className="h-3.5 w-3.5 transform group-hover/btn:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {isPreview && (
          <div className="text-center mt-12">
            <button
              onClick={() => navigate('/news')}
              className="inline-flex items-center space-x-2 px-7 py-3.5 bg-brand-500 hover:bg-brand-600 text-white font-extrabold rounded-2xl text-sm shadow-md hover:shadow-brand-500/20 hover:scale-[1.02] active:scale-95 transition-all duration-200 cursor-pointer font-sans"
            >
              <span>სხვა სიახლეები</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Detailed Modal Reader */}
        {selectedItem && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex justify-center items-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl relative overflow-hidden my-8 max-h-[90vh] flex flex-col scrollbar-thin">
              
              {/* Cover Image in Modal */}
              <div className="relative h-64 sm:h-80 bg-slate-100 shrink-0">
                <img
                  src={selectedItem.coverImage}
                  alt={selectedItem.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => setSelectedItem(null)}
                  className="absolute top-4 right-4 bg-slate-900/70 text-white hover:bg-slate-900 p-2.5 rounded-full cursor-pointer transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
                <div className="absolute bottom-4 left-4">
                  <span className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-black tracking-wide border ${getCategoryMeta(selectedItem.category).colorClass} bg-white shadow-md`}>
                    {React.createElement(getCategoryMeta(selectedItem.category).icon, { className: "h-4 w-4" })}
                    <span>{getCategoryMeta(selectedItem.category).label}</span>
                  </span>
                </div>
              </div>

              {/* Scrollable Modal Content */}
              <div className="p-6 sm:p-8 overflow-y-auto flex-1">
                <div className="flex items-center space-x-2 text-xs text-slate-400 font-semibold mb-3">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>გამოქვეყნდა: {formatDisplayDate(selectedItem.date)}</span>
                </div>
                
                <h3 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900 leading-tight">
                  {selectedItem.title}
                </h3>

                {/* Specific features for vacancies/trainings/contests */}
                {(selectedItem.deadline || selectedItem.location || selectedItem.salaryRange) && (
                  <div className="mt-6 p-4 sm:p-5 bg-slate-50 border border-slate-100 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedItem.deadline && (
                      <div className="flex items-start space-x-3">
                        <Clock className="h-5 w-5 text-rose-500 mt-0.5 shrink-0" />
                        <div>
                          <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">განაცხადის ბოლო ვადა</span>
                          <span className="font-mono text-sm font-semibold text-slate-800">{formatDisplayDate(selectedItem.deadline)}</span>
                        </div>
                      </div>
                    )}
                    {selectedItem.location && (
                      <div className="flex items-start space-x-3">
                        <MapPin className="h-5 w-5 text-brand-500 mt-0.5 shrink-0" />
                        <div>
                          <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">ლოკაცია / ჩატარების ადგილი</span>
                          <span className="text-sm font-semibold text-slate-800">{selectedItem.location}</span>
                        </div>
                      </div>
                    )}
                    {selectedItem.salaryRange && (
                      <div className="flex items-start space-x-3">
                        <Briefcase className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
                        <div>
                          <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">ანაზღაურება / სტატუსი</span>
                          <span className="text-sm font-semibold text-slate-800">{selectedItem.salaryRange}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Main Content Body */}
                <div className="mt-6 text-slate-700 font-sans text-sm sm:text-base leading-relaxed space-y-4 whitespace-pre-line border-t border-slate-100 pt-6">
                  {selectedItem.content}
                </div>

                {/* Active Requirements List */}
                {selectedItem.requirements && selectedItem.requirements.length > 0 && (
                  <div className="mt-8 border-t border-slate-100 pt-6">
                    <h4 className="flex items-center space-x-2 font-display font-extrabold text-base text-slate-900 mb-4">
                      <Award className="h-5 w-5 text-amber-500" />
                      <span>ძირითადი მოთხოვნები & პირობები</span>
                    </h4>
                    <ul className="space-y-2.5">
                      {selectedItem.requirements.map((req, index) => (
                        <li key={index} className="flex items-start text-sm text-slate-600">
                          <span className="mr-2 text-brand-500 font-bold shrink-0">•</span>
                          <span className="font-sans">{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Modal footer with action buttons */}
              <div className="p-6 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row gap-3 justify-end shrink-0">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="px-5 py-2.5 rounded-xl font-semibold text-sm text-slate-500 hover:text-slate-700 bg-white border border-slate-200 transition-colors shadow-xs cursor-pointer text-center"
                >
                  დახურვა
                </button>
                {selectedItem.category === 'training' ? (
                  <a
                    href={selectedItem.trainingButtonLink || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setSelectedItem(null)}
                    className="px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-brand-500 hover:bg-brand-600 text-center transition-colors shadow-sm cursor-pointer flex items-center justify-center shrink-0"
                  >
                    {selectedItem.trainingButtonText || 'ლაივ რეგისტრაცია'}
                  </a>
                ) : selectedItem.category !== 'news' ? (
                  <button
                    onClick={() => {
                      setSelectedItem(null);
                      if (onNavigateToBooking) {
                        onNavigateToBooking();
                      }
                    }}
                    className="px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-brand-500 hover:bg-brand-600 text-center transition-colors shadow-sm cursor-pointer"
                  >
                    შეავსე განაცხადი / დაჯავშნე ოთახი
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
