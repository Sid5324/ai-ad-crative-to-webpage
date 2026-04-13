// packages/orchestrator/publish-gate.ts - Enhanced validation gate
import { 
  evaluateForPublish, 
  hasTemplateLeak, 
  scanForLeaks,
  type PublishGateInput 
} from './validator';

export interface PublishGateResult {
  canPublish: boolean;
  blockedSkills: string[];
  gateStatus: 'passed' | 'blocked' | 'warning';
  message: string;
  qualityScore: number;
  fallbackCount: number;
  validationIssues: Array<{
    code: string;
    message: string;
    severity: string;
  }>;
}

export class PublishGate {
  /**
   * Validate job result against publish criteria
   */
  validatePublishCriteria(jobResult: any): PublishGateResult {
    const blockedSkills: string[] = [];
    const validationIssues: Array<{ code: string; message: string; severity: string }> = [];
    let qualityScore = 100;
    let fallbackCount = 0;

    // 1. Check agent run results
    if (jobResult.debug?.agentRuns) {
      for (const [agentName, run] of Object.entries(jobResult.debug.agentRuns)) {
        const agentRun = run as any;
        
        // Check for fallback usage
        if (agentRun.skills_used?.some((skill: any) => skill.is_fallback)) {
          fallbackCount++;
          blockedSkills.push(`${agentName}:fallback_used`);
          validationIssues.push({
            code: 'FALLBACK_USED',
            message: `${agentName} used fallback skill`,
            severity: 'warning',
          });
        }
        
        // Low confidence
        if (agentRun.confidence !== undefined && agentRun.confidence < 0.7) {
          qualityScore -= 10;
          blockedSkills.push(`${agentName}:low_confidence`);
          validationIssues.push({
            code: 'LOW_CONFIDENCE',
            message: `${agentName} has low confidence: ${agentRun.confidence}`,
            severity: 'warning',
          });
        }
        
        // Failed agent
        if (agentRun.status === 'failed') {
          qualityScore -= 20;
          blockedSkills.push(`${agentName}:failed`);
          validationIssues.push({
            code: 'AGENT_FAILED',
            message: `${agentName} failed`,
            severity: 'fatal',
          });
        }
      }
    }

    // 2. Check for template leaks in the spec
    if (jobResult.spec) {
      const leakIssues = scanForLeaks(jobResult.spec, 'spec');
      for (const issue of leakIssues) {
        validationIssues.push({
          code: issue.code,
          message: issue.message,
          severity: issue.severity,
        });
        if (issue.severity === 'fatal') {
          qualityScore -= 30;
          blockedSkills.push(`leak:${issue.field}`);
        }
      }
    }

    // 3. Check validation issues
    if (jobResult.validation?.issues) {
      for (const issue of jobResult.validation.issues) {
        switch (issue.severity) {
          case 'fatal':
            qualityScore -= 25;
            blockedSkills.push(`validation:${issue.code}`);
            validationIssues.push({ ...issue, severity: 'fatal' });
            break;
          case 'warning':
            qualityScore -= 10;
            validationIssues.push({ ...issue, severity: 'warning' });
            break;
          case 'info':
            qualityScore -= 3;
            break;
        }
      }
    }

    // 4. Use the new evaluation function for structured content
    const structuredCheck = evaluateForPublish({
      brand: jobResult.spec?.brand,
      copy: jobResult.spec?.copy || jobResult.spec?.hero ? {
        hero: jobResult.spec?.hero,
        benefits: jobResult.spec?.benefits,
        stats: jobResult.spec?.stats,
      } : undefined,
      design: jobResult.spec?.designTokens || jobResult.spec?.design,
      qualityScore: jobResult.qualityScore,
      fallbackCount,
    });

    if (!structuredCheck.canPublish) {
      for (const reason of structuredCheck.reasons) {
        validationIssues.push({
          code: 'CONTENT_QUALITY',
          message: reason,
          severity: 'fatal',
        });
      }
    }

    // Use the minimum of both scoring approaches
    qualityScore = Math.min(qualityScore, structuredCheck.qualityScore);

    // 5. Determine gate status
    const canPublish = blockedSkills.length === 0 && qualityScore >= 80;
    let gateStatus: 'passed' | 'blocked' | 'warning';

    if (canPublish) {
      gateStatus = 'passed';
    } else if (qualityScore >= 50) {
      gateStatus = 'warning';
    } else {
      gateStatus = 'blocked';
    }

    // 6. Generate message
    let message = '';
    if (gateStatus === 'passed') {
      message = `Publish gate passed - quality score ${qualityScore}/100`;
    } else if (gateStatus === 'warning') {
      message = `Publish gate warning - quality score ${qualityScore}/100, ${validationIssues.length} issues found`;
    } else {
      message = `Publish gate BLOCKED - quality score ${qualityScore}/100, ${validationIssues.length} critical issues`;
    }

    return {
      canPublish,
      blockedSkills,
      gateStatus,
      message,
      qualityScore: Math.max(0, qualityScore),
      fallbackCount,
      validationIssues,
    };
  }

  /**
   * Apply publish gate to job result
   */
  applyPublishGate(jobResult: any): any {
    const gateResult = this.validatePublishCriteria(jobResult);
    
    return {
      ...jobResult,
      publishable: gateResult.canPublish,
      gateStatus: gateResult.gateStatus,
      blockedSkills: gateResult.blockedSkills,
      qualityScore: gateResult.qualityScore,
      fallbackCount: gateResult.fallbackCount,
      validationIssues: gateResult.validationIssues,
      message: gateResult.message,
      // Force success to false if blocked
      success: jobResult.success && gateResult.canPublish,
    };
  }
}