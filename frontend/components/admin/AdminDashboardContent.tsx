'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiClient } from '@/lib/api';
import { motion } from 'framer-motion';
import { 
  FaSpinner, FaTimes, FaChartBar, FaUsers, FaFileExport, 
  FaEye, FaVoteYea, FaClock, FaCheck, FaTrophy 
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

interface VotingResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
}

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

interface Vote {
  id: string;
  voterName: string;
  voterEmail: string;
  voterStudentId: string;
  voterFaculty: string;
  voterYear: string;
  submittedAt: string;
  ipAddress: string;
  location?: string;
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
  votes: Vote[];
}

export default function VotingResultsModal({ isOpen, onClose, eventId }: VotingResultsModalProps) {
  const [data, setData] = useState<ResultsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    if (isOpen && eventId) {
      loadResults();
    }
  }, [isOpen, eventId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh && isOpen) {
      interval = setInterval(loadResults, 10000); // Refresh every 10 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, isOpen]);

  const loadResults = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getVotingResults(eventId);
      setData(response);
    } catch (err: any) {
      setError(err.message || 'Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  const exportResults = () => {
    if (!data) return;

    const csvContent = [
      // Headers
      ['Position', 'Candidate Name', 'Faculty', 'Year', 'Votes', 'Percentage'].join(','),
      // Data rows
      ...Object.entries(data.results).flatMap(([position, result]) =>
        result.candidates.map(candidate => [
          position,
          candidate.name,
          candidate.faculty,
          candidate.year,
          candidate.votes,
          result.totalVotes > 0 ? `${((candidate.votes / result.totalVotes) * 100).toFixed(1)}%` : '0%'
        ].join(','))
      ),
      '',
      // Voter data
      ['Voter Name', 'Email', 'Student ID', 'Faculty', 'Year', 'Submitted At', 'Location'].join(','),
      ...data.votes.map(vote => [
        vote.voterName,
        vote.voterEmail,
        vote.voterStudentId,
        vote.voterFaculty,
        vote.voterYear,
        new Date(vote.submittedAt).toLocaleString(),
        vote.location || 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voting_results_${data.event.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getWinner = (candidates: Candidate[]) => {
    return candidates.reduce((prev, current) => 
      (prev.votes > current.votes) ? prev : current
    );
  };

  const generateChartData = (position: string, candidates: Candidate[]) => {
    const colors = [
      'rgba(16, 185, 129, 0.8)', // Green
      'rgba(59, 130, 246, 0.8)', // Blue
      'rgba(245, 158, 11, 0.8)', // Amber
      'rgba(239, 68, 68, 0.8)',  // Red
      'rgba(139, 92, 246, 0.8)', // Purple
      'rgba(236, 72, 153, 0.8)', // Pink
    ];

    return {
      labels: candidates.map(c => c.name),
      datasets: [{
        label: 'Votes',
        data: candidates.map(c => c.votes),
        backgroundColor: colors.slice(0, candidates.length),
        borderColor: colors.slice(0, candidates.length).map(color => color.replace('0.8', '1')),
        borderWidth: 2,
        borderRadius: 8,
      }]
    };
  };

  const chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(31, 41, 55, 0.95)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(75, 85, 99, 0.8)',
        borderWidth: 1,
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
          color: 'rgba(75, 85, 99, 0.3)',
        },
      },
      x: {
        ticks: {
          color: 'rgba(156, 163, 175, 0.8)',
        },
        grid: {
          display: false,
        },
      },
    },
  };

  const pieChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: 'white',
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(31, 41, 55, 0.95)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(75, 85, 99, 0.8)',
        borderWidth: 1,
      },
    },
  };

  if (!data && loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-gray-800 text-white border-gray-700 max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Loading Results</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-20">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3"
            >
              <FaSpinner className="animate-spin text-green-600 w-8 h-8" />
              <span className="text-xl">Loading results...</span>
            </motion.div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 text-white border-gray-700 max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="text-2xl font-bold">
                {data?.event.name} - Results Dashboard
              </DialogTitle>
              <p className="text-gray-400 mt-1">
                Voting Period: {data && new Date(data.event.votingStartTime).toLocaleDateString()} - {data && new Date(data.event.votingEndTime).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setAutoRefresh(!autoRefresh)}
                variant={autoRefresh ? "default" : "outline"}
                size="sm"
                className={autoRefresh ? "bg-green-600" : "border-gray-600"}
              >
                {autoRefresh ? <FaCheck className="mr-1" /> : <FaClock className="mr-1" />}
                Auto Refresh
              </Button>
              <Button onClick={exportResults} size="sm" className="bg-blue-600 hover:bg-blue-700">
                <FaFileExport className="mr-1" />
                Export CSV
              </Button>
              <Button onClick={onClose} variant="ghost" size="sm">
                <FaTimes />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {error && (
          <div className="bg-red-600/20 border border-red-600/20 rounded-lg p-4 text-red-100">
            {error}
          </div>
        )}

        {data && (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="bg-gray-700 mb-6 grid grid-cols-4 w-full">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
              <TabsTrigger value="voters">Voters ({data.votes.length})</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-4 gap-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-center gap-3">
                    <FaUsers className="text-blue-400 text-2xl" />
                    <div>
                      <p className="text-gray-400 text-sm">Total Eligible</p>
                      <p className="text-2xl font-bold">{data.voterStats.totalEligible}</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-center gap-3">
                    <FaVoteYea className="text-green-400 text-2xl" />
                    <div>
                      <p className="text-gray-400 text-sm">Votes Cast</p>
                      <p className="text-2xl font-bold">{data.voterStats.totalVoted}</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-center gap-3">
                    <FaChartBar className="text-purple-400 text-2xl" />
                    <div>
                      <p className="text-gray-400 text-sm">Turnout</p>
                      <p className="text-2xl font-bold">{data.voterStats.turnoutPercentage}%</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-center gap-3">
                    <FaEye className="text-amber-400 text-2xl" />
                    <div>
                      <p className="text-gray-400 text-sm">Not Voted</p>
                      <p className="text-2xl font-bold">{data.voterStats.notVoted.length}</p>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Turnout Progress */}
              <div className="bg-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Voter Turnout</h3>
                <div className="bg-gray-600 rounded-full h-4 overflow-hidden">
                  <motion.div
                    className="bg-gradient-to-r from-green-600 to-green-500 h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${data.voterStats.turnoutPercentage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
                <div className="flex justify-between text-sm text-gray-400 mt-2">
                  <span>{data.voterStats.totalVoted} voted</span>
                  <span>{data.voterStats.totalEligible} eligible</span>
                </div>
              </div>

              {/* Quick Winners */}
              <div className="bg-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <FaTrophy className="text-yellow-400" />
                  Current Leaders
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(data.results).map(([position, result]) => {
                    if (result.candidates.length === 0) return null;
                    const winner = getWinner(result.candidates);
                    return (
                      <div key={position} className="bg-gray-600 rounded-lg p-4">
                        <h4 className="font-medium text-yellow-400 mb-2">{position}</h4>
                        <p className="text-white font-semibold">{winner.name}</p>
                        <p className="text-gray-300 text-sm">{winner.votes} votes ({result.totalVotes > 0 ? ((winner.votes / result.totalVotes) * 100).toFixed(1) : 0}%)</p>
                        <p className="text-gray-400 text-xs">{winner.faculty}, {winner.year}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="results" className="space-y-6">
              {Object.entries(data.results).map(([position, result]) => (
                <motion.div
                  key={position}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-700 rounded-lg p-6"
                >
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold">{position}</h3>
                    <Badge className="bg-blue-600">
                      {result.totalVotes} total votes
                    </Badge>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Bar Chart */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-300 mb-3">Vote Distribution</h4>
                      {result.candidates.length > 0 && (
                        <Bar data={generateChartData(position, result.candidates)} options={chartOptions} />
                      )}
                    </div>

                    {/* Candidates List */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-300 mb-3">Candidates</h4>
                      <div className="space-y-3">
                        {result.candidates
                          .sort((a, b) => b.votes - a.votes)
                          .map((candidate, index) => (
                          <div key={candidate.id} className={`p-4 rounded-lg border-l-4 ${
                            index === 0 ? 'bg-green-600/20 border-green-500' : 'bg-gray-600 border-gray-500'
                          }`}>
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold">{candidate.name}</p>
                                  {index === 0 && <FaTrophy className="text-yellow-400 text-sm" />}
                                </div>
                                <p className="text-gray-300 text-sm">{candidate.faculty}, {candidate.year}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold">{candidate.votes}</p>
                                <p className="text-gray-400 text-sm">
                                  {result.totalVotes > 0 ? ((candidate.votes / result.totalVotes) * 100).toFixed(1) : 0}%
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </TabsContent>

            <TabsContent value="voters" className="space-y-4">
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Voter Activity</h3>
                
                {/* Voted List */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  <h4 className="font-medium text-green-400">Voted ({data.votes.length})</h4>
                  {data.votes.map((vote) => (
                    <div key={vote.id} className="bg-gray-600 rounded-lg p-3 text-sm">
                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <p className="font-medium">{vote.voterName}</p>
                          <p className="text-gray-400">{vote.voterEmail}</p>
                        </div>
                        <div>
                          <p>{vote.voterStudentId}</p>
                          <p className="text-gray-400">{vote.voterFaculty}</p>
                        </div>
                        <div>
                          <p>{vote.voterYear}</p>
                          <p className="text-gray-400">{vote.location || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-green-400">✓ Voted</p>
                          <p className="text-gray-400">{new Date(vote.submittedAt).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Not Voted List */}
                {data.voterStats.notVoted.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-medium text-red-400 mb-2">Not Voted ({data.voterStats.notVoted.length})</h4>
                    <div className="bg-gray-600 rounded-lg p-3 max-h-40 overflow-y-auto">
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        {data.voterStats.notVoted.map((email) => (
                          <p key={email} className="text-gray-300">{email}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              {/* Overall Turnout Pie Chart */}
              <div className="bg-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Turnout Analysis</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Pie
                      data={{
                        labels: ['Voted', 'Not Voted'],
                        datasets: [{
                          data: [data.voterStats.totalVoted, data.voterStats.notVoted.length],
                          backgroundColor: [
                            'rgba(16, 185, 129, 0.8)',
                            'rgba(107, 114, 128, 0.8)',
                          ],
                          borderColor: [
                            'rgba(16, 185, 129, 1)',
                            'rgba(107, 114, 128, 1)',
                          ],
                          borderWidth: 2,
                        }]
                      }}
                      options={pieChartOptions}
                    />
                  </div>
                  <div className="space-y-4">
                    <div className="bg-gray-600 rounded-lg p-4">
                      <h4 className="font-medium text-green-400">Participation Rate</h4>
                      <p className="text-2xl font-bold">{data.voterStats.turnoutPercentage}%</p>
                      <p className="text-gray-400 text-sm">
                        {data.voterStats.totalVoted} out of {data.voterStats.totalEligible} eligible voters
                      </p>
                    </div>
                    <div className="bg-gray-600 rounded-lg p-4">
                      <h4 className="font-medium text-blue-400">Average Votes per Position</h4>
                      <p className="text-2xl font-bold">
                        {Object.values(data.results).length > 0 ? 
                          (Object.values(data.results).reduce((sum, result) => sum + result.totalVotes, 0) / Object.values(data.results).length).toFixed(1) : 
                          0
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Position-wise Analysis */}
              <div className="grid md:grid-cols-2 gap-4">
                {Object.entries(data.results).map(([position, result]) => (
                  <div key={position} className="bg-gray-700 rounded-lg p-4">
                    <h4 className="font-medium mb-3">{position} Distribution</h4>
                    {result.candidates.length > 0 && (
                      <Pie
                        data={{
                          labels: result.candidates.map(c => c.name),
                          datasets: [{
                            data: result.candidates.map(c => c.votes),
                            backgroundColor: [
                              'rgba(16, 185, 129, 0.8)',
                              'rgba(59, 130, 246, 0.8)',
                              'rgba(245, 158, 11, 0.8)',
                              'rgba(239, 68, 68, 0.8)',
                              'rgba(139, 92, 246, 0.8)',
                            ],
                            borderColor: [
                              'rgba(16, 185, 129, 1)',
                              'rgba(59, 130, 246, 1)',
                              'rgba(245, 158, 11, 1)',
                              'rgba(239, 68, 68, 1)',
                              'rgba(139, 92, 246, 1)',
                            ],
                            borderWidth: 2,
                          }]
                        }}
                        options={{
                          ...pieChartOptions,
                          plugins: {
                            ...pieChartOptions.plugins,
                            legend: {
                              display: false
                            }
                          }
                        }}
                      />
                    )}
                    <div className="mt-3 text-center">
                      <p className="text-gray-400 text-sm">{result.totalVotes} total votes</p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}