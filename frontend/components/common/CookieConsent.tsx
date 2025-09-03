'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCookie, FaTimes, FaCog, FaShieldAlt, FaChartLine, FaUser } from 'react-icons/fa';
import React from 'react';

/** Interface for cookie consent preferences */
interface Preferences {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  timestamp: string;
  version: number;
}

/** Constants for cookie consent */
const CONSENT_STORAGE_KEY = 'unbbss_cookie_consent';
const CONSENT_VERSION = 2;
const CONSENT_EXPIRY_DAYS = 365;

/** Helper function to check if consent has expired */
const isConsentExpired = (timestamp: string): boolean => {
  const consentDate = new Date(timestamp);
  const expiryDate = new Date(consentDate);
  expiryDate.setDate(consentDate.getDate() + CONSENT_EXPIRY_DAYS);
  return new Date() > expiryDate;
};

/** Helper function to update cookie consent in localStorage */
const updateCookieConsent = (preferences: Partial<Preferences>) => {
  const consentData: Preferences = {
    necessary: true,
    functional: false,
    analytics: false,
    timestamp: new Date().toISOString(),
    version: CONSENT_VERSION,
    ...preferences,
  };
  
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consentData));
    
    // Dispatch custom event for other parts of the app to listen to
    window.dispatchEvent(new CustomEvent('cookieConsentUpdated', {
      detail: consentData
    }));
    
    // Optional: Notify backend of consent changes
    // fetch('/api/consent', { 
    //   method: 'POST', 
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(consentData) 
    // });
  } catch (error) {
    console.error('Failed to save cookie consent:', error);
  }
};

/** CookiePreference component for individual preference toggles */
const CookiePreference = React.memo(
  ({
    icon,
    label,
    description,
    checked,
    onChange,
    disabled = false,
  }: {
    icon: React.ReactNode;
    label: string;
    description: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
  }) => (
    <div className="bg-gray-800/50 backdrop-blur-sm p-5 rounded-xl border border-gray-700/50 hover:border-gray-600/50 transition-colors duration-200">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 mt-1">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-3">
            <label className="text-gray-100 font-semibold text-base" htmlFor={label.toLowerCase().replace(/\s+/g, '-')}>
              {label}
            </label>
            <div className="relative">
              <input
                id={label.toLowerCase().replace(/\s+/g, '-')}
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                disabled={disabled}
                className={`
                  w-5 h-5 rounded transition-all duration-200 focus:ring-2 focus:ring-green-500/50 focus:ring-offset-2 focus:ring-offset-gray-900
                  ${disabled 
                    ? 'bg-gray-600 border-gray-500 cursor-not-allowed' 
                    : 'bg-gray-700 border-gray-600 hover:border-gray-500 text-green-500 cursor-pointer'
                  }
                `}
                aria-checked={checked}
                aria-disabled={disabled}
              />
            </div>
          </div>
          <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  )
);

CookiePreference.displayName = 'CookiePreference';

