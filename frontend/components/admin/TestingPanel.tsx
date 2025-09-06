'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FaCheck, FaTimes, FaSpinner, FaPlay } from 'react-icons/fa';

interface TestCase {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  error?: string;
}

export default function TestingPanel() {
  const [tests, setTests] = useState<TestCase[]>([
    {
      id: 'email-validation',
      name: 'Email Validation',
      description: 'Test @unb.ca email validation',
      status: 'pending'
    },
    {
      id: 'otp-flow',
      name: 'OTP Verification',
      description: 'Complete OTP verification flow',
      status: 'pending'
    },
    {
      id: 'form-submission',
      name: 'Form Submission',
      description: 'Submit nomination form with validation',
      status: 'pending'
    },
    {
      id: 'withdrawal-flow',
      name: 'Withdrawal Flow',
      description: 'Test complete withdrawal process',
      status: 'pending'
    },
    {
      id: 'time-controls',
      name: 'Time Controls',
      description: 'Test enable/disable time checking',
      status: 'pending'
    },
    {
      id: 'duplicate-prevention',
      name: 'Duplicate Prevention',
      description: 'Prevent duplicate submissions',
      status: 'pending'
    },
    {
      id: 'session-management',
      name: 'Session Management',
      description: 'Test session timeout and security',
      status: 'pending'
    }
  ]);

  const runTest = async (testId: string) => {
    setTests(prev => prev.map(t => 
      t.id === testId ? { ...t, status: 'running' } : t
    ));

    // Simulate test execution
    await new Promise(resolve => setTimeout(resolve, 2000));

    // For demo purposes, randomly pass/fail tests
    const success = Math.random() > 0.3;
    
    setTests(prev => prev.map(t => 
      t.id === testId ? { 
        ...t, 
        status: success ? 'passed' : 'failed',
        error: success ? undefined : 'Test failed - check console for details'
      } : t
    ));
  };

  const runAllTests = async () => {
    for (const test of tests) {
      await runTest(test.id);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <FaCheck className="text-green-500" />;
      case 'failed': return <FaTimes className="text-red-500" />;
      case 'running': return <FaSpinner className="text-blue-500 animate-spin" />;
      default: return <FaPlay className="text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      passed: 'bg-green-600',
      failed: 'bg-red-600', 
      running: 'bg-blue-600',
      pending: 'bg-gray-600'
    };
    
    return <Badge className={variants[status as keyof typeof variants]}>{status}</Badge>;
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-white">System Testing</CardTitle>
          <Button onClick={runAllTests} className="bg-blue-600 hover:bg-blue-700">
            Run All Tests
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {tests.map((test) => (
            <div key={test.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(test.status)}
                <div>
                  <h3 className="text-white font-medium">{test.name}</h3>
                  <p className="text-gray-400 text-sm">{test.description}</p>
                  {test.error && (
                    <p className="text-red-400 text-xs mt-1">{test.error}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(test.status)}
                <Button 
                  onClick={() => runTest(test.id)}
                  size="sm"
                  variant="outline"
                  disabled={test.status === 'running'}
                  className="border-gray-600"
                >
                  Run
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}