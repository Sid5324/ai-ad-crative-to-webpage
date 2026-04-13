// packages/agents/offer-proof-guard.ts
import { BaseAgent } from './base-agent';
import { OfferProofGuardOutput } from '../schemas/types';

export interface OfferProofGuardInput {
  copy: any;
  sourceFacts: any;
}

export class OfferProofGuardAgent extends BaseAgent<OfferProofGuardInput, OfferProofGuardOutput> {
  constructor() {
    super({
      name: 'offer-proof-guard',
      version: '1.0.0',
      memoryPolicy: {
        read_scopes: ['request', 'brand'],
        write_scopes: ['request', 'qa'],
        retrieval_mode: 'selective'
      },
      skills: {
        required: [
          'claim-verification',
          'fact-grounding',
          'rewrite-safety',
          'legal-risk-flagging'
        ],
        optional: [
          'regulatory-compliance-checking'
        ]
      }
    });
  }

  protected async executeCore(context: {
    input: OfferProofGuardInput;
    memory: any[];
    previousOutputs: Map<string, any>;
  }): Promise<OfferProofGuardOutput> {
    const { input } = context;

    // Extract all claims from copy
    const allClaims = this.extractClaimsFromCopy(input.copy);

    // Verify claims against source facts
    const verifiedClaims = await this.verifyClaims(allClaims, input.sourceFacts);

    // Check for legal risks
    const legalCheck = await this.checkLegalRisks(input.copy, input.sourceFacts);

    // Generate safe rewrites for problematic content
    const safeRewrites = await this.generateSafeRewrites(verifiedClaims.flagged_claims);

    return {
      approved_claims: verifiedClaims.approved_claims.map(c => c.claim),
      flagged_claims: verifiedClaims.flagged_claims.map(c => ({
        claim: c.claim,
        reason: c.reason,
        action: c.action
      })),
      safe_rewrites: safeRewrites.map(r => ({
        original: r.original,
        rewrite: r.rewrite
      }))
    };
  }

  private extractClaimsFromCopy(copy: any): string[] {
    const claims = [];

    // Extract from hero section
    if (copy.hero) {
      claims.push(copy.hero.headline);
      claims.push(copy.hero.subheadline);
    }

    // Extract from benefits
    if (copy.benefits) {
      copy.benefits.forEach((benefit: any) => {
        claims.push(benefit.title);
        claims.push(benefit.body);
      });
    }

    // Extract from stats
    if (copy.stats) {
      copy.stats.forEach((stat: any) => {
        claims.push(`${stat.value} ${stat.label}`);
      });
    }

    return claims.filter(claim => claim && claim.length > 0);
  }

  private async verifyClaims(claims: string[], sourceFacts: any): Promise<any> {
    const verificationResults = await this.executeSkill('claim-verification', {
      claims,
      context: sourceFacts
    });

    return {
      approved_claims: verificationResults.verified_claims || claims.map(claim => ({ claim, status: 'verified' })),
      flagged_claims: verificationResults.flagged_claims || []
    };
  }

  private async checkLegalRisks(copy: any, sourceFacts: any): Promise<any> {
    const legalCheck = await this.executeSkill('legal-risk-flagging', {
      content: copy,
      context: sourceFacts,
      jurisdiction: 'general' // Could be made configurable
    });

    return {
      risks: legalCheck.risks || [],
      recommendations: legalCheck.recommendations || []
    };
  }

  private async generateSafeRewrites(flaggedClaims: any[]): Promise<any[]> {
    const rewrites = [];

    for (const flagged of flaggedClaims) {
      if (flagged.action === 'rewrite') {
        const rewriteResult = await this.executeSkill('rewrite-safety', {
          original_claim: flagged.claim,
          issue: flagged.reason,
          context: 'marketing_copy'
        });

        rewrites.push({
          original: flagged.claim,
          rewrite: rewriteResult.rewrite || this.generateConservativeRewrite(flagged.claim)
        });
      }
    }

    return rewrites;
  }

  private generateConservativeRewrite(original: string): string {
    // Generate a more conservative version of claims that might be problematic

    if (original.toLowerCase().includes('guarantee')) {
      return original.replace(/guarantee/i, 'commitment');
    }

    if (original.toLowerCase().includes('best')) {
      return original.replace(/best/i, 'leading');
    }

    if (original.toLowerCase().includes('revolutionary')) {
      return original.replace(/revolutionary/i, 'innovative');
    }

    if (original.toLowerCase().includes('unlimited')) {
      return original.replace(/unlimited/i, 'extensive');
    }

    // Default: make it more qualified
    return original.replace(/is/i, 'can be').replace(/are/i, 'can be');
  }

  protected calculateConfidence(output: OfferProofGuardOutput): number {
    let confidence = 0.9; // Base confidence for validation

    const totalClaims = output.approved_claims.length + output.flagged_claims.length;
    const approvedRatio = totalClaims > 0 ? output.approved_claims.length / totalClaims : 1;

    // Reduce confidence based on flagged claims
    confidence -= (output.flagged_claims.length * 0.1);

    // Increase confidence for safe rewrites provided
    if (output.safe_rewrites.length > 0) {
      confidence += 0.05;
    }

    return Math.max(0.6, Math.min(1.0, confidence));
  }

  protected extractPatterns(output: OfferProofGuardOutput): any {
    return {
      approved_claims: output.approved_claims,
      flagged_claims: output.flagged_claims.map(c => c.claim),
      rewrite_patterns: output.safe_rewrites.map(r => ({ from: r.original, to: r.rewrite }))
    };
  }
}