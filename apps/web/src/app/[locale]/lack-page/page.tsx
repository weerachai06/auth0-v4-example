'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function VulnerablePage() {
  const [userData, setUserData] = useState<any>(null);
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');
  const searchParams = useSearchParams();

  // XSS Vulnerability 1: Rendering unescaped user input
  const username = searchParams.get('username') || '';

  // XSS Vulnerability 2: Using dangerouslySetInnerHTML with user input
  const userMessage = searchParams.get('message') || '';

  // SQL Injection vulnerability: Creating SQL query with user input
  const userId = searchParams.get('id');

  useEffect(() => {
    if (userId) {
      // SECURITY ISSUE: SQL injection via string concatenation
      const query = `SELECT * FROM users WHERE id = ${userId}`;

      // Simulating sending the query
      console.log('Executing query:', query);
      simulateFetchUser(query);
    }
  }, [userId]);

  // SECURITY ISSUE: Format string vulnerability
  const formatMessage = (message: string) => {
    try {
      // eslint-disable-next-line no-eval
      return eval('`' + message + '`');
    } catch (e) {
      return message;
    }
  };

  // Mock function to simulate fetching user data
  const simulateFetchUser = (query: string) => {
    // Pretend this is making a database request
    setTimeout(() => {
      if (query.includes('--') || query.includes(';')) {
        setError('SQL Injection detected!');
      } else {
        setUserData({ id: userId, name: 'Test User', email: 'test@example.com' });
      }
    }, 500);
  };

  // SECURITY ISSUE: Path traversal vulnerability
  const readUserFile = () => {
    const filename = searchParams.get('file') || 'default.txt';

    // Path traversal vulnerability
    fetch(`/api/read-file?path=./user_files/${filename}`)
      .then(res => res.text())
      .then(data => {
        setResult(data);
      })
      .catch(err => {
        setError(err.message);
      });
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Vulnerable Page for Security Testing</h1>

      {/* XSS Vulnerability: Unescaped rendering */}
      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h2 className="text-xl font-semibold">
          Welcome, <span dangerouslySetInnerHTML={{ __html: username }} />
        </h2>

        {/* Another XSS vulnerability */}
        <div className="mt-4" dangerouslySetInnerHTML={{ __html: userMessage }} />
      </div>

      {/* SQL Injection testing area */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">User Data</h2>
        <button
          onClick={() => simulateFetchUser(`SELECT * FROM users WHERE id = ${userId || '1'}`)}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Fetch User
        </button>

        {userData && (
          <div className="mt-2 p-4 bg-gray-100">
            <p>ID: {userData.id}</p>
            <p>Name: {userData.name}</p>
            <p>Email: {userData.email}</p>
          </div>
        )}
      </div>

      {/* Path traversal testing area */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">File Reader</h2>
        <button onClick={readUserFile} className="bg-green-500 text-white px-4 py-2 rounded">
          Read User File
        </button>

        {result && (
          <div className="mt-2 p-4 bg-gray-100">
            <pre>{result}</pre>
          </div>
        )}
      </div>

      {/* Format string vulnerability */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Format Message</h2>
        <input
          type="text"
          placeholder="Enter message template"
          className="border p-2 mr-2"
          onChange={e => setUserData({ ...userData, message: e.target.value })}
        />
        <button
          onClick={() => setResult(formatMessage(userData?.message || ''))}
          className="bg-purple-500 text-white px-4 py-2 rounded"
        >
          Format
        </button>
      </div>

      {/* Display error */}
      {error && <div className="p-4 bg-red-100 text-red-700 rounded">{error}</div>}

      {/* Hidden comment with sensitive data */}
      {/* 
        TODO: Remove before production
        API_KEY: "sk_live_1234567890abcdefghijklmn"
        DB_PASSWORD: "super_secret_password123!"
      */}
    </div>
  );
}
