/**
 * Basic API Tests for DesignVerse Fashion
 * 
 * These are basic integration tests to verify core functionality.
 * To run: Install jest and add test script to package.json
 */

import axios from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:3001';

describe('DesignVerse Fashion API Tests', () => {
  let authToken: string;
  let userId: string;
  let sessionId: string;

  test('Health check should return ok', async () => {
    const response = await axios.get(`${API_URL}/health`);
    expect(response.status).toBe(200);
    expect(response.data.status).toBe('ok');
  });

  test('User registration should create new user', async () => {
    const timestamp = Date.now();
    const response = await axios.post(`${API_URL}/api/auth/register`, {
      email: `test${timestamp}@example.com`,
      password: 'Test123456!',
      displayName: 'Test User',
      handle: `testuser${timestamp}`,
    });

    expect(response.status).toBe(201);
    expect(response.data.success).toBe(true);
    authToken = response.data.data.token;
    userId = response.data.data.user.id;
  });

  test('Create photo session should work', async () => {
    const response = await axios.post(
      `${API_URL}/api/photo/sessions`,
      { title: 'Test Fashion Shoot' },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    expect(response.status).toBe(201);
    expect(response.data.success).toBe(true);
    sessionId = response.data.data.session.id;
  });
});
