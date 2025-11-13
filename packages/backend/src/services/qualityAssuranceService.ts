import { ConsistencyScore } from './aiConsistencyEngine';
import type { CharacterReference, GarmentReference, StyleReference, GenerationHistory } from '@prisma/client';
import { prisma } from '../config/database';

/**
 * Quality Assurance Service
 *
 * Manages quality control, auto-regeneration decisions,
 * and feedback analysis for AI-generated content.
 */

export interface QualityCheckResult {
  passed: boolean;
  issues: QualityIssue[];
  recommendations: string[];
  shouldRegenerate: boolean;
  regenerationReason?: string;
}

export interface QualityIssue {
  severity: 'critical' | 'major' | 'minor';
  category: 'face' | 'garment' | 'style' | 'overall';
  description: string;
  score: number;
  threshold: number;
}

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

export class QualityAssuranceService {
  // Quality thresholds
  private static readonly THRESHOLDS = {
    CRITICAL: {
      overall: 60,
      face: 50,
      garment: 55,
      style: 50,
    },
    ACCEPTABLE: {
      overall: 70,
      face: 65,
      garment: 68,
      style: 65,
    },
    GOOD: {
      overall: 80,
      face: 78,
      garment: 80,
      style: 75,
    },
    EXCELLENT: {
      overall: 90,
      face: 88,
      garment: 90,
      style: 85,
    },
  };

  /**
   * Perform comprehensive quality check on generated content
   */
  static performQualityCheck(
    consistencyScore: ConsistencyScore,
    params: {
      hasCharacterRef: boolean;
      hasGarmentRef: boolean;
      hasStyleRef: boolean;
    }
  ): QualityCheckResult {
    const issues: QualityIssue[] = [];
    const recommendations: string[] = [];

    // Check overall score
    if (consistencyScore.overall < this.THRESHOLDS.CRITICAL.overall) {
      issues.push({
        severity: 'critical',
        category: 'overall',
        description: 'Overall consistency score is critically low',
        score: consistencyScore.overall,
        threshold: this.THRESHOLDS.CRITICAL.overall,
      });
      recommendations.push('Regenerate with higher guidance scale and more inference steps');
    } else if (consistencyScore.overall < this.THRESHOLDS.ACCEPTABLE.overall) {
      issues.push({
        severity: 'major',
        category: 'overall',
        description: 'Overall consistency score is below acceptable threshold',
        score: consistencyScore.overall,
        threshold: this.THRESHOLDS.ACCEPTABLE.overall,
      });
      recommendations.push('Consider regenerating or adjusting prompt');
    }

    // Check face score if character reference used
    if (params.hasCharacterRef && consistencyScore.faceScore !== undefined) {
      if (consistencyScore.faceScore < this.THRESHOLDS.CRITICAL.face) {
        issues.push({
          severity: 'critical',
          category: 'face',
          description: 'Face consistency is critically low - character identity not preserved',
          score: consistencyScore.faceScore,
          threshold: this.THRESHOLDS.CRITICAL.face,
        });
        recommendations.push('Try using PhotoMaker instead of InstantID');
        recommendations.push('Increase IP adapter scale');
      } else if (consistencyScore.faceScore < this.THRESHOLDS.ACCEPTABLE.face) {
        issues.push({
          severity: 'major',
          category: 'face',
          description: 'Face consistency is below acceptable - partial identity loss',
          score: consistencyScore.faceScore,
          threshold: this.THRESHOLDS.ACCEPTABLE.face,
        });
        recommendations.push('Adjust controlnet conditioning scale');
      }
    }

    // Check garment score if garment reference used
    if (params.hasGarmentRef && consistencyScore.garmentScore !== undefined) {
      if (consistencyScore.garmentScore < this.THRESHOLDS.CRITICAL.garment) {
        issues.push({
          severity: 'critical',
          category: 'garment',
          description: 'Garment accuracy is critically low - colors or patterns incorrect',
          score: consistencyScore.garmentScore,
          threshold: this.THRESHOLDS.CRITICAL.garment,
        });
        recommendations.push('Try OOTDiffusion instead of IDM-VTON');
        recommendations.push('Enhance garment description in prompt');
      } else if (consistencyScore.garmentScore < this.THRESHOLDS.ACCEPTABLE.garment) {
        issues.push({
          severity: 'major',
          category: 'garment',
          description: 'Garment accuracy is below acceptable - some details missing',
          score: consistencyScore.garmentScore,
          threshold: this.THRESHOLDS.ACCEPTABLE.garment,
        });
        recommendations.push('Add more color keywords to prompt');
      }
    }

    // Check style score if style reference used
    if (params.hasStyleRef && consistencyScore.styleScore !== undefined) {
      if (consistencyScore.styleScore < this.THRESHOLDS.CRITICAL.style) {
        issues.push({
          severity: 'critical',
          category: 'style',
          description: 'Style consistency is critically low - lighting/mood incorrect',
          score: consistencyScore.styleScore,
          threshold: this.THRESHOLDS.CRITICAL.style,
        });
        recommendations.push('Use ControlNet for better style transfer');
        recommendations.push('Strengthen style keywords in prompt');
      } else if (consistencyScore.styleScore < this.THRESHOLDS.ACCEPTABLE.style) {
        issues.push({
          severity: 'minor',
          category: 'style',
          description: 'Style consistency is below acceptable',
          score: consistencyScore.styleScore,
          threshold: this.THRESHOLDS.ACCEPTABLE.style,
        });
        recommendations.push('Adjust lighting parameters');
      }
    }

    // Determine if regeneration is needed
    const criticalIssues = issues.filter(i => i.severity === 'critical');
    const shouldRegenerate = criticalIssues.length > 0 || consistencyScore.overall < this.THRESHOLDS.ACCEPTABLE.overall;

    let regenerationReason;
    if (shouldRegenerate) {
      if (criticalIssues.length > 0) {
        regenerationReason = `Critical issues: ${criticalIssues.map(i => i.category).join(', ')}`;
      } else {
        regenerationReason = 'Overall consistency below acceptable threshold';
      }
    }

    return {
      passed: issues.filter(i => i.severity === 'critical').length === 0,
      issues,
      recommendations,
      shouldRegenerate,
      regenerationReason,
    };
  }

