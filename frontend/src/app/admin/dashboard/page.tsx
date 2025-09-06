'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import AdminAuthWrapper from '@/components/admin/AdminAuthWrapper';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { 
  FaPlus, FaCopy, FaEye, FaEdit, FaChartBar, FaSpinner, 
  FaSignOutAlt, FaCheck, FaClock, FaUsers, FaVoteYea, 
  FaCalendarAlt, FaShieldAlt, FaBell, FaSyncAlt, FaExternalLinkAlt,
  FaTachometerAlt, FaClipboardList, FaChartPie
} from 'react-icons/fa';

// Import modal components
import CreateEventModal from '@/src/app/admin/dashboard/components/CreateEventModal';
import CreateVotingEventModal from '@/components/admin/CreateVotingEventModal';
import EventDetailsModal from '@/components/admin/EventDetailsModal';

// Component Types
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
  enableTimeCheck: boolean;
  enableNominationTime: boolean;
  enableWithdrawalTime: boolean;
  _count: { nominations: number };
}

interface VotingEvent {
  id: string;
  name: string;
  description?: string;
  slug: string;
  votingStartTime: string;
  votingEndTime: string;
  eligibleEmails: string[];
  candidates?: any[];
  isActive: boolean;
  enableTimeCheck: boolean;
  enableVotingTime: boolean;
  _count: { votes: number };
}

interface AdminProfile {
  id: string;
  email: string;
  name?: string;
  role: 'ADMIN' | 'SUPER_ADMIN';
  lastLoginAt?: string;
}

// Skeleton Loaders
const EventSkeleton = () => (
  <div className="bg-gray-800 rounded-xl p-6 animate-pulse">
    <div className="flex justify-between items-start mb-4">
      <div className="flex-1">
        <div className="h-6 bg-gray-700 rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-gray-700 rounded w-2/3"></div>
      </div>
      <div className="flex gap-2">
        <div className="h-9 w-24 bg-gray-700 rounded"></div>
        <div className="h-9 w-24 bg-gray-700 rounded"></div>
      </div>
    </div>
    <div className="grid grid-cols-4 gap-4 mt-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-12 bg-gray-700 rounded"></div>
      ))}
    </div>
  </div>
);

