/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Menu, X, Calendar, BookOpen, Image, ShieldCheck, Briefcase } from 'lucide-react';
// @ts-ignore
import logoImg from '../assets/images/small-logo.png';

interface NavbarProps {
  currentTab: 'user' | 'admin';
  setCurrentTab: (tab: 'user' | 'admin') => void;
  activeSection: string;
  setActiveSection: (sec: string) => void;
}

export default function Navbar({
  currentTab,
  setCurrentTab,
  activeSection,
  setActiveSection
}: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);

  // User Section links
  const navLinks = [
    { id: 'news', label: 'სიახლეები', icon: BookOpen },
    { id: 'booking', label: 'ოთახების დაჯავშნა', icon: Calendar },
    { id: 'gallery', label: 'გალერეა', icon: Image }
  ];

  const handleNavClick = (sectionId: string) => {
    setActiveSection(sectionId);
    setIsOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          {/* Logo and Brand Name */}
          <div className="flex items-center">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                handleNavClick('home');
              }}
              className="flex items-center space-x-3 cursor-pointer group no-underline"
              id="nav-logo"
            >
              <div className="bg-slate-50 p-1.5 rounded-2xl shadow-xs group-hover:bg-slate-100 transition-colors duration-200">
                <img src={logoImg} alt="Poti Youth Hub Logo" className="h-9 w-9 object-contain" />
              </div>
              <div className="text-left">
                <span className="block font-display font-bold text-sm sm:text-base tracking-tight text-slate-800 leading-tight">
                  ფოთის ახალგაზრდული ჰაბი
                </span>
                <span className="block font-sans text-[10px] sm:text-[11px] font-semibold text-brand-600 tracking-wider uppercase leading-none mt-0.5">
                  Poti Youth Hub
                </span>
              </div>
            </a>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {currentTab === 'user' && navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = activeSection === link.id;
              return (
                <a
                  key={link.id}
                  id={`nav-link-${link.id}`}
                  href={`/${link.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick(link.id);
                  }}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-slate-100 text-slate-900 border-none'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                  }`}
                >
                  <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
                  <span>{link.label}</span>
                </a>
              );
            })}

            {/* Portal Tab Switch (Admin Panel Toggle) */}
            {currentTab === 'admin' && (
              <div className="ml-4 pl-4 border-l border-slate-200">
                <button
                  id="tab-back-to-site"
                  onClick={() => {
                    setActiveSection('home');
                  }}
                  className="flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all duration-200 hover:shadow-xs cursor-pointer"
                >
                  <span>საიტზე დაბრუნება</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            <button
              id="mobile-menu-toggle"
              onClick={() => setIsOpen(!isOpen)}
              className="p-2.5 rounded-xl text-slate-600 bg-slate-50 hover:bg-slate-100 hover:text-slate-900 focus:outline-hidden cursor-pointer"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-6 space-y-2 shadow-lg animate-fadeIn">
          {currentTab === 'user' && navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = activeSection === link.id;
            return (
              <a
                key={link.id}
                id={`mobile-nav-link-${link.id}`}
                href={`/${link.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(link.id);
                }}
                className={`flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-left text-base font-semibold transition-colors duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-slate-50 text-brand-600'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
                <span>{link.label}</span>
              </a>
            );
          })}
          
          {currentTab === 'admin' && (
            <div className="pt-4 border-t border-slate-150">
              <button
                id="mobile-tab-back"
                onClick={() => {
                  setActiveSection('home');
                  setIsOpen(false);
                }}
                className="flex items-center justify-center space-x-2 w-full px-4 py-3 rounded-xl text-base font-bold text-slate-700 bg-slate-100 text-center"
              >
                <span>საიტზე დაბრუნება</span>
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
