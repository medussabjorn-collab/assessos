import { Injectable } from '@nestjs/common';

export interface ProctoringAlert {
  type:
    | 'face_not_detected'
    | 'multiple_faces'
    | 'phone_detected'
    | 'tab_switch'
    | 'unusual_movement'
    | 'low_lighting';
  severity: 'warning' | 'critical';
  timestamp: Date;
  description: string;
}

export interface ProctoringReport {
  sessionId: string;
  integrityScore: number; // 0-100
  alerts: ProctoringAlert[];
  cheatingRisk: 'low' | 'medium' | 'high';
  recommendations: string[];
}

@Injectable()
export class ProctoringService {
  /**
   * AI-powered integrity monitoring during live interviews
   * Detects suspicious behavior via computer vision and activity monitoring
   */

  async monitorSession(sessionId: string): Promise<{
    monitoringStarted: boolean;
  }> {
    // Start real-time monitoring
    // In production: Stream video frames to ML model for analysis
    return { monitoringStarted: true };
  }

  async analyzeFrame(
    sessionId: string,
    frameData: Buffer,
  ): Promise<ProctoringAlert[]> {
    // Analyze video frame for suspicious activity
    // Uses computer vision (TensorFlow.js or AWS Rekognition)
    const alerts: ProctoringAlert[] = [];

    // Mock analysis - in production would use ML models
    if (Math.random() > 0.95) {
      alerts.push({
        type: 'multiple_faces',
        severity: 'critical',
        timestamp: new Date(),
        description: 'Multiple faces detected in frame',
      });
    }

    return alerts;
  }

  async trackActivity(sessionId: string): Promise<{
    screenLocked: boolean;
    browserTabSwitches: number;
    mouseInactive: boolean;
  }> {
    // Monitor system activity for suspicious behavior
    return {
      screenLocked: false,
      browserTabSwitches: 0,
      mouseInactive: false,
    };
  }

  async generateProctoringReport(
    sessionId: string,
    alerts: ProctoringAlert[],
  ): Promise<ProctoringReport> {
    // Generate integrity report based on monitoring data
    const criticalAlerts = alerts.filter((a) => a.severity === 'critical');
    const integrityScore = Math.max(0, 100 - criticalAlerts.length * 15);

    let cheatingRisk: 'low' | 'medium' | 'high' = 'low';
    if (integrityScore < 70) cheatingRisk = 'high';
    else if (integrityScore < 85) cheatingRisk = 'medium';

    const recommendations: string[] = [];
    if (cheatingRisk === 'high') {
      recommendations.push('Flag for manual review by hiring manager');
      recommendations.push('Consider rejecting candidacy');
    }

    return {
      sessionId,
      integrityScore,
      alerts,
      cheatingRisk,
      recommendations,
    };
  }

  async allowlistApplication(
    sessionId: string,
    environment: {
      osType: string;
      browserType: string;
    },
  ): Promise<void> {
    // Allowlist specific OS/browser combinations for fair testing
  }
}
