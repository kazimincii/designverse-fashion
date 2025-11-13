import Queue from 'bull';
import redis from '../config/redis';

export const videoGenerationQueue = new Queue('video-generation', {
  redis: {
    port: parseInt(process.env.REDIS_PORT || '6379'),
    host: process.env.REDIS_HOST || 'localhost',
  },
});

// Note: Job processor is defined in workers/videoGenerationWorker.ts
// to avoid duplicate handler errors

videoGenerationQueue.on('completed', (job, result) => {
  console.log(`Job ${job.id} completed with result:`, result);
});

videoGenerationQueue.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});

export const addVideoGenerationJob = async (data: any) => {
  return await videoGenerationQueue.add(data, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  });
};