  /**
   * Get quality rating from consistency score
   */
  static getQualityRating(score: number): 'poor' | 'fair' | 'good' | 'excellent' {
    if (score >= this.THRESHOLDS.EXCELLENT.overall) return 'excellent';
    if (score >= this.THRESHOLDS.GOOD.overall) return 'good';
    if (score >= this.THRESHOLDS.ACCEPTABLE.overall) return 'fair';
    return 'poor';
  }

  /**
   * Analyze generation history to identify patterns
   */
  static async analyzeGenerationHistory(
    sessionId: string,
    referenceType?: 'character' | 'garment' | 'style'
  ): Promise<{
    patterns: string[];
    successFactors: string[];
    failureFactors: string[];
    recommendations: string[];
  }> {
    const histories = await prisma.generationHistory.findMany({
      where: {
        sessionId,
        consistencyScore: { not: null },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const patterns: string[] = [];
    const successFactors: string[] = [];
    const failureFactors: string[] = [];
    const recommendations: string[] = [];

    if (histories.length === 0) {
      return { patterns, successFactors, failureFactors, recommendations };
    }

    // Calculate averages
    const avgScore = histories.reduce((sum, h) => sum + (h.consistencyScore || 0), 0) / histories.length;
    const avgFaceScore = histories
      .filter(h => h.faceSimScore)
      .reduce((sum, h) => sum + (h.faceSimScore || 0), 0) / histories.filter(h => h.faceSimScore).length || 0;
    const avgGarmentScore = histories
      .filter(h => h.garmentAccScore)
      .reduce((sum, h) => sum + (h.garmentAccScore || 0), 0) / histories.filter(h => h.garmentAccScore).length || 0;

    // Identify patterns
    if (avgScore < this.THRESHOLDS.ACCEPTABLE.overall) {
      patterns.push('Consistently low overall scores - may need better reference images');
    }
    if (avgFaceScore < this.THRESHOLDS.ACCEPTABLE.face && avgFaceScore > 0) {
      patterns.push('Face preservation struggling - character reference may be low quality');
      failureFactors.push('Poor face similarity scores');
      recommendations.push('Use higher quality face reference images with clear, well-lit faces');
    }
    if (avgGarmentScore < this.THRESHOLDS.ACCEPTABLE.garment && avgGarmentScore > 0) {
      patterns.push('Garment accuracy issues - may need more detailed garment descriptions');
      failureFactors.push('Inconsistent garment rendering');
      recommendations.push('Provide more specific garment color and pattern descriptions');
    }

    // Analyze regenerations
    const regenerationRate = histories.filter(h => h.wasRegenerated).length / histories.length;
    if (regenerationRate > 0.5) {
      patterns.push('High regeneration rate - prompts or references may need optimization');
      recommendations.push('Review and optimize prompts for better first-try success');
    }

    // Identify success factors
    const successfulGenerations = histories.filter(h => (h.consistencyScore || 0) >= this.THRESHOLDS.GOOD.overall);
    if (successfulGenerations.length > 0) {
      const modelNames = successfulGenerations.map(h => h.modelName).filter((m): m is string => m !== null);
      const commonModels = this.findCommonValues(modelNames);
      if (commonModels.length > 0) {
        successFactors.push(`Models with best results: ${commonModels.join(', ')}`);
        recommendations.push(`Prefer using ${commonModels[0]} for this session`);
      }
    }

    return {
      patterns,
      successFactors,
      failureFactors,
      recommendations,
    };
  }

  /**
   * Get quality metrics for a session
   */
  static async getQualityMetrics(sessionId: string): Promise<QualityMetrics> {
    const histories = await prisma.generationHistory.findMany({
      where: { sessionId },
    });

    if (histories.length === 0) {
      return {
        averageConsistencyScore: 0,
        averageFaceScore: 0,
        averageGarmentScore: 0,
        averageStyleScore: 0,
        regenerationRate: 0,
        successRate: 0,
        totalGenerations: 0,
        totalCost: 0,
      };
    }

    const withScores = histories.filter(h => h.consistencyScore !== null);
    const avgConsistency = withScores.length > 0
      ? withScores.reduce((sum, h) => sum + (h.consistencyScore || 0), 0) / withScores.length
      : 0;

    const withFaceScores = histories.filter(h => h.faceSimScore !== null);
    const avgFace = withFaceScores.length > 0
      ? withFaceScores.reduce((sum, h) => sum + (h.faceSimScore || 0), 0) / withFaceScores.length
      : 0;

    const withGarmentScores = histories.filter(h => h.garmentAccScore !== null);
    const avgGarment = withGarmentScores.length > 0
      ? withGarmentScores.reduce((sum, h) => sum + (h.garmentAccScore || 0), 0) / withGarmentScores.length
      : 0;

    const withStyleScores = histories.filter(h => h.styleMatchScore !== null);
    const avgStyle = withStyleScores.length > 0
      ? withStyleScores.reduce((sum, h) => sum + (h.styleMatchScore || 0), 0) / withStyleScores.length
      : 0;

    const regenerationRate = histories.filter(h => h.wasRegenerated).length / histories.length;
    const successRate = withScores.filter(h => (h.consistencyScore || 0) >= this.THRESHOLDS.ACCEPTABLE.overall).length / withScores.length;
    const totalCost = histories.reduce((sum, h) => sum + (h.apiCostUsd || 0), 0);

    return {
      averageConsistencyScore: Math.round(avgConsistency),
      averageFaceScore: Math.round(avgFace),
      averageGarmentScore: Math.round(avgGarment),
      averageStyleScore: Math.round(avgStyle),
      regenerationRate: Math.round(regenerationRate * 100) / 100,
      successRate: Math.round(successRate * 100) / 100,
      totalGenerations: histories.length,
      totalCost: Math.round(totalCost * 100) / 100,
    };
  }

  /**
   * Process user feedback on generation quality
   */
  static async processFeedback(params: {
    generationHistoryId: string;
    userRating: number; // 1-5
    userFeedback?: string;
    specificIssues?: string[];
  }): Promise<void> {
    // Get existing metadata
    const existing = await prisma.generationHistory.findUnique({
      where: { id: params.generationHistoryId },
      select: { metadataJson: true },
    });

    const metadata = (existing?.metadataJson as any) || {};
    metadata.userReportedIssues = params.specificIssues;

    await prisma.generationHistory.update({
      where: { id: params.generationHistoryId },
      data: {
        userRating: params.userRating,
        userFeedback: params.userFeedback,
        metadataJson: metadata,
      },
    });

    // TODO: Analyze feedback patterns and adjust thresholds
    // This would involve machine learning to correlate user ratings
    // with consistency scores and adjust quality thresholds accordingly
  }

  /**
   * Find common values in array (helper)
   */
  private static findCommonValues(values: string[]): string[] {
    const counts: Record<string, number> = {};
    values.forEach(v => {
      counts[v] = (counts[v] || 0) + 1;
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([value]) => value);
  }

  /**
   * Generate quality report for session
   */
  static async generateQualityReport(sessionId: string): Promise<{
    metrics: QualityMetrics;
    analysis: Awaited<ReturnType<typeof QualityAssuranceService.analyzeGenerationHistory>>;
    overallRating: string;
    summary: string;
  }> {
    const metrics = await this.getQualityMetrics(sessionId);
    const analysis = await this.analyzeGenerationHistory(sessionId);

    const overallRating = this.getQualityRating(metrics.averageConsistencyScore);

    let summary = `Generated ${metrics.totalGenerations} images with ${Math.round(metrics.successRate * 100)}% success rate. `;
    summary += `Average consistency score: ${metrics.averageConsistencyScore}/100 (${overallRating}). `;
    if (metrics.regenerationRate > 0.3) {
      summary += `High regeneration rate (${Math.round(metrics.regenerationRate * 100)}%) suggests room for optimization. `;
    }
    summary += `Total cost: $${metrics.totalCost.toFixed(2)}.`;

    return {
      metrics,
      analysis,
      overallRating,
      summary,
    };
  }
}