/** Main CookieConsent component */
export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<Preferences>({
    necessary: true,
    functional: false,
    analytics: false,
    timestamp: new Date().toISOString(),
    version: CONSENT_VERSION,
  });
  const [isLoading, setIsLoading] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  /** Load consent from localStorage on mount */
  useEffect(() => {
    try {
      const consent = localStorage.getItem(CONSENT_STORAGE_KEY);
      if (!consent) {
        setShowBanner(true);
        return;
      }

      const parsedConsent = JSON.parse(consent);
      
      // Check if consent needs to be renewed
      if (parsedConsent.version < CONSENT_VERSION || isConsentExpired(parsedConsent.timestamp)) {
        setShowBanner(true);
        return;
      }

      setPreferences(parsedConsent);
    } catch (error) {
      console.error('Failed to load cookie consent:', error);
      setShowBanner(true);
    }
  }, []);

  /** Focus management for accessibility */
  useEffect(() => {
    if (showBanner && modalRef.current) {
      modalRef.current.focus();
    }
  }, [showBanner]);

  /** Handle Accept All with loading state */
  const acceptAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const allAccepted: Preferences = {
        necessary: true,
        functional: true,
        analytics: true,
        timestamp: new Date().toISOString(),
        version: CONSENT_VERSION,
      };
      updateCookieConsent(allAccepted);
      setPreferences(allAccepted);
      
      // Small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setShowBanner(false);
      setShowSettings(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /** Handle Accept Selected */
  const acceptSelected = useCallback(async () => {
    setIsLoading(true);
    try {
      updateCookieConsent(preferences);
      
      // Small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setShowBanner(false);
      setShowSettings(false);
    } finally {
      setIsLoading(false);
    }
  }, [preferences]);

  /** Handle Reject All */
  const rejectAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const minimal: Preferences = {
        necessary: true,
        functional: false,
        analytics: false,
        timestamp: new Date().toISOString(),
        version: CONSENT_VERSION,
      };
      updateCookieConsent(minimal);
      setPreferences(minimal);
      
      // Small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setShowBanner(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /** Handle escape key for accessibility */
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showBanner) {
        if (showSettings) {
          setShowSettings(false);
        } else {
          setShowBanner(false);
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showBanner, showSettings]);

  if (!showBanner) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowBanner(false);
          }
        }}
      >
        <motion.div
          ref={modalRef}
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 rounded-2xl p-8 w-full max-w-2xl shadow-2xl border border-gray-700/50 backdrop-blur-xl"
          role="dialog"
          aria-labelledby="cookie-consent-title"
          aria-describedby="cookie-consent-description"
          tabIndex={-1}
          onClick={(e) => e.stopPropagation()}
        >
          {!showSettings ? (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-yellow-500/20 rounded-full">
                    <FaCookie className="text-yellow-400 text-2xl" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 id="cookie-consent-title" className="text-white font-bold text-2xl">
                      Cookie Preferences
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">University of New Brunswick BSS</p>
                  </div>
                </div>
                <Button
                  onClick={() => setShowBanner(false)}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white hover:bg-gray-800 transition-colors duration-200"
                  aria-label="Close cookie consent dialog"
                >
                  <FaTimes className="text-lg" />
                </Button>
              </div>

              {/* Description */}
              <div className="bg-blue-900/20 border border-blue-700/30 rounded-xl p-4">
                <p id="cookie-consent-description" className="text-gray-300 text-sm leading-relaxed">
                  We use cookies to ensure secure authentication, manage your session data, and improve our platform. 
                  Your privacy is our priority – data stays local and is never shared with third parties.{' '}
                  <a 
                    href="/learn-more" 
                    className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors duration-200" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    aria-label="Learn more about our cookie policy (opens in new tab)"
                  >
                    Learn more about our privacy practices
                  </a>
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-end">
                <Button
                  onClick={rejectAll}
                  disabled={isLoading}
                  variant="outline"
                  size="default"
                  className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white hover:border-gray-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Reject all non-essential cookies"
                >
                  {isLoading ? 'Processing...' : 'Reject All'}
                </Button>
                <Button
                  onClick={() => setShowSettings(true)}
                  disabled={isLoading}
                  variant="outline"
                  size="default"
                  className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white hover:border-gray-500 transition-all duration-200"
                  aria-label="Customize cookie settings"
                >
                  <FaCog className="mr-2" aria-hidden="true" />
                  Customize
                </Button>
                <Button
                  onClick={acceptAll}
                  disabled={isLoading}
                  size="default"
                  className="bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-green-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Accept all cookies"
                >
                  {isLoading ? 'Processing...' : 'Accept All'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Settings Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 id="cookie-preferences-title" className="text-white font-bold text-2xl">
                    Customize Your Experience
                  </h3>
                  <p className="text-gray-400 text-sm mt-2">
                    Choose which cookies you're comfortable with
                  </p>
                </div>
                <Button
                  onClick={() => setShowSettings(false)}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white hover:bg-gray-800 transition-colors duration-200"
                  aria-label="Close settings and return to main dialog"
                >
                  <FaTimes className="text-lg" />
                </Button>
              </div>

              {/* Cookie Preferences */}
              <div className="space-y-4">
                <CookiePreference
                  icon={<FaShieldAlt className="text-green-400 text-xl" />}
                  label="Essential Cookies"
                  description="Required for authentication, secure sessions, form submissions, and core functionality. These cookies cannot be disabled as they're necessary for the website to work properly."
                  checked={preferences.necessary}
                  onChange={() => {}}
                  disabled={true}
                />
                
                <CookiePreference
                  icon={<FaUser className="text-blue-400 text-xl" />}
                  label="Functional Cookies"
                  description="Remember your preferences, settings, and choices to provide a personalized experience across your visits. These enhance usability but aren't essential."
                  checked={preferences.functional}
                  onChange={(checked) => setPreferences((prev) => ({ ...prev, functional: checked }))}
                />
                
                <CookiePreference
                  icon={<FaChartLine className="text-purple-400 text-xl" />}
                  label="Analytics Cookies"
                  description="Help us understand how you interact with our website through anonymous usage statistics. This data helps us improve the platform and user experience."
                  checked={preferences.analytics}
                  onChange={(checked) => setPreferences((prev) => ({ ...prev, analytics: checked }))}
                />
              </div>

              {/* Settings Actions */}
              <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t border-gray-700/50">
                <Button
                  onClick={() => setShowSettings(false)}
                  variant="outline"
                  size="default"
                  className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white hover:border-gray-500 transition-all duration-200"
                >
                  Cancel
                </Button>
                <Button
                  onClick={acceptSelected}
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-green-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Save your cookie preferences"
                >
                  {isLoading ? 'Saving...' : 'Save Preferences'}
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}