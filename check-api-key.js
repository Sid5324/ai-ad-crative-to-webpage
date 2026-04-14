// Check what's wrong with the Google API key
const API_KEY = 'AIzaSyALHmrx8ygIDqeu4qLf8WGByFKACCzn3Tk';

async function checkAPIKey() {
  console.log('🔍 Checking Google API Key:', API_KEY);
  console.log('📝 Key format analysis:');
  console.log('  - Starts with AIzaSy:', API_KEY.startsWith('AIzaSy'));
  console.log('  - Length:', API_KEY.length, '(should be 39)');
  console.log('  - Contains only valid chars:', /^[A-Za-z0-9_-]+$/.test(API_KEY));

  // Test 1: Try to get available models (this should work if key is valid)
  console.log('\n🧪 Test 1: Checking available models...');
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
    const data = await response.json();

    if (response.ok) {
      console.log('✅ API key is valid!');
      console.log('📋 Available models:', data.models?.map(m => m.name).slice(0, 5) || 'None listed');

      // Check if Gemini models are available
      const geminiModels = data.models?.filter(m => m.name.includes('gemini')) || [];
      console.log('🤖 Gemini models found:', geminiModels.length);

      if (geminiModels.length === 0) {
        console.log('❌ No Gemini models available - API key lacks Gemini access');
      } else {
        console.log('✅ Gemini models available:', geminiModels.map(m => m.name));
      }
    } else {
      console.log('❌ API key validation failed:');
      console.log('  Status:', response.status);
      console.log('  Error:', data.error?.message || 'Unknown error');
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }

  // Test 2: Try a simple text generation (if models are available)
  console.log('\n🧪 Test 2: Testing basic text generation...');
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: 'Say hello'
          }]
        }]
      })
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Text generation works!');
      console.log('📝 Response:', data.candidates?.[0]?.content?.parts?.[0]?.text || 'No text');
    } else {
      console.log('❌ Text generation failed:');
      console.log('  Status:', response.status);
      console.log('  Error:', data.error?.message || 'Unknown error');

      if (data.error?.message?.includes('not found')) {
        console.log('🔍 DIAGNOSIS: API key does not have access to Gemini models');
        console.log('💡 SOLUTION: Get a Gemini API key from Google AI Studio');
      }
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }

  // Test 3: Check if it's a Google Maps API key (common mistake)
  console.log('\n🧪 Test 3: Checking if it might be Google Maps API key...');
  try {
    const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=New+York&key=${API_KEY}`);
    const data = await response.json();

    if (response.ok && !data.error_message) {
      console.log('🗺️ This appears to be a Google Maps API key!');
      console.log('❌ It will NOT work for Gemini AI');
      console.log('💡 SOLUTION: Get separate API key for Gemini from https://makersuite.google.com/app/apikey');
    } else {
      console.log('✅ Not a Maps API key (good)');
    }
  } catch (error) {
    console.log('⚠️ Could not test Maps API');
  }
}

checkAPIKey().catch(console.error);