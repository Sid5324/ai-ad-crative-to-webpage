// Exact quota reset time calculator
const now = new Date();

console.log('='.repeat(60));
console.log('⏰ EXACT QUOTA RESET TIME CALCULATOR');
console.log('='.repeat(60));

// Current time
console.log(`\nCurrent Time (IST): ${now.toISOString()}`);
console.log(`Current Time (UTC): ${now.toISOString()}`);

// Google Gemini free tier resets at MIDNIGHT UTC each day
// Next midnight UTC
const nextMidnightUTC = new Date(now);
nextMidnightUTC.setUTCHours(24, 0, 0, 0);

console.log(`\n📅 Next Quota Reset:`);
console.log(`   UTC:   ${nextMidnightUTC.toISOString()}`);
console.log(`   IST:   ${nextMidnightUTC.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })}`);

// Time remaining
const msRemaining = nextMidnightUTC - now;
const hoursRemaining = Math.floor(msRemaining / (1000 * 60 * 60));
const minutesRemaining = Math.floor((msRemaining % (1000 * 60 * 60)) / (1000 * 60));
const secondsRemaining = Math.floor((msRemaining % (1000 * 60)) / 1000);

console.log(`\n⏳ Time Until Reset:`);
console.log(`   ${hoursRemaining} hours, ${minutesRemaining} minutes, ${secondsRemaining} seconds`);

// Alternative time zones
console.log(`\n🌍 Reset Time in Other Zones:`);
console.log(`   PST: ${nextMidnightUTC.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })}`);
console.log(`   EST: ${nextMidnightUTC.toLocaleString('en-US', { timeZone: 'America/New_York' })}`);
console.log(`   GMT: ${nextMidnightUTC.toLocaleString('en-US', { timeZone: 'Europe/London' })}`);

// Test if quota has reset now
console.log('\n' + '='.repeat(60));
console.log('🧪 Testing if quota has reset...');
console.log('='.repeat(60));

const { GoogleGenerativeAI } = require('@google/generative-ai');
const key = 'AIzaSyCnRgvkr5MSmNaLRY9PueDs5j8AZoangGU';

async function testQuotaReset() {
  // Test gemini-2.0-flash
  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent('Say "RESET" in 1 word.');
    console.log(`✅ gemini-2.0-flash: QUOTA RESET! Response: "${result.response.text()}"`);
  } catch (error) {
    if (error.message.includes('429') || error.message.includes('quota')) {
      console.log(`❌ gemini-2.0-flash: Still quota exceeded`);
    } else {
      console.log(`❌ gemini-2.0-flash: ${error.message.substring(0, 50)}`);
    }
  }

  // Test gemini-2.0-flash-lite
  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
    const result = await model.generateContent('Say "RESET" in 1 word.');
    console.log(`✅ gemini-2.0-flash-lite: QUOTA RESET! Response: "${result.response.text()}"`);
  } catch (error) {
    if (error.message.includes('429') || error.message.includes('quota')) {
      console.log(`❌ gemini-2.0-flash-lite: Still quota exceeded`);
    } else {
      console.log(`❌ gemini-2.0-flash-lite: ${error.message.substring(0, 50)}`);
    }
  }
}

testQuotaReset().catch(console.error);