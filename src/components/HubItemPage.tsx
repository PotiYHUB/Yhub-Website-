import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HubItem, HubCategory } from '../types';
import { Calendar, MapPin, Award, Clock, ArrowLeft, Briefcase, Trophy, GraduationCap, Share2, Check, HelpCircle, X } from 'lucide-react';
// @ts-ignore
import logoImg from '../assets/images/small-logo.png';

interface HubItemPageProps {
  hubItems: HubItem[];
  onNavigateToBooking: () => void;
}

export default function HubItemPage({ hubItems, onNavigateToBooking }: HubItemPageProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const item = hubItems.find((p) => p.id === id);

  // Scroll to top on load and check redirect
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (item && item.customUrl) {
      const url = item.customUrl.startsWith('http://') || item.customUrl.startsWith('https://')
        ? item.customUrl 
        : 'https://' + item.customUrl;
      window.location.replace(url);
    }
  }, [id, item]);

  if (!item) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 text-center bg-slate-50">
        <div className="max-w-md bg-white border border-slate-200 p-8 rounded-3xl shadow-lg">
          <HelpCircle className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h2 className="font-display font-black text-2xl text-slate-900">სტატია ვერ მოიძებნა</h2>
          <p className="mt-2 text-sm text-slate-500 font-sans leading-relaxed">
            მითითებული ბმულით აქტივობა ან ინფორმაცია ვერ მოიძებნა. შესაძლოა ის წაიშალა ან შეიცვალა მისამართი.
          </p>
          <button
            onClick={() => navigate('/')}
            className="mt-6 px-6 py-3 bg-slate-900 hover:bg-slate-850 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer flex items-center justify-center space-x-2 mx-auto"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>უკან სიახლეებში</span>
          </button>
        </div>
      </div>
    );
  }

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

  const meta = getCategoryMeta(item.category);
  const CatIcon = meta.icon;

  const handleShare = async () => {
    const shareUrl = window.location.href;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        // Fallback for iFrame or unsecured contexts
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Navigation Actions */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-xs cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>უკან სიახლეებში</span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center space-x-2 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-xs cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-500 animate-scaleIn" />
                <span className="text-emerald-600">ბმული კოპირებულია!</span>
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4 text-slate-400" />
                <span>გაზიარება</span>
              </>
            )}
          </button>
        </div>

        {/* Article Box */}
        <article className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-lg" id={`hub-article-${item.id}`}>
          
          {/* Cover Image */}
          <div className="relative h-64 sm:h-96 md:h-[450px] bg-slate-100">
            <img
              src={item.coverImage}
              alt={item.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-6 left-6">
              <span className={`inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-black tracking-wide border ${meta.colorClass} bg-white shadow-md`}>
                <CatIcon className="h-4 w-4" />
                <span>{meta.label}</span>
              </span>
            </div>
          </div>

          <div className="p-6 sm:p-10 md:p-12">
            
            {/* Meta details */}
            <div className="flex items-center space-x-2 text-xs sm:text-sm text-slate-400 font-semibold mb-4">
              <Calendar className="h-4 w-4 text-slate-450" />
              <span>გამოქვეყნდა: {item.date}</span>
            </div>
            
            <h1 className="font-display font-black text-3xl sm:text-4xl md:text-5xl text-slate-900 leading-tight tracking-tight">
              {item.title}
            </h1>

            {/* Sub-summary */}
            <p className="mt-4 text-base sm:text-lg text-slate-600 font-sans leading-relaxed border-l-4 border-brand-500 pl-4 py-1 italic bg-slate-50/50 pr-2 rounded-r-xl">
              {item.summary}
            </p>

            {/* Field Metadata box for vacancies/trainings/contests */}
            {(item.deadline || item.location || item.salaryRange) && (
              <div className="mt-8 p-5 sm:p-6 bg-slate-50 border border-slate-100 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4">
                {item.deadline && (
                  <div className="flex items-start space-x-3">
                    <Clock className="h-5.5 w-5.5 text-rose-500 mt-0.5 shrink-0" />
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">განაცხადის ვადა</span>
                      <span className="font-mono text-sm font-semibold text-slate-800">{item.deadline}</span>
                    </div>
                  </div>
                )}
                {item.location && (
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5.5 w-5.5 text-brand-500 mt-0.5 shrink-0" />
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">ჩატარების ადგილი</span>
                      <span className="text-sm font-semibold text-slate-800">{item.location}</span>
                    </div>
                  </div>
                )}
                {item.salaryRange && (
                  <div className="flex items-start space-x-3">
                    <Briefcase className="h-5.5 w-5.5 text-emerald-500 mt-0.5 shrink-0" />
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">სექცია / ანაზღაურება</span>
                      <span className="text-sm font-semibold text-slate-800">{item.salaryRange}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Main Content Body */}
            <div className="mt-8 text-slate-800 font-sans text-base sm:text-lg leading-relaxed space-y-5 whitespace-pre-line border-t border-slate-100 pt-8">
              {item.content}
            </div>

            {/* Gallery (More than 1 picture if uploaded) */}
            {item.additionalImages && item.additionalImages.length > 0 && (
              <div className="mt-10 border-t border-slate-150 pt-8">
                <h3 className="font-display font-black text-lg text-slate-900 mb-5 text-left">
                  პუბლიკაციის გალერეა ({item.additionalImages.length})
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {item.additionalImages.map((imgUrl, index) => (
                    <div 
                      key={index} 
                      onClick={() => setLightboxImage(imgUrl)}
                      className="relative aspect-square sm:aspect-4/3 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 cursor-zoom-in group transition-all duration-300 hover:shadow-md hover:scale-[1.02] hover:border-slate-350"
                    >
                      <img
                        src={imgUrl}
                        alt={`გალერეა ${index + 1}`}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/15 transition-all flex items-center justify-center">
                        <span className="opacity-0 group-hover:opacity-100 bg-white/90 text-slate-800 text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-md transition-opacity duration-300">
                          დიდი ზომით ნახვა
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Requirements / Conditions box */}
            {item.requirements && item.requirements.length > 0 && (
              <div className="mt-10 border-t border-slate-150 pt-8">
                <h3 className="flex items-center space-x-2.5 font-display font-black text-lg text-slate-900 mb-5 text-left">
                  <Award className="h-5.5 w-5.5 text-amber-500" />
                  <span>ძირითადი პირობები & მოთხოვნები</span>
                </h3>
                <ul className="space-y-3">
                  {item.requirements.map((req, index) => (
                    <li key={index} className="flex items-start text-sm sm:text-base text-slate-600">
                      <span className="mr-3 text-brand-500 font-black shrink-0 text-lg leading-none">•</span>
                      <span className="font-sans font-light leading-relaxed">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Call for Hub elements (Register/Book) */}
            {item.category === 'training' ? (
              <div className="mt-12 p-6 bg-brand-50/50 border border-brand-100 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-left">
                  <span className="block text-[11px] text-brand-600 font-bold uppercase tracking-wider">ჰაბის ინტეგრირებული სისტემა</span>
                  <span className="block font-display font-bold text-slate-900 text-base mt-0.5">გსურს მონაწილეობის მიღება?</span>
                </div>
                <a
                  href={item.trainingButtonLink || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-2xl text-sm transition-all shadow-md active:scale-98 cursor-pointer w-full md:w-auto text-center font-sans whitespace-nowrap flex items-center justify-center"
                >
                  {item.trainingButtonText || 'ლაივ რეგისტრაცია'}
                </a>
              </div>
            ) : item.category !== 'news' ? (
              <div className="mt-12 p-6 bg-brand-50/50 border border-brand-100 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-left">
                  <span className="block text-[11px] text-brand-600 font-bold uppercase tracking-wider">ჰაბის ინტეგრირებული სისტემა</span>
                  <span className="block font-display font-bold text-slate-900 text-base mt-0.5">გსურს მონაწილეობის მიღება?</span>
                </div>
                <button
                  onClick={onNavigateToBooking}
                  className="px-6 py-3.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-2xl text-sm transition-all shadow-md active:scale-98 cursor-pointer w-full md:w-auto text-center font-sans whitespace-nowrap"
                >
                  შეავსე განაცხადი / დაჯავშნე ოთახი
                </button>
              </div>
            ) : null}

          </div>
        </article>

      </div>

      {lightboxImage && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn cursor-zoom-out"
          onClick={() => setLightboxImage(null)}
        >
          <button 
            type="button"
            onClick={() => setLightboxImage(null)}
            className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer animate-scaleIn"
          >
            <X className="h-6 w-6" />
          </button>
          <div className="max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl border border-white/15 bg-slate-900 shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
            <img 
              src={lightboxImage} 
              alt="სურათის ხედი" 
              className="max-w-full max-h-[85vh] object-contain rounded-xl transition-all"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}
    </div>
  );
}
