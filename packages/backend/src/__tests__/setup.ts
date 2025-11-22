/**
 * Jest Setup File
 * Runs before all tests
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || '******localhost:5432/nim_db_test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.LOCAL_STORAGE_PATH = '/tmp/test-uploads';

// Mock console methods to reduce noise
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
  log: jest.fn(),
};

// Global test timeout
jest.setTimeout(30000);
