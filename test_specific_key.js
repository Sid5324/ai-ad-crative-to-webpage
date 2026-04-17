const { GoogleGenerativeAI } = require('@google/generative-ai');

// Test the specific key with different models
const key = 'AIzaSyCnRgvkr5MSmNaLRY9PueDs5j8AZoangGU';

// Models to test, including vision-capable ones
const models = [
  'gemini-2.0-flash-exp',
  'gemini-1.5-pro',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
  'gemini-pro',
  'gemini-pro-vision'
];

async function testModel(key, modelName) {
  try {
    console.log(`\n🧪 Testing model: ${modelName}`);
    console.log(`   Key: ${key.substring(0, 10)}...`);

    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: modelName });

    // Simple test prompt
    const result = await model.generateContent('Say "Hello World" in exactly 2 words.');
    const response = await result.response;
    const text = response.text();

    if (text && text.trim()) {
      console.log(`   ✅ SUCCESS: "${text.trim()}"`);
      return { success: true, response: text.trim(), model: modelName };
    } else {
      console.log(`   ❌ FAILED: Empty response`);
      return { success: false, error: 'Empty response', model: modelName };
    }
  } catch (error) {
    console.log(`   ❌ FAILED: ${error.message}`);
    return { success: false, error: error.message, model: modelName };
  }
}

async function testVisionModel(key, modelName) {
  try {
    console.log(`\n👁️  Testing VISION model: ${modelName}`);
    console.log(`   Key: ${key.substring(0, 10)}...`);

    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: modelName });

    // Create a simple 1x1 transparent PNG for testing
    const testImageData = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    const imagePart = {
      inlineData: {
        data: testImageData,
        mimeType: "image/png"
      }
    };

    // Vision test prompt
    const result = await model.generateContent([
      "What do you see in this image? Describe it in one sentence.",
      imagePart
    ]);
    const response = await result.response;
    const text = response.text();

    if (text && text.trim()) {
      console.log(`   ✅ VISION SUCCESS: "${text.trim()}"`);
      return { success: true, response: text.trim(), model: modelName, type: 'vision' };
    } else {
      console.log(`   ❌ VISION FAILED: Empty response`);
      return { success: false, error: 'Empty response', model: modelName, type: 'vision' };
    }
  } catch (error) {
    console.log(`   ❌ VISION FAILED: ${error.message}`);
    return { success: false, error: error.message, model: modelName, type: 'vision' };
  }
}

async function testAllModels() {
  console.log('🔍 Testing API key: AIzaSyCnRgvkr5MSmNaLRY9PueDs5j8AZoangGU');
  console.log('⏰ Current time:', new Date().toISOString());
  console.log('=' .repeat(60));

  const results = [];

  // Test text-only models first
  for (const modelName of models) {
    const result = await testModel(key, modelName);
    results.push(result);

    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n' + '=' .repeat(60));
  console.log('👁️  TESTING VISION MODELS');
  console.log('=' .repeat(60));

  // Test vision specifically on vision-capable models
  const visionModels = ['gemini-2.0-flash-exp', 'gemini-1.5-pro', 'gemini-1.5-flash'];
  for (const modelName of visionModels) {
    const result = await testVisionModel(key, modelName);
    results.push(result);

    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n' + '=' .repeat(60));
  console.log('📊 SUMMARY');
  console.log('=' .repeat(60));

  const workingModels = results.filter(r => r.success);
  const failedModels = results.filter(r => !r.success);

  console.log(`✅ Working models: ${workingModels.length}`);
  workingModels.forEach(r => {
    console.log(`   - ${r.model}${r.type ? ` (${r.type})` : ''}: ${r.response}`);
  });

  console.log(`❌ Failed models: ${failedModels.length}`);
  failedModels.forEach(r => {
    console.log(`   - ${r.model}${r.type ? ` (${r.type})` : ''}: ${r.error}`);
  });

  if (workingModels.length > 0) {
    console.log('\n🎉 CONCLUSION: This API key IS working!');
    console.log('💡 You can use this key for both text and vision tasks.');
  } else {
    console.log('\n❌ CONCLUSION: This API key is NOT working (quota exceeded or invalid).');
  }

  return results;
}

testAllModels().catch(console.error);