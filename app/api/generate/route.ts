// src/app/api/generate/route.ts - AI Content Generation System
import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { runPersonalizationWorkflow } from '@/lib/workflow';
import { getBrandDesign } from '@/lib/brand-designs';

const PREVIEWS: Record<string, any> = {};

export async function POST(req: Request) {
  console.log('🚀 AI CONTENT GENERATION START');

  const body = await req.json();
  const input = {
    adInputType: body.adInputType || 'copy',
    adInputValue: body.adInputValue || '',
    targetUrl: body.targetUrl || '',
    audienceOverride: body.targetAudience || undefined,
  };

  try {

    if (!input.adInputValue || !input.targetUrl) {
      throw new Error('adInputValue and targetUrl are required');
    }

    console.log('📋 Input:', input.adInputValue);
    console.log('🎯 Target:', input.targetUrl);

    // Use AI agents to generate personalized content (not templates!)
    const result = await runPersonalizationWorkflow(input);

    if (!result.success) {
      throw new Error('AI content generation failed');
    }

    // Get design templates (colors, layouts) based on brand detection
    const design = getBrandDesign(input.targetUrl, result.spec.brand);

    // Combine AI-generated content with design templates
    const finalSpec = {
      ...result.spec,
      designTokens: {
        colorPrimary: design.colors.primary,
        gradient: design.colors.gradient,
        accent: design.colors.accent,
      },
      // Use AI-generated content, not template content
      hero: {
        headline: result.spec.hero?.headline || 'Professional Service',
        subheadline: result.spec.hero?.subheadline || 'Quality solutions for your needs',
        primaryCTA: { label: result.spec.hero?.primaryCTA || 'Get Started', href: '#book' },
        secondaryCTA: { label: result.spec.hero?.secondaryCTA || 'Learn More', href: '#learn' },
      },
      stats: result.spec.stats || design.stats,
      sections: result.spec.sections || [],
      closingCTA: result.spec.closingCTA,
    };

    const previewId = nanoid(10);
    PREVIEWS[previewId] = { spec: finalSpec, brand: result.spec.brand };

    console.log('✅ AI Generated Content:');
    console.log('   Brand:', result.spec.brand);
    console.log('   Headline:', finalSpec.hero.headline);
    console.log('   Quality Score:', result.qualityScore);

    return NextResponse.json({
      success: true,
      previewId,
      spec: finalSpec,
      qualityScore: result.qualityScore,
      engine: 'ai-content-generation',
      debug: {
        brand: result.spec.brand,
        audience: result.audienceResolution?.resolved,
        conversionPotential: result.conversionPotential,
      },
    });

    return NextResponse.json({
      success: true,
      previewId,
      spec: finalSpec,
      qualityScore: result.qualityScore,
      engine: 'ai-content-generation',
      debug: {
        brand: result.spec.brand,
        audience: result.audienceResolution?.resolved,
        conversionPotential: result.conversionPotential,
      },
    });

  } catch (error: any) {
    console.error('❌ ERROR:', error.message);

    // AI fallback - basic spec with design
    const design = getBrandDesign(input.targetUrl);
    const fallbackSpec = {
      brand: 'Your Business',
      audience: 'consumer',
      hero: {
        headline: 'Professional Service',
        subheadline: 'Quality solutions for your needs',
        primaryCTA: { label: 'Get Started', href: '#book' },
        secondaryCTA: { label: 'Learn More', href: '#learn' },
      },
      stats: design.stats,
      sections: [
        {
          type: 'benefits',
          title: 'Why Choose Us?',
          items: [
            { title: 'Quality Service', body: 'Professional solutions you can trust' },
            { title: 'Expert Team', body: 'Years of experience in our field' },
          ],
        },
      ],
      designTokens: {
        colorPrimary: design.colors.primary,
        gradient: design.colors.gradient,
        accent: design.colors.accent,
      },
    };

    return NextResponse.json({
      success: true,
      previewId: nanoid(10),
      spec: fallbackSpec,
      qualityScore: 70,
      engine: 'ai-fallback',
      debug: { fallback: true, error: error.message },
    });
  }
}



export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id || !PREVIEWS[id]) {
    return NextResponse.json({ error: 'Preview expired' }, { status: 404 });
  }
  return NextResponse.json(PREVIEWS[id]);
}