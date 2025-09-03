'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';
import { motion } from 'framer-motion';
import { FaPlus, FaCopy, FaEye, FaEdit } from 'react-icons/fa';
import CreateEventModal from '@/src/app/admin/dashboard/components/CreateEventModal';

interface Event {
  id: string;
  name: string;
  description?: string;
  slug: string;
  nominationStartTime: string;
  nominationEndTime: string;
  withdrawalStartTime: string;
  withdrawalEndTime: string;
  eligibleEmails: string[];
  isActive: boolean;
  nominationLink: string;
  _count: {
    nominations: number;
  };
}

export default function AdminDashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState('');
  const [copiedLink, setCopiedLink] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.push('/admin/login');
        return;
      }
    }

    loadEvents();
  }, [router]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getEvents();
      setEvents(response.events);
    } catch (err: any) {
      setError('Failed to load events');
      if (err.message.includes('token')) {
        router.push('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEventCreated = (newEvent: Event) => {
    setEvents([newEvent, ...events]);
    setShowCreateModal(false);
    
    // Show the link popup
    const fullLink = `http://localhost:3000/nominate/${newEvent.slug}`;
    setCopiedLink(fullLink);
    
    // Auto copy to clipboard
    navigator.clipboard.writeText(fullLink);
    
    // Show success message for 3 seconds
    setTimeout(() => setCopiedLink(''), 3000);
  };

  const copyLink = (slug: string) => {
    const link = `http://localhost:3000/nominate/${slug}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(link);
    setTimeout(() => setCopiedLink(''), 2000);
  };

  const logout = () => {
    apiClient.clearToken();
    router.push('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <div className="flex gap-4">
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <FaPlus className="mr-2" />
              Create Event
            </Button>
            <Button
              onClick={logout}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Success popup for copied link */}
      {copiedLink && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
        >
          <div className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
            <FaCopy />
            <div>
              <div className="font-semibold">Link Copied!</div>
              <div className="text-sm opacity-90">{copiedLink}</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Nomination Events</h2>
          
          {error && (
            <div className="bg-red-600/20 border border-red-600/20 rounded-lg p-4 mb-4 text-red-100">
              {error}
            </div>
          )}

          {events.length === 0 ? (
            <div className="bg-gray-800 rounded-lg p-8 text-center">
              <div className="text-gray-400 mb-4">No events created yet</div>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <FaPlus className="mr-2" />
                Create Your First Event
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {events.map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-green-600/50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{event.name}</h3>
                      {event.description && (
                        <p className="text-gray-400 mt-1">{event.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => copyLink(event.slug)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <FaCopy className="mr-1" />
                        Copy Link
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-gray-600"
                      >
                        <FaEye className="mr-1" />
                        View ({event._count?.nominations || 0})
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-gray-600"
                      >
                        <FaEdit className="mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-400">Nomination Period</div>
                      <div className="text-white">
                        {new Date(event.nominationStartTime).toLocaleDateString()} - {new Date(event.nominationEndTime).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-400">Withdrawal Period</div>
                      <div className="text-white">
                        {new Date(event.withdrawalStartTime).toLocaleDateString()} - {new Date(event.withdrawalEndTime).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-400">Eligible Voters</div>
                      <div className="text-white">{event.eligibleEmails.length} emails</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Status</div>
                      <div className={event.isActive ? 'text-green-400' : 'text-red-400'}>
                        {event.isActive ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Event Modal */}
      <CreateEventModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onEventCreated={handleEventCreated}
      />
    </div>
  );
}