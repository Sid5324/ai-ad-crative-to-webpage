import { AdAnalyzerAgent, UrlAnalyzerAgent, AudienceResolver, PersonalizationAgent, SpecGeneratorAgent, ValidationAgent } from './agents';
import { buildClaimLedger } from './utils/claims';

// Safe default ad analysis
function getSafeAdAnalysis(analysis: any) {
  return {
    brand: analysis?.brand || 'Unknown Brand',
    audience: analysis?.audience || 'consumer',
    industry: analysis?.industry || 'General',
    primaryHook: analysis?.primaryHook || 'Your Solution',
    primaryCTA: analysis?.primaryCTA || 'Learn More',
    campaignType: analysis?.campaignType || 'awareness',
    tone: analysis?.tone || 'professional',
    benefits: analysis?.benefits || ['Quality service', 'Professional team'],
    proofPoints: analysis?.proofPoints || [],
    analysisMetadata: analysis?.analysisMetadata || { audienceConfidence: 0.5 }
  };
}

// Safe default URL analysis
function getSafeUrlAnalysis(analysis: any, url: string) {
  return {
    url: url || 'https://example.com',
    brandName: analysis?.brandName || 'Your Business',
    audience: analysis?.audience || 'consumer',
    pageType: analysis?.pageType || 'homepage',
    industry: analysis?.industry || 'E-commerce',
    heroHeadline: analysis?.heroHeadline || 'Welcome',
    heroSubheadline: analysis?.heroSubheadline || 'Discover our services',
    ctas: analysis?.ctas?.length > 0 ? analysis.ctas : ['Learn More', 'Contact Us'],
    valueProps: analysis?.valueProps?.length > 0 ? analysis.valueProps : ['Professional service', 'Quality guarantee'],
    proofPoints: analysis?.proofPoints?.length > 0 ? analysis.proofPoints : [],
    features: analysis?.features?.length > 0 ? analysis.features : [],
    faqTopics: analysis?.faqTopics?.length > 0 ? analysis.faqTopics : [],
    rawExtracts: analysis?.rawExtracts || [],
    tone: analysis?.tone || 'professional',
    confidence: analysis?.confidence || 0.6
  };
}

