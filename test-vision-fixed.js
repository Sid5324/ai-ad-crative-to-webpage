// Test vision analysis with correct Gemini model
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

const API_KEY = 'AIzaSyALHmrx8ygIDqeu4qLf8WGByFKACCzn3Tk';

async function testVisionWithCorrectModel() {
  console.log('🚀 Testing Gemini vision with correct model...');

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Test text first
    console.log('📝 Testing text generation...');
    const textResult = await model.generateContent('Say hello and confirm vision works');
    console.log('✅ Text test passed:', textResult.response.text());

    // Test vision
    console.log('\n👁️ Testing vision analysis...');
    const imagePath = 'D:\\ai\\imp\\ai ad crative to webpage\\Gemini_Generated_Image_laeivilaeivilaei (1).png';
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');

    const visionResult = await model.generateContent([
      'Analyze this image for landing page content. Extract visible text, determine B2B vs B2C intent, find proof points/numbers, identify visual style. Return detailed analysis.',
      {
        inlineData: {
          mimeType: 'image/png',
          data: base64Image
        }
      }
    ]);

    const analysis = visionResult.response.text();
    console.log('✅ Vision analysis successful!');
    console.log('📊 Analysis result:');
    console.log(analysis);

    return { success: true, analysis };

  } catch (error) {
    console.error('❌ Vision test failed:', error.message);
    return { success: false, error: error.message };
  }
}

testVisionWithCorrectModel().catch(console.error);