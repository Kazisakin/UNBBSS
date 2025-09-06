'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { motion } from 'framer-motion';
import { FaSpinner, FaExclamationTriangle, FaShieldAlt, FaWifi } from 'react-icons/fa';

interface AuthWrapperProps {
  children: React.ReactNode;
  requireRole?: 'ADMIN' | 'SUPER_ADMIN' | null;
}

interface AdminProfile {
  id: string;
  email: string;
  name?: string;
  role: 'ADMIN' | 'SUPER_ADMIN';
  mustChangePassword: boolean;
  twoFactorEnabled: boolean;
}

export default function AdminAuthWrapper({ children, requireRole = null }: AuthWrapperProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      checkAuthentication();
    }
  }, []);

  const checkAuthentication = async () => {
    try {
      setIsLoading(true);
      setError('');

      const token = localStorage.getItem('adminToken');
      if (!token) {
        setIsAuthenticated(false);
        redirectToLogin();
        return;
      }

      const isAuth = await apiClient.checkAuthStatus();
      if (!isAuth) {
        setIsAuthenticated(false);
        clearAuthData();
        redirectToLogin();
        return;
      }

      const profile = await apiClient.getProfile();
      setAdminProfile(profile);
      setIsAuthenticated(true);

      if (requireRole && profile.role !== requireRole && profile.role !== 'SUPER_ADMIN') {
        setError(`This area requires ${requireRole} privileges. You currently have ${profile.role} access.`);
        setIsAuthenticated(false);
        return;
      }

      if (profile.mustChangePassword) {
        router.push('/admin/change-password');
        return;
      }

      setRetryCount(0);

    } catch (err: any) {
      console.error('Authentication check failed:', err);
      
      // User-friendly error messages based on error type
      let userMessage = '';
      let canRetry = false;

      if (err.message?.includes('401') || err.message?.includes('Authentication required')) {
        userMessage = 'Your session has expired. Please log in again.';
        clearAuthData();
        setTimeout(() => redirectToLogin(), 2000);
      } else if (err.message?.includes('Network') || err.message?.includes('fetch') || err.message?.includes('Failed to fetch')) {
        userMessage = 'Connection issue. Please check your internet and try again.';
        canRetry = true;
      } else if (err.message?.includes('403')) {
        userMessage = 'You don\'t have permission to access this area. Please contact an administrator.';
      } else if (err.message?.includes('500') || err.message?.includes('502') || err.message?.includes('503')) {
        userMessage = 'The server is experiencing issues. Please try again in a few moments.';
        canRetry = true;
      } else {
        userMessage = 'Something went wrong. Please try again or contact support if the issue persists.';
        canRetry = true;
      }
      
      setError(userMessage);
      setIsAuthenticated(false);
      
      if (canRetry && retryCount < 3) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          checkAuthentication();
        }, 3000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const clearAuthData = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('adminToken');
    }
    setAdminProfile(null);
  };

  const redirectToLogin = () => {
    router.push('/admin/login');
  };

  // Loading state with animated shield
  if (isLoading || isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 w-20 h-20 border-4 border-green-500/20 rounded-full border-t-green-500"
            />
            <FaShieldAlt className="text-green-500 w-12 h-12 m-4" />
          </div>
          <p className="text-white text-lg font-medium mt-6">Securing your session</p>
          <p className="text-gray-400 text-sm mt-2">Verifying credentials...</p>
        </motion.div>
      </div>
    );
  }

  // Error state with retry option
  if (error) {
    const isNetworkError = error.includes('Connection') || error.includes('internet');
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-xl p-8 max-w-md w-full shadow-2xl border border-gray-700"
        >
          <div className="flex justify-center mb-6">
            {isNetworkError ? (
              <FaWifi className="text-amber-500 text-5xl" />
            ) : (
              <FaExclamationTriangle className="text-red-500 text-5xl" />
            )}
          </div>
          
          <h1 className="text-2xl font-bold text-white text-center mb-4">
            {isNetworkError ? 'Connection Issue' : 'Access Issue'}
          </h1>
          
          <p className="text-gray-300 text-center mb-8 leading-relaxed">
            {error}
          </p>
          
          <div className="space-y-3">
            {isNetworkError && (
              <button
                onClick={checkAuthentication}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-3 rounded-lg transition-all hover:shadow-lg"
              >
                Try Again
              </button>
            )}
            <button
              onClick={redirectToLogin}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium px-6 py-3 rounded-lg transition-all"
            >
              Go to Login
            </button>
          </div>
          
          {retryCount > 0 && (
            <p className="text-gray-500 text-xs text-center mt-4">
              Retry attempt {retryCount} of 3
            </p>
          )}
        </motion.div>
      </div>
    );
  }

  // Access denied for role mismatch
  if (!isAuthenticated || (requireRole && adminProfile && adminProfile.role !== requireRole && adminProfile.role !== 'SUPER_ADMIN')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-xl p-8 max-w-md w-full shadow-2xl border border-gray-700"
        >
          <FaShieldAlt className="text-amber-500 text-5xl mx-auto mb-6" />
          
          <h1 className="text-2xl font-bold text-white text-center mb-4">
            Access Restricted
          </h1>
          
          {requireRole ? (
            <div className="space-y-4 text-center">
              <p className="text-gray-300">
                This area requires <span className="font-semibold text-amber-400">{requireRole}</span> privileges.
              </p>
              {adminProfile && (
                <p className="text-gray-400 text-sm">
                  Your current role: <span className="font-medium text-white">{adminProfile.role}</span>
                </p>
              )}
              <p className="text-gray-500 text-sm">
                Please contact a system administrator if you believe you should have access.
              </p>
            </div>
          ) : (
            <p className="text-gray-300 text-center mb-6">
              Please log in to access the admin dashboard.
            </p>
          )}

          <div className="space-y-3 mt-8">
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium px-6 py-3 rounded-lg transition-all"
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium px-6 py-3 rounded-lg transition-all"
            >
              Return Home
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Authenticated and authorized - render children
  return <>{children}</>;
}