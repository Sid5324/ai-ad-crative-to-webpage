// test-ai-apis.js - Quick test for AI API connectivity
require('dotenv').config({ path: '.env.local' });

async function testAIAPIs() {
  console.log('🧪 Testing AI API Connectivity...\n');

  // Test GROQ API
  if (process.env.GROQ_API_KEY) {
    try {
      const Groq = require('groq-sdk');
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

      console.log('🔄 Testing GROQ API...');
      const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: 'Say "GROQ API is working!" in exactly those words.' }],
        model: 'mixtral-8x7b-32768',
        max_tokens: 20
      });

      console.log('✅ GROQ API:', completion.choices[0]?.message?.content?.trim());
    } catch (error) {
      console.log('❌ GROQ API Error:', error.message);
    }
  } else {
    console.log('⚠️  GROQ_API_KEY not configured');
  }

  console.log('');

  // Test Google AI API
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    try {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const googleAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY);

      console.log('🔄 Testing Google AI API...');
      const model = googleAI.getGenerativeModel({ model: 'gemini-pro' });
      const result = await model.generateContent('Say "Google AI is working!" in exactly those words.');
      const response = await result.response;

      console.log('✅ Google AI:', response.text().trim());
    } catch (error) {
      console.log('❌ Google AI Error:', error.message);
    }
  } else {
    console.log('⚠️  GOOGLE_GENERATIVE_AI_API_KEY not configured');
  }

  console.log('\n🎯 AI API Test Complete!');
  console.log('If APIs are working, your system is ready for production deployment.');
}

testAIAPIs();