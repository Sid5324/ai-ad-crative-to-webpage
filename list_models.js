const { GoogleGenerativeAI } = require('@google/generative-ai');

// Test listing available models for the key
const key = 'AIzaSyCnRgvkr5MSmNaLRY9PueDs5j8AZoangGU';

async function listAvailableModels() {
  try {
    console.log('🔍 Checking available models for API key: AIzaSyCnRgvkr5MSmNaLRY9PueDs5j8AZoangGU');
    console.log('⏰ Current time:', new Date().toISOString());
    console.log('=' .repeat(60));

    const genAI = new GoogleGenerativeAI(key);

    // List available models
    console.log('📋 Listing available models...');
    const models = await genAI.listModels();
    console.log(`✅ Found ${models.models.length} available models:`);

    models.models.forEach((model, index) => {
      console.log(`${index + 1}. ${model.name}`);
      console.log(`   Display Name: ${model.displayName}`);
      console.log(`   Description: ${model.description}`);
      console.log(`   Supported Methods: ${model.supportedGenerationMethods?.join(', ')}`);
      console.log('');
    });

    // Check if any vision-capable models are available
    const visionModels = models.models.filter(model =>
      model.supportedGenerationMethods?.includes('generateContent') &&
      (model.name.includes('vision') || model.description?.toLowerCase().includes('vision'))
    );

    console.log('👁️  Vision-capable models:');
    if (visionModels.length > 0) {
      visionModels.forEach(model => {
        console.log(`   - ${model.name}: ${model.displayName}`);
      });
    } else {
      console.log('   None found');
    }

  } catch (error) {
    console.log(`❌ FAILED to list models: ${error.message}`);
  }
}

listAvailableModels();