const StatsCard = ({ icon: Icon, title, value, subtitle, color, trend }: any) => (
  <motion.div
    whileHover={{ y: -2 }}
    className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all"
  >
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-gray-400 text-sm mb-1">{title}</p>
        <p className="text-3xl font-bold text-white">{value}</p>
        {subtitle && (
          <p className="text-gray-500 text-xs mt-1">{subtitle}</p>
        )}
        {trend && (
          <p className={`text-xs mt-2 ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% from last week
          </p>
        )}
      </div>
      <div className={`w-12 h-12 rounded-lg bg-${color}-500/20 flex items-center justify-center`}>
        <Icon className={`text-${color}-500 text-xl`} />
      </div>
    </div>
  </motion.div>
);

const EmptyState = ({ type, onCreate }: { type: 'nomination' | 'voting'; onCreate: () => void }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="text-center py-16 bg-gray-800 rounded-xl border-2 border-dashed border-gray-700"
  >
    <div className="text-6xl mb-4">
      {type === 'nomination' ? '📋' : '🗳️'}
    </div>
    <h3 className="text-xl font-medium text-gray-300 mb-2">
      No {type === 'nomination' ? 'Nomination' : 'Voting'} Events Yet
    </h3>
    <p className="text-gray-500 mb-6 max-w-md mx-auto">
      Get started by creating your first {type === 'nomination' ? 'nomination' : 'voting'} event.
      It only takes a few minutes.
    </p>
    <Button
      onClick={onCreate}
      className="bg-green-600 hover:bg-green-700"
    >
      <FaPlus className="mr-2" />
      Create First Event
    </Button>
  </motion.div>
);

const QuickActionCard = ({ icon: Icon, title, subtitle, onClick, color = 'green' }: any) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="p-4 bg-gray-800 rounded-xl border border-gray-700 hover:border-gray-600 transition-all text-left w-full"
  >
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 bg-${color}-500/20 rounded-lg flex items-center justify-center`}>
        <Icon className={`text-${color}-500`} />
      </div>
      <div>
        <p className="text-white font-medium">{title}</p>
        <p className="text-gray-500 text-sm">{subtitle}</p>
      </div>
    </div>
  </motion.button>
);

const NotificationToast = ({ message, type, onClose }: any) => (
  <motion.div
    initial={{ opacity: 0, y: -50 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -50 }}
    className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
      type === 'success' ? 'bg-green-600' : 
      type === 'error' ? 'bg-red-600' : 'bg-blue-600'
    } text-white max-w-md`}
  >
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <FaCheck />
        <p>{message}</p>
      </div>
      <button onClick={onClose} className="hover:opacity-80">×</button>
    </div>
  </motion.div>
);

function DashboardContent() {
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [votingEvents, setVotingEvents] = useState<VotingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateVotingModal, setShowCreateVotingModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedNominationEventId, setSelectedNominationEventId] = useState<string | null>(null);
  
  // Notifications
  const [notifications, setNotifications] = useState<Array<{ id: string; message: string; type: string }>>([]);
  
  const router = useRouter();

  useEffect(() => {
    loadDashboardData();
    
    // Listen for API notifications
    const handleNotification = (e: CustomEvent) => {
      showNotification(e.detail.message, e.detail.type);
    };
    
    window.addEventListener('api-notification' as any, handleNotification as any);
    return () => {
      window.removeEventListener('api-notification' as any, handleNotification as any);
    };
  }, []);

  const loadDashboardData = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      else setRefreshing(true);

      const [profileRes, eventsRes, votingRes] = await Promise.allSettled([
        apiClient.getProfile(),
        apiClient.getNominationEvents(),
        apiClient.getVotingEvents(),
      ]);

      if (profileRes.status === 'fulfilled') {
        setAdminProfile(profileRes.value);
      }

      if (eventsRes.status === 'fulfilled') {
        setEvents(eventsRes.value.events || []);
      }

      if (votingRes.status === 'fulfilled') {
        setVotingEvents(votingRes.value.events || []);
      }

      if (isRefresh) {
        showNotification('Dashboard refreshed successfully', 'success');
      }
    } catch (err) {
      showNotification('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const showNotification = (message: string, type: string = 'info') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const copyLink = (slug: string, type: 'nominate' | 'vote') => {
    const link = `${window.location.origin}/${type}/${slug}`;
    navigator.clipboard.writeText(link).then(() => {
      showNotification(`${type === 'nominate' ? 'Nomination' : 'Voting'} link copied!`, 'success');
    });
  };

  const handleEventCreated = (newEvent: Event) => {
    setEvents([newEvent, ...events]);
    setShowCreateModal(false);
    showNotification('Nomination event created successfully!', 'success');
  };

  const handleVotingEventCreated = (newEvent: VotingEvent) => {
    setVotingEvents([newEvent, ...votingEvents]);
    setShowCreateVotingModal(false);
    showNotification('Voting event created successfully!', 'success');
  };

  const logout = async () => {
    try {
      await apiClient.logout();
      router.push('/admin/login');
    } catch (err) {
      showNotification('Logout failed', 'error');
    }
  };

  const getEventStatus = (event: Event | VotingEvent) => {
    const now = new Date();
    
    if ('nominationStartTime' in event) {
      const start = new Date(event.nominationStartTime);
      const end = new Date(event.nominationEndTime);
      
      if (now < start) return { status: 'upcoming', color: 'bg-blue-500', text: 'Upcoming' };
      if (now >= start && now <= end) return { status: 'active', color: 'bg-green-500 animate-pulse', text: 'Active' };
      return { status: 'ended', color: 'bg-gray-500', text: 'Ended' };
    } else {
      const start = new Date(event.votingStartTime);
      const end = new Date(event.votingEndTime);
      
      if (now < start) return { status: 'upcoming', color: 'bg-blue-500', text: 'Upcoming' };
      if (now >= start && now <= end) return { status: 'active', color: 'bg-green-500 animate-pulse', text: 'Voting Open' };
      return { status: 'ended', color: 'bg-gray-500', text: 'Ended' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <FaTachometerAlt className="text-green-500 w-16 h-16 mx-auto mb-4 animate-pulse" />
          <p className="text-white text-xl">Loading your dashboard...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      {/* Header */}
      <div className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <FaShieldAlt className="text-green-500 text-2xl" />
              <div>
                <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
                <p className="text-gray-400 text-sm">
                  Welcome back, {adminProfile?.name || adminProfile?.email}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                onClick={() => loadDashboardData(true)}
                disabled={refreshing}
                variant="outline"
                size="sm"
                className="border-gray-600"
              >
                {refreshing ? <FaSpinner className="animate-spin mr-2" /> : <FaSyncAlt className="mr-2" />}
                Refresh
              </Button>
              
              <Button
                onClick={logout}
                variant="outline"
                size="sm"
                className="border-gray-600"
              >
                <FaSignOutAlt className="mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <AnimatePresence>
        {notifications.map(notification => (
          <NotificationToast
            key={notification.id}
            message={notification.message}
            type={notification.type}
            onClose={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
          />
        ))}
      </AnimatePresence>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatsCard
            icon={FaCalendarAlt}
            title="Nomination Events"
            value={events.length}
            subtitle={`${events.filter(e => e.isActive).length} active`}
            color="green"
          />
          <StatsCard
            icon={FaVoteYea}
            title="Voting Events"
            value={votingEvents.length}
            subtitle={`${votingEvents.filter(e => e.isActive).length} active`}
            color="purple"
          />
          <StatsCard
            icon={FaUsers}
            title="Total Nominations"
            value={events.reduce((sum, e) => sum + (e._count?.nominations || 0), 0)}
            subtitle="across all events"
            color="blue"
          />
          <StatsCard
            icon={FaChartBar}
            title="Total Votes"
            value={votingEvents.reduce((sum, e) => sum + (e._count?.votes || 0), 0)}
            subtitle="across all events"
            color="amber"
          />
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <QuickActionCard
              icon={FaPlus}
              title="New Nomination"
              subtitle="Create event"
              onClick={() => setShowCreateModal(true)}
              color="green"
            />
            <QuickActionCard
              icon={FaVoteYea}
              title="New Voting"
              subtitle="Setup voting"
              onClick={() => setShowCreateVotingModal(true)}
              color="purple"
            />
            <QuickActionCard
              icon={FaClipboardList}
              title="View All Events"
              subtitle="Manage events"
              onClick={() => setActiveTab('events')}
              color="blue"
            />
            <QuickActionCard
              icon={FaChartPie}
              title="Analytics"
              subtitle="View reports"
              onClick={() => setActiveTab('analytics')}
              color="amber"
            />
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-gray-800 border border-gray-700 mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="events">All Events</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            {adminProfile?.role === 'SUPER_ADMIN' && (
              <TabsTrigger value="system">System</TabsTrigger>
            )}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            {/* Active Events Section */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Active Events</h3>
                <Button
                  onClick={() => setActiveTab('events')}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white"
                >
                  View All →
                </Button>
              </div>
              
              <div className="grid gap-4">
                {events.filter(e => {
                  const status = getEventStatus(e);
                  return status.status === 'active';
                }).slice(0, 3).map(event => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-800 rounded-xl p-6 border border-gray-700"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-white mb-1">{event.name}</h4>
                        <p className="text-gray-400 text-sm">
                          {event._count.nominations} nominations
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => copyLink(event.slug, 'nominate')}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <FaCopy className="mr-1" />
                          Copy Link
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedNominationEventId(event.id);
                            setShowDetailsModal(true);
                          }}
                          variant="outline"
                          className="border-gray-600"
                        >
                          <FaEye className="mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
                
                {events.filter(e => getEventStatus(e).status === 'active').length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    No active events at the moment
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <div className="space-y-4">
                  {[...events, ...votingEvents]
                    .sort((a, b) => {
                      const getStartTime = (event: Event | VotingEvent) => {
                        return 'nominationStartTime' in event ? event.nominationStartTime : event.votingStartTime;
                      };
                      return new Date(getStartTime(b)).getTime() - new Date(getStartTime(a)).getTime();
                    })
                    .slice(0, 5)
                    .map((item, index) => (
                      <div key={`${item.id}-${index}`} className="flex items-center justify-between pb-4 border-b border-gray-700 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${
                            'nominationStartTime' in item ? 'bg-green-500' : 'bg-purple-500'
                          }`} />
                          <div>
                            <p className="text-white font-medium">{item.name}</p>
                            <p className="text-gray-400 text-sm">
                              {'nominationStartTime' in item ? 'Nomination Event' : 'Voting Event'}
                            </p>
                          </div>
                        </div>
                        <span className="text-gray-500 text-sm">
                          {new Date('nominationStartTime' in item ? item.nominationStartTime : item.votingStartTime).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-6">
            {/* Nomination Events */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Nomination Events</h3>
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <FaPlus className="mr-2" />
                  Create Event
                </Button>
              </div>
              
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => <EventSkeleton key={i} />)}
                </div>
              ) : events.length === 0 ? (
                <EmptyState type="nomination" onCreate={() => setShowCreateModal(true)} />
              ) : (
                <div className="grid gap-4">
                  {events.map(event => {
                    const status = getEventStatus(event);
                    return (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="text-lg font-semibold text-white">{event.name}</h4>
                              <div className={`w-3 h-3 rounded-full ${status.color}`} />
                              <Badge className="bg-gray-700">{status.text}</Badge>
                            </div>
                            {event.description && (
                              <p className="text-gray-400 text-sm">{event.description}</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => copyLink(event.slug, 'nominate')}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <FaCopy className="mr-1" />
                              Link
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedNominationEventId(event.id);
                                setShowDetailsModal(true);
                              }}
                              variant="outline"
                              className="border-gray-600"
                            >
                              <FaEye className="mr-1" />
                              Details
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="bg-gray-700/50 rounded-lg p-3">
                            <p className="text-gray-400">Nominations</p>
                            <p className="text-white font-semibold">{event._count?.nominations || 0}</p>
                          </div>
                          <div className="bg-gray-700/50 rounded-lg p-3">
                            <p className="text-gray-400">Eligible</p>
                            <p className="text-white font-semibold">{event.eligibleEmails.length}</p>
                          </div>
                          <div className="bg-gray-700/50 rounded-lg p-3">
                            <p className="text-gray-400">Start</p>
                            <p className="text-white font-semibold">
                              {new Date(event.nominationStartTime).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="bg-gray-700/50 rounded-lg p-3">
                            <p className="text-gray-400">End</p>
                            <p className="text-white font-semibold">
                              {new Date(event.nominationEndTime).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Voting Events */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Voting Events</h3>
                <Button
                  onClick={() => setShowCreateVotingModal(true)}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <FaPlus className="mr-2" />
                  Create Voting
                </Button>
              </div>
              
              {votingEvents.length === 0 ? (
                <EmptyState type="voting" onCreate={() => setShowCreateVotingModal(true)} />
              ) : (
                <div className="grid gap-4">
                  {votingEvents.map(event => {
                    const status = getEventStatus(event);
                    return (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="text-lg font-semibold text-white">{event.name}</h4>
                              <div className={`w-3 h-3 rounded-full ${status.color}`} />
                              <Badge className="bg-gray-700">{status.text}</Badge>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => copyLink(event.slug, 'vote')}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <FaCopy className="mr-1" />
                              Link
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => router.push(`/admin/results/${event.id}`)}
                              variant="outline"
                              className="border-gray-600"
                            >
                              <FaChartBar className="mr-1" />
                              Results
                              <FaExternalLinkAlt className="ml-1 text-xs" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="bg-gray-700/50 rounded-lg p-3">
                            <p className="text-gray-400">Votes</p>
                            <p className="text-white font-semibold">{event._count?.votes || 0}</p>
                          </div>
                          <div className="bg-gray-700/50 rounded-lg p-3">
                            <p className="text-gray-400">Candidates</p>
                            <p className="text-white font-semibold">{event.candidates?.length || 0}</p>
                          </div>
                          <div className="bg-gray-700/50 rounded-lg p-3">
                            <p className="text-gray-400">Start</p>
                            <p className="text-white font-semibold">
                              {new Date(event.votingStartTime).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="bg-gray-700/50 rounded-lg p-3">
                            <p className="text-gray-400">End</p>
                            <p className="text-white font-semibold">
                              {new Date(event.votingEndTime).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">System Analytics</h3>
              <p className="text-gray-400">
                Comprehensive analytics and reporting features coming soon.
              </p>
            </div>
          </TabsContent>

          {/* System Tab (Super Admin) */}
          {adminProfile?.role === 'SUPER_ADMIN' && (
            <TabsContent value="system" className="space-y-6">
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <FaBell className="text-amber-400" />
                  System Administration
                </h3>
                <p className="text-gray-400 mb-6">
                  Advanced system monitoring and configuration options
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="outline" className="border-gray-600 justify-start">
                    <FaBell className="mr-2" />
                    Security Logs
                  </Button>
                  <Button variant="outline" className="border-gray-600 justify-start">
                    <FaUsers className="mr-2" />
                    User Management
                  </Button>
                  <Button variant="outline" className="border-gray-600 justify-start">
                    <FaChartBar className="mr-2" />
                    System Reports
                  </Button>
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Modals */}
      <CreateEventModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onEventCreated={handleEventCreated}
      />
      
      <CreateVotingEventModal
        isOpen={showCreateVotingModal}
        onClose={() => setShowCreateVotingModal(false)}
        onEventCreated={handleVotingEventCreated}
      />
      
      {selectedNominationEventId && (
        <EventDetailsModal
          eventId={selectedNominationEventId}
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedNominationEventId(null);
          }}
        />
      )}
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <ErrorBoundary>
      <AdminAuthWrapper>
        <DashboardContent />
      </AdminAuthWrapper>
    </ErrorBoundary>
  );
}