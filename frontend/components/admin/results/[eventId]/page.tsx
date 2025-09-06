'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminAuthWrapper from '@/components/admin/AdminAuthWrapper';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaArrowLeft, FaDownload, FaSync, FaChartBar, FaUsers, 
  FaVoteYea, FaTrophy, FaEye, FaClock, FaPrint,
  FaCheckCircle, FaTimesCircle, FaSpinner
} from 'react-icons/fa';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface Candidate {
  id: string;
  name: string;
  faculty: string;
  year: string;
  votes: number;
}

interface PositionResult {
  candidates: Candidate[];
  totalVotes: number;
}

interface VoterStats {
  totalEligible: number;
  totalVoted: number;
  turnoutPercentage: string;
  notVoted: string[];
}

interface ResultsData {
  event: {
    id: string;
    name: string;
    votingStartTime: string;
    votingEndTime: string;
  };
  results: Record<string, PositionResult>;
  voterStats: VoterStats;
  votes: any[];
}

function ResultsPageContent() {
  const params = useParams();
  const router = useRouter();
  const [resultsData, setResultsData] = useState<ResultsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);

  useEffect(() => {
    if (params.eventId) {
      loadResults();
    }
  }, [params.eventId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh && !loading) {
      interval = setInterval(loadResults, 30000); // Refresh every 30 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, loading]);

  const loadResults = async () => {
    try {
      if (!loading) setRefreshing(true);
      setError('');
      
      const response = await apiClient.getVotingResults(params.eventId as string);
      setResultsData(response);
    } catch (err: any) {
      const errorMessage = err.message || 'Unable to load results';
      setError(
        errorMessage.includes('Network') 
          ? 'Connection issue. Please check your internet and try again.'
          : 'Unable to load results. Please try refreshing the page.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const exportResults = (format: 'csv' | 'pdf') => {
    if (!resultsData) return;

    if (format === 'csv') {
      const csvContent = generateCSV(resultsData);
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `results-${resultsData.event.name.replace(/[^a-z0-9]/gi, '_')}-${Date.now()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } else {
      window.print();
    }
  };

  const generateCSV = (data: ResultsData) => {
    const lines = [
      ['Event Results Report'],
      ['Event Name', data.event.name],
      ['Generated', new Date().toLocaleString()],
      [''],
      ['Overall Statistics'],
      ['Total Eligible Voters', data.voterStats.totalEligible],
      ['Total Votes Cast', data.voterStats.totalVoted],
      ['Turnout Percentage', data.voterStats.turnoutPercentage + '%'],
      [''],
      ['Results by Position'],
      ['Position', 'Candidate Name', 'Faculty', 'Year', 'Votes', 'Percentage']
    ];

    Object.entries(data.results).forEach(([position, result]) => {
      result.candidates
        .sort((a, b) => b.votes - a.votes)
        .forEach(candidate => {
          lines.push([
            position,
            candidate.name,
            candidate.faculty,
            candidate.year,
            candidate.votes.toString(),
            result.totalVotes > 0 
              ? `${((candidate.votes / result.totalVotes) * 100).toFixed(1)}%` 
              : '0%'
          ]);
        });
    });

    return lines.map(line => line.join(',')).join('\n');
  };

  const getWinner = (candidates: Candidate[]) => {
    if (candidates.length === 0) return null;
    return candidates.reduce((prev, current) => 
      (prev.votes > current.votes) ? prev : current
    );
  };

  const chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(31, 41, 55, 0.95)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(75, 85, 99, 0.8)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          color: 'rgba(156, 163, 175, 0.8)',
        },
        grid: {
          color: 'rgba(75, 85, 99, 0.2)',
        },
      },
      x: {
        ticks: {
          color: 'rgba(156, 163, 175, 0.8)',
        },
        grid: { display: false },
      },
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <FaChartBar className="text-6xl mx-auto mb-4 text-green-500 animate-pulse" />
          <p className="text-white text-xl">Loading results securely...</p>
          <p className="text-gray-400 text-sm mt-2">Please wait</p>
        </motion.div>
      </div>
    );
  }

  const isVotingActive = resultsData && new Date() < new Date(resultsData.event.votingEndTime);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      {/* Header */}
      <div className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => router.push('/admin/dashboard')}
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <FaArrowLeft className="mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-bold text-white">
                  {resultsData?.event?.name || 'Event Results'}
                </h1>
                <p className="text-gray-400 text-sm">
                  Secure results view • {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {isVotingActive && (
                <Badge className="bg-green-600 animate-pulse">
                  <FaClock className="mr-1" />
                  Voting Active
                </Badge>
              )}
              
              <Button
                onClick={() => setAutoRefresh(!autoRefresh)}
                variant={autoRefresh ? "default" : "outline"}
                size="sm"
                className={autoRefresh ? "bg-green-600" : "border-gray-600"}
              >
                {autoRefresh ? <FaCheckCircle className="mr-1" /> : <FaClock className="mr-1" />}
                Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
              </Button>
              
              <Button
                onClick={() => loadResults()}
                disabled={refreshing}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                {refreshing ? <FaSpinner className="animate-spin mr-1" /> : <FaSync className="mr-1" />}
                Refresh
              </Button>
              
              <div className="flex gap-2 border-l border-gray-600 pl-3">
                <Button
                  onClick={() => exportResults('csv')}
                  size="sm"
                  variant="outline"
                  className="border-gray-600"
                >
                  <FaDownload className="mr-1" />
                  CSV
                </Button>
                <Button
                  onClick={() => exportResults('pdf')}
                  size="sm"
                  variant="outline"
                  className="border-gray-600"
                >
                  <FaPrint className="mr-1" />
                  Print
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-7xl mx-auto px-6 mt-4"
          >
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FaTimesCircle className="text-red-400" />
                <p className="text-red-100">{error}</p>
              </div>
              <button
                onClick={() => setError('')}
                className="text-red-400 hover:text-red-300"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {resultsData && (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-800 rounded-xl p-6 border border-gray-700"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Eligible Voters</p>
                    <p className="text-3xl font-bold text-white">
                      {resultsData.voterStats.totalEligible}
                    </p>
                  </div>
                  <FaUsers className="text-blue-400 text-2xl" />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gray-800 rounded-xl p-6 border border-gray-700"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Votes Cast</p>
                    <p className="text-3xl font-bold text-white">
                      {resultsData.voterStats.totalVoted}
                    </p>
                  </div>
                  <FaVoteYea className="text-green-400 text-2xl" />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gray-800 rounded-xl p-6 border border-gray-700"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Turnout</p>
                    <p className="text-3xl font-bold text-white">
                      {resultsData.voterStats.turnoutPercentage}%
                    </p>
                  </div>
                  <FaChartBar className="text-purple-400 text-2xl" />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gray-800 rounded-xl p-6 border border-gray-700"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Not Voted</p>
                    <p className="text-3xl font-bold text-white">
                      {resultsData.voterStats.notVoted.length}
                    </p>
                  </div>
                  <FaEye className="text-amber-400 text-2xl" />
                </div>
              </motion.div>
            </div>

            {/* Turnout Progress Bar */}
            <div className="bg-gray-800 rounded-xl p-6 mb-8 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Overall Turnout</h3>
              <div className="bg-gray-700 rounded-full h-6 overflow-hidden">
                <motion.div
                  className="bg-gradient-to-r from-green-600 to-green-500 h-full rounded-full flex items-center justify-center"
                  initial={{ width: 0 }}
                  animate={{ width: `${resultsData.voterStats.turnoutPercentage}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                >
                  <span className="text-xs font-bold text-white">
                    {resultsData.voterStats.turnoutPercentage}%
                  </span>
                </motion.div>
              </div>
              <div className="flex justify-between text-sm text-gray-400 mt-2">
                <span>{resultsData.voterStats.totalVoted} voted</span>
                <span>{resultsData.voterStats.totalEligible} eligible</span>
              </div>
            </div>

            {/* Winners Section */}
            <div className="bg-gray-800 rounded-xl p-6 mb-8 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <FaTrophy className="text-yellow-400" />
                Leading Candidates
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(resultsData.results).map(([position, result]) => {
                  const winner = getWinner(result.candidates);
                  if (!winner) return null;
                  
                  return (
                    <motion.div
                      key={position}
                      whileHover={{ scale: 1.02 }}
                      className="bg-gray-700 rounded-lg p-4 cursor-pointer"
                      onClick={() => setSelectedPosition(position)}
                    >
                      <h4 className="font-medium text-amber-400 mb-2">{position}</h4>
                      <p className="text-white font-semibold text-lg">{winner.name}</p>
                      <div className="flex justify-between items-end mt-2">
                        <div>
                          <p className="text-gray-400 text-sm">{winner.faculty}</p>
                          <p className="text-gray-400 text-sm">{winner.year}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-green-400 font-bold">{winner.votes} votes</p>
                          <p className="text-gray-400 text-xs">
                            {result.totalVotes > 0 ? 
                              `${((winner.votes / result.totalVotes) * 100).toFixed(1)}%` : 
                              '0%'}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Detailed Results by Position */}
            <div className="space-y-6">
              {Object.entries(resultsData.results).map(([position, result]) => (
                <motion.div
                  key={position}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-800 rounded-xl p-6 border border-gray-700"
                >
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">{position}</h3>
                    <Badge className="bg-blue-600">
                      {result.totalVotes} votes cast
                    </Badge>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Chart */}
                    <div className="h-64">
                      {result.candidates.length > 0 && (
                        <Bar 
                          data={{
                            labels: result.candidates.map(c => c.name.split(' ').slice(-1)[0]),
                            datasets: [{
                              label: 'Votes',
                              data: result.candidates.map(c => c.votes),
                              backgroundColor: [
                                'rgba(16, 185, 129, 0.8)',
                                'rgba(59, 130, 246, 0.8)',
                                'rgba(245, 158, 11, 0.8)',
                                'rgba(239, 68, 68, 0.8)',
                                'rgba(139, 92, 246, 0.8)',
                              ],
                              borderWidth: 0,
                              borderRadius: 8,
                            }]
                          }} 
                          options={chartOptions} 
                        />
                      )}
                    </div>

                    {/* Candidates List */}
                    <div className="space-y-3">
                      {result.candidates
                        .sort((a, b) => b.votes - a.votes)
                        .map((candidate, index) => (
                          <div
                            key={candidate.id}
                            className={`p-4 rounded-lg border-l-4 ${
                              index === 0 
                                ? 'bg-green-600/20 border-green-500' 
                                : 'bg-gray-700 border-gray-600'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-white">
                                    {candidate.name}
                                  </p>
                                  {index === 0 && (
                                    <FaTrophy className="text-yellow-400 text-sm" />
                                  )}
                                </div>
                                <p className="text-gray-400 text-sm">
                                  {candidate.faculty} • {candidate.year}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-xl font-bold text-white">
                                  {candidate.votes}
                                </p>
                                <p className="text-gray-400 text-sm">
                                  {result.totalVotes > 0 
                                    ? `${((candidate.votes / result.totalVotes) * 100).toFixed(1)}%` 
                                    : '0%'}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function SecureResultsPage() {
  return (
    <AdminAuthWrapper requireRole="ADMIN">
      <ResultsPageContent />
    </AdminAuthWrapper>
  );
}