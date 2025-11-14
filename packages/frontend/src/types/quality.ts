/**
 * Quality Metrics & Analytics Types
 */

export interface QualityMetrics {
  averageConsistencyScore: number;
  averageFaceScore: number;
  averageGarmentScore: number;
  averageStyleScore: number;
  regenerationRate: number;
  successRate: number;
  totalGenerations: number;
  totalCost: number;
}

export interface QualityIssue {
  severity: 'critical' | 'warning' | 'info';
  category: string;
  description: string;
  score: number;
  threshold: number;
}

export interface GenerationAnalysis {
  patterns: string[];
  successFactors: string[];
  failureFactors: string[];
  recommendations: string[];
}

export interface QualitySummary {
  overallQuality: 'excellent' | 'good' | 'fair' | 'poor';
  averageScore: number;
  successRate: number;
  totalGenerations: number;
  totalCost: number;
}

export interface QualityTrends {
  scoreTrend: 'improving' | 'stable' | 'declining';
  regenerationTrend: 'improving' | 'stable' | 'declining';
  costTrend: 'increasing' | 'stable' | 'decreasing';
  commonIssues?: string[];
}

export interface Recommendation {
  priority: 'high' | 'medium' | 'low';
  category: string;
  suggestion: string;
  expectedImprovement?: string;
}

export interface PerformanceInsights {
  avgProcessingTime?: number;
  mostEfficientModel?: string;
  costPerGeneration?: number;
}

export interface QualityReport {
  summary: QualitySummary;
  issues: QualityIssue[];
  trends?: QualityTrends;
  recommendations: Recommendation[];
  performanceInsights?: PerformanceInsights;
}

export interface GenerationHistory {
  id: string;
  sessionId: string;
  generatedAssetId: string;
  jobId: string | null;
  characterRefId: string | null;
  garmentRefId: string | null;
  styleRefId: string | null;
  stepNumber: number;
  basePrompt: string;
  enhancedPrompt: string;
  negativePrompt: string | null;
  prompt: string; // Alias for basePrompt for display
  consistencyScore: number | null;
  faceSimScore: number | null;
  garmentAccScore: number | null;
  styleMatchScore: number | null;
  modelProvider: string | null;
  modelName: string | null;
  wasRegenerated: boolean;
  userRating: number | null;
  userFeedback: string | null;
  reportedIssues?: string[];
  qualityIssues?: string[];
  apiCostUsd: number | null;
  processingTimeMs: number | null;
  numInferenceSteps: number | null;
  guidanceScale: number | null;
  createdAt: string;
  characterRef?: any;
  garmentRef?: any;
  styleRef?: any;
}

export interface FeedbackRequest {
  rating: number;
  feedback?: string;
  issues?: string[];
}
