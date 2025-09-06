'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/lib/api';

export default function DebugPage() {
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const clearResults = () => {
    setResults([]);
  };

  const testServerConnection = async () => {
    setLoading(true);
    try {
      addResult('Testing server connection...');
      const response = await fetch('http://localhost:5000/health');
      if (response.ok) {
        const health = await response.json();
        addResult(`✅ Server is running: ${JSON.stringify(health)}`);
      } else {
        addResult(`❌ Server connection failed: ${response.statusText}`);
      }
    } catch (error: any) {
      addResult(`❌ Server connection failed: ${error.message}`);
    }
    setLoading(false);
  };

  const testManualFetch = async () => {
    setLoading(true);
    try {
      addResult('Testing manual fetch to /health...');
      const response = await fetch('http://localhost:5000/health');
      addResult(`Response status: ${response.status}`);
      if (response.ok) {
        const data = await response.json();
        addResult(`✅ Manual fetch success: ${JSON.stringify(data)}`);
      } else {
        addResult(`❌ Manual fetch failed: ${response.statusText}`);
      }
    } catch (error: any) {
      addResult(`❌ Manual fetch error: ${error.message}`);
    }
    setLoading(false);
  };

  const testAdminRoutes = async () => {
    setLoading(true);
    try {
      addResult('Testing admin routes...');
      
      // Test login route
      try {
        const response = await fetch('http://localhost:5000/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'test', password: 'test' })
        });
        addResult(`Login route status: ${response.status} (expected 400 or similar)`);
      } catch (error: any) {
        addResult(`❌ Login route error: ${error.message}`);
      }

      // Test profile route (should return 401)
      try {
        const response = await fetch('http://localhost:5000/api/admin/profile');
        addResult(`Profile route status: ${response.status} (expected 401)`);
      } catch (error: any) {
        addResult(`❌ Profile route error: ${error.message}`);
      }

      // Test test route if it exists
      try {
        const response = await fetch('http://localhost:5000/api/admin/test');
        addResult(`Test route status: ${response.status}`);
        if (response.ok) {
          const data = await response.json();
          addResult(`✅ Test route response: ${JSON.stringify(data)}`);
        }
      } catch (error: any) {
        addResult(`Test route error: ${error.message}`);
      }

    } catch (error: any) {
      addResult(`❌ Admin routes test error: ${error.message}`);
    }
    setLoading(false);
  };

  const testAuthFlow = async () => {
    setLoading(true);
    try {
      addResult('Testing authentication flow...');
      
      // Check if we have a token
      const token = localStorage.getItem('adminToken');
      addResult(`Stored token: ${token ? 'Present' : 'None'}`);

      // Test auth status
      try {
        const authStatus = await apiClient.checkAuthStatus();
        addResult(`Auth status: ${authStatus ? 'Authenticated' : 'Not authenticated'}`);
      } catch (error: any) {
        addResult(`Auth check error: ${error.message}`);
      }

      // Test profile call
      try {
        const profile = await apiClient.getProfile();
        addResult(`✅ Profile loaded: ${JSON.stringify(profile)}`);
      } catch (error: any) {
        addResult(`Profile error: ${error.message}`);
      }

    } catch (error: any) {
      addResult(`❌ Auth flow test error: ${error.message}`);
    }
    setLoading(false);
  };

  const testLogin = async () => {
    setLoading(true);
    try {
      addResult('Testing login with admin@unb.ca...');
      const result = await apiClient.login({
        email: 'admin@unb.ca',
        password: 'admin123'
      });
      addResult(`✅ Login successful: ${JSON.stringify(result)}`);
    } catch (error: any) {
      addResult(`❌ Login failed: ${error.message}`);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Backend Debug Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Connection Tests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={testServerConnection} 
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Test Server Health
              </Button>
              <Button 
                onClick={testManualFetch} 
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                Test Manual Fetch
              </Button>
              <Button 
                onClick={testAdminRoutes} 
                disabled={loading}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                Test Admin Routes
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Authentication Tests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={testLogin} 
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Test Login
              </Button>
              <Button 
                onClick={testAuthFlow} 
                disabled={loading}
                className="w-full bg-yellow-600 hover:bg-yellow-700"
              >
                Test Auth Flow
              </Button>
              <Button 
                onClick={clearResults} 
                disabled={loading}
                variant="outline"
                className="w-full border-gray-600"
              >
                Clear Results
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Debug Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 p-4 rounded-lg h-96 overflow-y-auto">
              {results.length === 0 ? (
                <p className="text-gray-500">No tests run yet. Click a button above to start testing.</p>
              ) : (
                <div className="space-y-1">
                  {results.map((result, index) => (
                    <div key={index} className="text-sm font-mono">
                      {result}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-gray-400">
            This debug page helps identify backend connectivity issues.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Expected results: Health check should pass, admin routes should return proper status codes
          </p>
        </div>
      </div>
    </div>
  );
}