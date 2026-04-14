// Test script to find working Gemini vision models
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error('❌ No Gemini API key found');
  process.exit(1);
}

const MODELS_TO_TEST = [
  'gemini-pro',
  'gemini-pro-vision',
  'gemini-1.0-pro',
  'gemini-1.0-pro-vision',
  'gemini-1.5-pro-latest',
  'gemini-1.5-flash-latest',
  'gemini-pro-vision-1.0',
  'gemini-1.5-pro-001',
  'gemini-1.5-flash-001',
  'gemini-1.5-pro',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b'
];

async function testModel(modelName) {
  console.log(`\n🧪 Testing model: ${modelName}`);

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: modelName });

    // Test with text first
    const textResult = await model.generateContent('Say "Hello"');
    console.log(`  ✅ Text test passed: ${textResult.response.text().substring(0, 20)}...`);

    // Test with image
    const imagePath = 'D:\\ai\\imp\\ai ad crative to webpage\\Gemini_Generated_Image_laeivilaeivilaei (1).png';
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');

    const imageResult = await model.generateContent([
      'Analyze this image for landing page content. Extract text, determine B2B vs B2C intent, find proof points.',
      {
        inlineData: {
          mimeType: 'image/png',
          data: base64Image
        }
      }
    ]);

    const analysis = imageResult.response.text();
    console.log(`  ✅ Vision test passed! Analysis: ${analysis.substring(0, 100)}...`);
    return { model: modelName, works: true, analysis };

  } catch (error) {
    console.log(`  ❌ Failed: ${error.message}`);
    return { model: modelName, works: false, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Testing Gemini models for vision capabilities...\n');

  const results = [];

  for (const modelName of MODELS_TO_TEST) {
    const result = await testModel(modelName);
    results.push(result);

    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n📊 RESULTS SUMMARY:');
  console.log('==================');

  const workingModels = results.filter(r => r.works);
  const failedModels = results.filter(r => !r.works);

  console.log(`✅ Working models: ${workingModels.length}`);
  workingModels.forEach(model => {
    console.log(`  - ${model.model}`);
  });

  console.log(`❌ Failed models: ${failedModels.length}`);

  if (workingModels.length > 0) {
    console.log('\n🎯 RECOMMENDED MODEL:', workingModels[0].model);
    console.log('\n📝 SAMPLE ANALYSIS:');
    console.log(workingModels[0].analysis);
  } else {
    console.log('\n❌ No working vision models found');
  }
}

runTests().catch(console.error);