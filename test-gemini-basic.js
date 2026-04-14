// Test basic Gemini access (no vision) to check if API key works
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
if (!API_KEY) {
  console.error('❌ No GOOGLE_GENERATIVE_AI_API_KEY found');
  process.exit(1);
}

async function testBasicGemini() {
  console.log('🧪 Testing basic Gemini access...');

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);

    // Try different models
    const modelsToTry = ['gemini-pro', 'gemini-1.5-flash', 'gemini-1.5-pro'];

    for (const modelName of modelsToTry) {
      console.log(`\n📋 Testing ${modelName}...`);

      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Say hello and confirm you can see this message.');
        const response = await result.response;
        const text = response.text();

        console.log(`✅ ${modelName} works! Response: ${text}`);
        return modelName; // Return the first working model

      } catch (error) {
        console.log(`❌ ${modelName} failed: ${error.message}`);
      }
    }

    console.log('\n❌ No Gemini models work');
    return null;

  } catch (error) {
    console.error('❌ Gemini setup error:', error);
    return null;
  }
}

testBasicGemini().then(workingModel => {
  if (workingModel) {
    console.log(`\n🎯 Use this model: ${workingModel}`);
  } else {
    console.log('\n❌ Gemini API key appears to be invalid or has no access');
  }
});