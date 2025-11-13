export type PlanType = 'FREE' | 'PAID';
export type Privacy = 'PRIVATE' | 'UNLISTED' | 'PUBLIC';
export type StoryStatus = 'DRAFT' | 'PUBLISHED';
export type SourceType = 'GENERATED' | 'UPLOADED';

export interface User {
  id: string;
  email: string;
  displayName: string;
  handle: string;
  bio?: string;
  avatarUrl?: string;
  planType: PlanType;
  creditsBalance: number;
  createdAt: string;
}

export interface Story {
  id: string;
  ownerId: string;
  title: string;
  description?: string;
  status: StoryStatus;
  privacy: Privacy;
  coverClipId?: string;
  totalDurationSeconds?: number;
  publishedAt?: string;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  owner?: User;
  clips?: Clip[];
  _count?: {
    likes: number;
    comments: number;
  };
}

export interface Clip {
  id: string;
  storyId: string;
  orderIndex: number;
  sourceType: SourceType;
  inputPrompt?: string;
  modelProvider?: string;
  modelName?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  durationSeconds: number;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  textOverlays?: TextOverlay[];
}

export interface TextOverlay {
  id: string;
  storyId: string;
  clipId?: string;
  startTime: number;
  endTime: number;
  content: string;
  position: string;
  styleJson?: any;
}

export interface AudioTrack {
  id: string;
  storyId: string;
  type: string;
  sourceType: string;
  audioUrl: string;
  startTime: number;
  endTime: number;
  volume: number;
}

export interface Comment {
  id: string;
  storyId: string;
  authorId: string;
  parentCommentId?: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: User;
  replies?: Comment[];
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  payloadJson: any;
  readAt?: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
