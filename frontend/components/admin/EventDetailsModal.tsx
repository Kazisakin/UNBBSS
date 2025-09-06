'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiClient } from '@/lib/api';
import { motion } from 'framer-motion';
import { 
  FaDownload, FaEye, FaEdit, FaSpinner, FaTimes, 
  FaUser, FaEnvelope, FaCalendarAlt, FaMapMarkerAlt,
  FaExclamationTriangle, FaCheck 
} from 'react-icons/fa';

interface EventDetailsModalProps {
  eventId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

interface Submission {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  studentId: string;
  faculty: string;
  year: string;
  positions: string[];
  isWithdrawn: boolean;
  withdrawnAt: string | null;
  withdrawnPositions: string[];
  submittedAt: string;
  ipAddress: string;
  location: string | null;
  withdrawalToken: string;
}

interface EventDetails {
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
}

export default function EventDetailsModal({ eventId, isOpen, onClose }: EventDetailsModalProps) {
  const [event, setEvent] = useState<EventDetails | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (eventId && isOpen) {
      loadEventDetails();
      loadSubmissions();
    }
  }, [eventId, isOpen]);

  const loadEventDetails = async () => {
    if (!eventId) return;
    
    try {
      // For now, we'll load the event details from the submissions response
      // You might want to create a separate API endpoint for event details
    } catch (error: any) {
      console.error('Failed to load event details:', error);
      setError('Failed to load event details');
    }
  };

  const loadSubmissions = async () => {
    if (!eventId) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await apiClient.getEventSubmissions(eventId);
      setSubmissions(response.submissions || []);
      
      // Set event details if available in the response
      if (response.event) {
        setEvent(response.event);
      }
    } catch (error: any) {
      console.error('Failed to load submissions:', error);
      setError('Failed to load submissions: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'json') => {
    if (!eventId) return;
    
    setExporting(true);
    setError('');
    
    try {
      const response = await apiClient.exportNominationData(eventId, format);
      
      const filename = `nominations-${event?.name || eventId}-${Date.now()}.${format}`;
      
      if (format === 'csv') {
        const blob = await response.blob();
        downloadFile(blob, filename);
      } else {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        downloadFile(blob, filename);
      }
    } catch (error: any) {
      console.error('Export failed:', error);
      setError('Export failed: ' + error.message);
    } finally {
      setExporting(false);
    }
  };

  const downloadFile = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const activeSubmissions = submissions.filter(s => !s.isWithdrawn);
  const withdrawnSubmissions = submissions.filter(s => s.isWithdrawn);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 text-white border-gray-700 max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="text-xl font-bold">
                {event?.name || 'Event Submissions'}
              </DialogTitle>
              {event?.description && (
                <p className="text-gray-400 mt-1">{event.description}</p>
              )}
            </div>
            <Button onClick={onClose} variant="ghost" size="sm">
              <FaTimes />
            </Button>
          </div>
        </DialogHeader>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-600/20 border border-red-600/20 rounded-lg p-4 flex items-center gap-3"
          >
            <FaExclamationTriangle className="text-red-400" />
            <p className="text-red-100">{error}</p>
            <Button
              onClick={() => setError('')}
              variant="ghost"
              size="sm"
              className="ml-auto text-red-400 hover:text-red-300"
            >
              ×
            </Button>
          </motion.div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3"
            >
              <FaSpinner className="animate-spin text-green-600 text-2xl" />
              <span className="text-lg">Loading submissions...</span>
            </motion.div>
          </div>
        ) : (
          <Tabs defaultValue="active" className="w-full">
            {/* Header with Stats and Export */}
            <div className="flex justify-between items-center mb-6">
              <TabsList className="bg-gray-700">
                <TabsTrigger value="active" className="flex items-center gap-2">
                  <FaCheck className="text-green-400" />
                  Active ({activeSubmissions.length})
                </TabsTrigger>
                <TabsTrigger value="withdrawn" className="flex items-center gap-2">
                  <FaExclamationTriangle className="text-red-400" />
                  Withdrawn ({withdrawnSubmissions.length})
                </TabsTrigger>
                <TabsTrigger value="stats">
                  Statistics
                </TabsTrigger>
              </TabsList>
              
              <div className="flex gap-2">
                <Button 
                  onClick={() => handleExport('csv')} 
                  disabled={exporting || submissions.length === 0}
                  size="sm" 
                  className="bg-green-600 hover:bg-green-700"
                >
                  {exporting ? <FaSpinner className="animate-spin mr-2" /> : <FaDownload className="mr-2" />}
                  Export CSV
                </Button>
                <Button 
                  onClick={() => handleExport('json')} 
                  disabled={exporting || submissions.length === 0}
                  size="sm" 
                  variant="outline"
                  className="border-gray-600"
                >
                  {exporting ? <FaSpinner className="animate-spin mr-2" /> : <FaDownload className="mr-2" />}
                  Export JSON
                </Button>
              </div>
            </div>

            {/* Active Submissions Tab */}
            <TabsContent value="active">
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {activeSubmissions.length === 0 ? (
                  <div className="text-center py-12">
                    <FaUser className="text-gray-500 text-4xl mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">No active submissions</p>
                  </div>
                ) : (
                  activeSubmissions.map((submission) => (
                    <motion.div
                      key={submission.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gray-700 rounded-lg p-6 border border-gray-600 hover:border-green-600/50 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-white">
                            {submission.firstName} {submission.lastName}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                            <div className="flex items-center gap-1">
                              <FaEnvelope />
                              <span>{submission.email}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <FaUser />
                              <span>{submission.studentId}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right text-sm text-gray-400">
                          <div className="flex items-center gap-1 mb-1">
                            <FaCalendarAlt />
                            <span>{new Date(submission.submittedAt).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-1 mb-1">
                            <FaMapMarkerAlt />
                            <span>{submission.ipAddress}</span>
                          </div>
                          {submission.location && (
                            <p className="text-xs">{submission.location}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-4">
                        <div className="bg-gray-600 rounded-lg p-3">
                          <span className="text-gray-400 block">Faculty:</span>
                          <span className="text-white font-medium">{submission.faculty}</span>
                        </div>
                        <div className="bg-gray-600 rounded-lg p-3">
                          <span className="text-gray-400 block">Year:</span>
                          <span className="text-white font-medium">{submission.year}</span>
                        </div>
                        <div className="bg-gray-600 rounded-lg p-3">
                          <span className="text-gray-400 block">Positions:</span>
                          <span className="text-white font-medium">{submission.positions.length}</span>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-300 mb-2">Nominated Positions:</h4>
                        <div className="flex flex-wrap gap-2">
                          {submission.positions.map((position) => (
                            <Badge key={position} className="bg-green-600/20 border border-green-600/30 text-green-200">
                              {position}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Withdrawn Submissions Tab */}
            <TabsContent value="withdrawn">
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {withdrawnSubmissions.length === 0 ? (
                  <div className="text-center py-12">
                    <FaExclamationTriangle className="text-gray-500 text-4xl mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">No withdrawn submissions</p>
                  </div>
                ) : (
                  withdrawnSubmissions.map((submission) => (
                    <motion.div
                      key={submission.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gray-700 rounded-lg p-6 border border-red-600/30 opacity-75"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-white">
                            {submission.firstName} {submission.lastName}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                            <div className="flex items-center gap-1">
                              <FaEnvelope />
                              <span>{submission.email}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <FaUser />
                              <span>{submission.studentId}</span>
                            </div>
                          </div>
                          <p className="text-red-400 text-sm mt-2">
                            Withdrawn: {submission.withdrawnAt ? new Date(submission.withdrawnAt).toLocaleString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-4">
                        <div className="bg-gray-600 rounded-lg p-3">
                          <span className="text-gray-400 block">Faculty:</span>
                          <span className="text-white font-medium">{submission.faculty}</span>
                        </div>
                        <div className="bg-gray-600 rounded-lg p-3">
                          <span className="text-gray-400 block">Year:</span>
                          <span className="text-white font-medium">{submission.year}</span>
                        </div>
                        <div className="bg-gray-600 rounded-lg p-3">
                          <span className="text-gray-400 block">Original Positions:</span>
                          <span className="text-white font-medium">{submission.positions.length}</span>
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-300 mb-2">Original Positions:</h4>
                          <div className="flex flex-wrap gap-2">
                            {submission.positions.map((position) => (
                              <Badge key={position} className="bg-gray-600/50 border border-gray-500 text-gray-300">
                                {position}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        {submission.withdrawnPositions && submission.withdrawnPositions.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-red-300 mb-2">Withdrawn Positions:</h4>
                            <div className="flex flex-wrap gap-2">
                              {submission.withdrawnPositions.map((position) => (
                                <Badge key={position} className="bg-red-600/20 border border-red-600/30 text-red-200">
                                  {position}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Statistics Tab */}
            <TabsContent value="stats">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Summary Stats */}
                <div className="bg-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Submission Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Submissions:</span>
                      <span className="text-white font-medium">{submissions.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Active:</span>
                      <span className="text-green-400 font-medium">{activeSubmissions.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Withdrawn:</span>
                      <span className="text-red-400 font-medium">{withdrawnSubmissions.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Success Rate:</span>
                      <span className="text-blue-400 font-medium">
                        {submissions.length > 0 ? ((activeSubmissions.length / submissions.length) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Position Stats */}
                <div className="bg-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Positions Applied</h3>
                  <div className="space-y-2">
                    {(() => {
                      const positionCounts: Record<string, number> = {};
                      activeSubmissions.forEach(sub => {
                        sub.positions.forEach(pos => {
                          positionCounts[pos] = (positionCounts[pos] || 0) + 1;
                        });
                      });
                      
                      return Object.entries(positionCounts)
                        .sort(([,a], [,b]) => b - a)
                        .map(([position, count]) => (
                          <div key={position} className="flex justify-between">
                            <span className="text-gray-300">{position}:</span>
                            <span className="text-white font-medium">{count}</span>
                          </div>
                        ));
                    })()}
                  </div>
                </div>

                {/* Faculty Distribution */}
                <div className="bg-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Faculty Distribution</h3>
                  <div className="space-y-2">
                    {(() => {
                      const facultyCounts: Record<string, number> = {};
                      activeSubmissions.forEach(sub => {
                        facultyCounts[sub.faculty] = (facultyCounts[sub.faculty] || 0) + 1;
                      });
                      
                      return Object.entries(facultyCounts)
                        .sort(([,a], [,b]) => b - a)
                        .map(([faculty, count]) => (
                          <div key={faculty} className="flex justify-between">
                            <span className="text-gray-300">{faculty}:</span>
                            <span className="text-white font-medium">{count}</span>
                          </div>
                        ));
                    })()}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}