// Test listing available models using REST API
const key = 'AIzaSyCnRgvkr5MSmNaLRY9PueDs5j8AZoangGU';

async function listModelsREST() {
  try {
    console.log('🔍 Checking available models for API key: AIzaSyCnRgvkr5MSmNaLRY9PueDs5j8AZoangGU');
    console.log('⏰ Current time:', new Date().toISOString());
    console.log('=' .repeat(60));

    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

    console.log('📋 Fetching model list from Google AI API...');
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    console.log(`✅ Found ${data.models?.length || 0} available models:`);

    if (data.models && data.models.length > 0) {
      data.models.forEach((model, index) => {
        console.log(`${index + 1}. ${model.name}`);
        console.log(`   Display Name: ${model.displayName || 'N/A'}`);
        console.log(`   Description: ${model.description || 'N/A'}`);
        console.log(`   Supported Methods: ${model.supportedGenerationMethods?.join(', ') || 'N/A'}`);
        console.log('');
      });

      // Check for vision models
      const visionModels = data.models.filter(model =>
        model.supportedGenerationMethods?.includes('generateContent') &&
        (model.name.includes('vision') || model.description?.toLowerCase().includes('vision') ||
         model.name.includes('2.0') || model.name.includes('1.5'))
      );

      console.log('👁️  Potential vision/text models:');
      if (visionModels.length > 0) {
        visionModels.forEach(model => {
          console.log(`   - ${model.name}: ${model.displayName || 'N/A'}`);
        });
      } else {
        console.log('   None found');
      }
    } else {
      console.log('❌ No models returned');
    }

  } catch (error) {
    console.log(`❌ FAILED to list models: ${error.message}`);
    console.log('💡 This could mean:');
    console.log('   - API key is invalid or expired');
    console.log('   - API key has no permissions');
    console.log('   - Network/connectivity issues');
  }
}

listModelsREST();