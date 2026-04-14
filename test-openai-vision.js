// Test OpenAI GPT-4o vision as alternative to Gemini
import OpenAI from 'openai';
import fs from 'fs';

const API_KEY = process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY;
if (!API_KEY) {
  console.error('❌ No OpenAI API key found');
  process.exit(1);
}

const client = new OpenAI({
  apiKey: API_KEY,
  baseURL: process.env.OPENAI_API_KEY ? undefined : 'https://api.groq.com/openai/v1'
});

async function testOpenAIVision() {
  console.log('🚀 Testing OpenAI GPT-4o vision...');

  try {
    const imagePath = 'D:\\ai\\imp\\ai ad crative to webpage\\Gemini_Generated_Image_laeivilaeivilaei (1).png';
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');

    const response = await client.chat.completions.create({
      model: 'gpt-4o', // or 'llama-3.2-90b-text-preview' for Groq
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analyze this image for landing page content. Extract all visible text, determine if it\'s B2B (business/merchant focus) or B2C (consumer focus), find proof points like numbers/stats, and identify visual style. Return JSON format.'
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 1000
    });

    const analysis = response.choices[0].message.content;
    console.log('✅ OpenAI Vision Analysis Success!');
    console.log('📝 Analysis:', analysis);

    // Try to parse as JSON
    try {
      const parsed = JSON.parse(analysis);
      console.log('✅ Valid JSON response');
      return { works: true, analysis: parsed };
    } catch (e) {
      console.log('⚠️ Text response (not JSON)');
      return { works: true, analysis };
    }

  } catch (error) {
    console.log(`❌ OpenAI Vision Failed: ${error.message}`);
    return { works: false, error: error.message };
  }
}

testOpenAIVision().catch(console.error);