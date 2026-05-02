import { config } from 'dotenv';
config();

export const USE_MOCK_DATA = true;

if (USE_MOCK_DATA) {
  console.log('Using mock data for demonstration');
}

export * from './mock';
