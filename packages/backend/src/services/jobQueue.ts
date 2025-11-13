import Queue from 'bull';
import redis from '../config/redis';

export const videoGenerationQueue = new Queue('video-generation', {
  redis: {
    port: parseInt(process.env.REDIS_PORT || '6379'),
    host: process.env.REDIS_HOST || 'localhost',
  },
});

// Job processor
videoGenerationQueue.process(async (job) => {
  console.log(`Processing job ${job.id}:`, job.data);

  try {
    const { jobId, userId, jobType, inputPayload } = job.data;

    // Update job status to RUNNING
    // await updateJobStatus(jobId, 'RUNNING');

    // Here you would call the AI video generation API
    // For MVP, this is a placeholder
    // const result = await generateVideo(inputPayload);

    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Update job with results
    // await updateJobStatus(jobId, 'SUCCEEDED', result);

    return { success: true, jobId };
  } catch (error) {
    console.error('Job failed:', error);
    // await updateJobStatus(jobId, 'FAILED', null, error.message);
    throw error;
  }
});

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