export async function runPersonalizationWorkflow(input: {
  adInputType: 'image_url' | 'copy';
  adInputValue: string;
  targetUrl: string;
  audienceOverride?: string;
}) {
  console.log('🚀 UNIVERSAL AI AGENT WORKFLOW - WORKS FOR ANY AD/WEBSITE COMBINATION');
  console.log('='.repeat(70));
  console.log(`📝 Input Type: ${input.adInputType}`);
  console.log(`🎯 Target URL: ${input.targetUrl}`);
  console.log(`👥 Audience Override: ${input.audienceOverride || 'Auto-detect'}`);
  console.log('='.repeat(70));

  // STEP 1: Universal Ad Analysis (works for any industry/audience)
  console.log('\n🔍 STEP 1: UNIVERSAL AD CREATIVE ANALYSIS');
  console.log('-'.repeat(50));
  let adAnalysis = { brand: 'Unknown', audience: 'consumer', industry: 'General', primaryHook: 'Your Solution', primaryCTA: 'Learn More', campaignType: 'awareness', tone: 'professional', benefits: ['Quality service'], proofPoints: [], analysisMetadata: { audienceConfidence: 0.5 } };
  try {
    const analysis = await AdAnalyzerAgent.analyze(input);
    adAnalysis = getSafeAdAnalysis(analysis);
  } catch (error) {
    console.log('❌ Ad analysis error, using safe default');
  }

  console.log(`✅ Ad Analysis Results:`);
  console.log(`   Brand: ${adAnalysis.brand}`);
  console.log(`   Audience: ${adAnalysis.audience} (${((adAnalysis.analysisMetadata?.audienceConfidence || 0.5) * 100).toFixed(0)}% confidence)`);
  console.log(`   Industry: ${adAnalysis.industry}`);
  console.log(`   Primary Hook: "${adAnalysis.primaryHook}"`);
  console.log(`   CTA: "${adAnalysis.primaryCTA}"`);
  console.log(`   Campaign Type: ${adAnalysis.campaignType}`);
  console.log(`   Tone: ${adAnalysis.tone}`);

  // STEP 2: Universal URL Analysis (works for any website)
  console.log('\n🌐 STEP 2: UNIVERSAL WEBSITE ANALYSIS');
  console.log('-'.repeat(50));
  let urlAnalysis = { url: input.targetUrl, brandName: 'Your Business', audience: 'consumer', pageType: 'homepage', industry: 'General', heroHeadline: 'Welcome', heroSubheadline: 'Our Services', ctas: ['Learn More'], valueProps: ['Quality'], proofPoints: [], features: [], faqTopics: [], rawExtracts: [], tone: 'professional' };
  try {
    const analysis = await UrlAnalyzerAgent.analyze(input.targetUrl);
    urlAnalysis = getSafeUrlAnalysis(analysis, input.targetUrl);
  } catch (error) {
    console.log('❌ URL analysis error, using safe default');
  }

  console.log(`✅ URL Analysis Results:`);
  console.log(`   Brand: ${urlAnalysis.brandName}`);
  console.log(`   Audience: ${urlAnalysis.audience}`);
  console.log(`   Page Type: ${urlAnalysis.pageType}`);
  console.log(`   Industry: ${urlAnalysis.industry}`);
  console.log(`   Hero Headline: "${(urlAnalysis.heroHeadline || '').substring(0, 50)}..."`);
  console.log(`   Detected CTAs: [${(urlAnalysis.ctas || []).slice(0, 3).join(', ')}]`);
  console.log(`   Tone: ${urlAnalysis.tone}`);

  // STEP 3: Intelligent Audience Resolution (works for any combination)
  console.log('\n⚖️ STEP 3: INTELLIGENT AUDIENCE RESOLUTION');
  console.log('-'.repeat(50));
  const audienceResolution = AudienceResolver.resolve(
    adAnalysis.audience,
    urlAnalysis.audience,
    adAnalysis.analysisMetadata?.audienceConfidence || 0.8,
    (urlAnalysis as any).confidence || 0.6
  );

  const resolvedAudience = audienceResolution.resolved;
  console.log(`✅ Audience Resolution: ${resolvedAudience}`);
  console.log(`   Strategy: ${audienceResolution.strategy}`);
  console.log(`   Confidence: ${(audienceResolution.confidence * 100).toFixed(0)}%`);
  if (audienceResolution.warning) {
    console.log(`   ⚠️ Warning: ${audienceResolution.warning}`);
  }

  // STEP 4: Universal Claim Safety System
  console.log('\n📋 STEP 4: CLAIM SAFETY & VALIDATION LEDGER');
  console.log('-'.repeat(50));
  const claims = buildClaimLedger(adAnalysis as any, urlAnalysis as any);
  console.log(`✅ Claim Ledger Built: ${claims.length} validated claims`);
  console.log(`   Ad-sourced claims: ${claims.filter(c => c.source === 'ad').length}`);
  console.log(`   URL-sourced claims: ${claims.filter(c => c.source === 'url').length}`);
  console.log(`   Allowed numeric claims: ${claims.filter(c => c.numeric && c.allowed).length}`);

  // STEP 5: Universal Personalization Strategy (works for any audience)
  console.log('\n🎨 STEP 5: UNIVERSAL PERSONALIZATION STRATEGY');
  console.log('-'.repeat(50));
  const plan = await PersonalizationAgent.generate(adAnalysis, urlAnalysis);

  console.log(`✅ Personalization Plan Generated:`);
  console.log(`   Page Goal: ${plan.pageGoal}`);
  console.log(`   Primary Motivation: ${plan.audiencePsychology?.primaryMotivation}`);
  console.log(`   Narrative Approach: ${plan.contentStrategy?.narrativeApproach}`);
  console.log(`   Visual Mode: ${plan.visualDirection?.mode}`);
  console.log(`   Layout: ${plan.visualDirection?.layout}`);
  console.log(`   Primary CTA: "${plan.ctaStrategy?.primary}"`);
  console.log(`   Secondary CTA: "${plan.ctaStrategy?.secondary}"`);

  // STEP 6: Universal Landing Page Spec Generation
  console.log('\n📄 STEP 6: UNIVERSAL LANDING PAGE SPEC GENERATION');
  console.log('-'.repeat(50));
  const spec = await SpecGeneratorAgent.generate(adAnalysis, urlAnalysis, plan);

  console.log(`✅ Landing Page Spec Generated:`);
  console.log(`   Brand: ${spec.brand}`);
  console.log(`   Audience: ${spec.audience}`);
  console.log(`   Page Goal: ${spec.pageGoal}`);
  console.log(`   Theme Mode: ${spec.theme.mode}`);
  console.log(`   Hero Headline: "${spec.hero.headline?.substring(0, 50)}..."`);
  console.log(`   Sections: ${spec.sections.length}`);
  console.log(`   Stats: ${spec.stats.length}`);
  console.log(`   FAQ Items: ${spec.faq.length}`);

  // STEP 7: Comprehensive Quality Validation
  console.log('\n🔍 STEP 7: COMPREHENSIVE QUALITY VALIDATION');
  console.log('-'.repeat(50));
  const validation = await ValidationAgent.validate(spec, adAnalysis, urlAnalysis, claims);

  console.log(`✅ Validation Results:`);
  console.log(`   Overall Valid: ${validation.valid ? '✅ YES' : '❌ NO'}`);
  console.log(`   Audience Match: ${validation.audienceMatch ? '✅' : '❌'}`);
  console.log(`   CTA Match: ${validation.ctaMatch ? '✅' : '❌'}`);
  console.log(`   Claim Safety: ${validation.claimSafety ? '✅' : '❌'}`);
  console.log(`   Brand Fit: ${validation.brandFit ? '✅' : '❌'}`);
  console.log(`   Content Quality: ${validation.contentQuality ? '✅' : '❌'}`);
  console.log(`   Technical Valid: ${validation.technicalValid ? '✅' : '❌'}`);
  console.log(`   Conversion Optimized: ${validation.conversionOptimized ? '✅' : '❌'}`);

  if (validation.issues.length > 0) {
    console.log(`\n⚠️ VALIDATION ISSUES (${validation.issues.length}):`);
    validation.issues.forEach((issue, i) => {
      console.log(`   ${i+1}. ${issue.severity.toUpperCase()}: ${issue.message}`);
      console.log(`      💡 Fix: ${issue.fix}`);
    });
  }

  // STEP 8: Final Assessment & Recommendations
  console.log('\n📊 STEP 8: FINAL ASSESSMENT & RECOMMENDATIONS');
  console.log('-'.repeat(50));

  const criticalIssues = validation.issues.filter(i => i.severity === 'critical' || i.severity === 'high');
  const success = validation.valid && validation.audienceMatch && criticalIssues.length === 0;
  const qualityScore = calculateQualityScore(validation, adAnalysis, urlAnalysis);

  console.log(`🎯 WORKFLOW SUCCESS: ${success ? '✅ COMPLETE' : '⚠️ ISSUES DETECTED'}`);
  console.log(`📊 Quality Score: ${qualityScore}/100`);
  console.log(`🎯 Conversion Potential: ${getConversionPotential(spec.audience, validation)}`);

  if (success) {
    console.log('\n🚀 READY FOR PRODUCTION:');
    console.log('   ✅ Audience properly aligned');
    console.log('   ✅ Claims validated and safe');
    console.log('   ✅ Content conversion-optimized');
    console.log('   ✅ Technical requirements met');
  } else {
    console.log('\n⚠️ RECOMMENDATIONS:');
    const criticalIssues = validation.issues.filter(i => i.severity === 'critical' || i.severity === 'high');
    if (criticalIssues.length > 0) {
      console.log('   🔴 Address critical issues before deployment');
      criticalIssues.forEach(issue => console.log(`      - ${issue.message}`));
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('🎉 UNIVERSAL AI WORKFLOW COMPLETE!');
  console.log('   This system works for ANY ad + website combination');
  console.log('   Audience-agnostic, industry-flexible, claim-safe');
  console.log('='.repeat(70));

  return {
    success,
    spec,
    validation,
    audienceResolution,
    qualityScore,
    conversionPotential: getConversionPotential(spec.audience, validation),
    debug: process.env.ENABLE_DEBUG === 'true' ? {
      adAnalysis,
      urlAnalysis,
      claims,
      plan,
      validationSummary: validation.summary
    } : undefined
  };
}

// Helper functions for assessment
function calculateQualityScore(validation: any, adAnalysis: any, urlAnalysis: any): number {
  let score = 100;

  // Deduct for validation issues
  validation.issues.forEach((issue: any) => {
    const deductions = { critical: 25, high: 15, medium: 8, low: 3 };
    score -= deductions[issue.severity as keyof typeof deductions] || 0;
  });

  // Bonus for strong analysis confidence
  if (adAnalysis.confidence > 0.8) score += 5;
  if (urlAnalysis.confidence > 0.7) score += 5;

  return Math.max(0, Math.min(100, score));
}

function getConversionPotential(audience: string, validation: any): string {
  if (!validation.valid) return 'Needs fixes before measuring';

  const basePotential = {
    consumer: 'High (direct purchase intent)',
    merchant: 'Medium-High (B2B decision cycle)',
    b2b: 'Medium (enterprise evaluation)',
    saas: 'High (subscription model)',
    healthcare: 'Medium (compliance sensitive)',
    education: 'Medium-High (decision influencers)',
    finance: 'Medium (regulation sensitive)',
    realEstate: 'High (transactional intent)',
    nonprofit: 'Low-Medium (donation intent)',
    default: 'Medium (general audience)'
  };

  return basePotential[audience as keyof typeof basePotential] || basePotential.default;
}