// Check current time and quota status
const key = 'AIzaSyCnRgvkr5MSmNaLRY9PueDs5j8AZoangGU';

console.log('Current time analysis:');
console.log('=======================');

const now = new Date();
console.log(`Local time (IST): ${now.toISOString()}`);
console.log(`UTC time: ${now.toISOString()}`);

// Current time in different timezones
const utcDate = new Date(now.toISOString());
console.log(`\nCurrent UTC: ${utcDate.toISOString()}`);
console.log(`Current IST: ${now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })}`);

// Next midnight UTC (quota reset time)
const nextMidnightUTC = new Date(utcDate);
nextMidnightUTC.setUTCHours(24, 0, 0, 0);

console.log(`\nNext quota reset (midnight UTC): ${nextMidnightUTC.toISOString()}`);
console.log(`Next quota reset (IST): ${nextMidnightUTC.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })}`);

// Time remaining
const timeRemaining = nextMidnightUTC - now;
const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));

console.log(`\nTime until quota reset: ${hours} hours ${minutes} minutes`);

// Test if quota has reset by trying gemini-2.0-flash
console.log('\n' + '='.repeat(50));
console.log('Testing if gemini-2.0-flash quota has reset...');
console.log('='.repeat(50));

const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testQuotaReset() {
  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const result = await model.generateContent('Say "OK" if you work.');
    const response = await result.response;
    const text = response.text();

    console.log(`✅ gemini-2.0-flash QUOTA HAS RESET! Response: "${text}"`);
    return true;
  } catch (error) {
    if (error.message.includes('429') || error.message.includes('quota')) {
      console.log(`❌ gemini-2.0-flash still has quota exceeded`);

      // Try the working model
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
      const result = await model.generateContent('Say "OK".');
      const response = await result.response;
      console.log(`✅ gemini-2.5-flash-lite works: "${response.text()}"`);

      return false;
    }
    throw error;
  }
}

testQuotaReset().catch(console.error);