// Test quota limits for Key 2
const key = 'AIzaSyCnRgvkr5MSmNaLRY9PueDs5j8AZoangGU';

const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testQuota(key, modelName, numTests) {
  console.log(`\nTesting ${modelName} - ${numTests} requests:`);
  console.log('─'.repeat(40));

  let success = 0;
  let failed = 0;
  let errors = [];

  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({ model: modelName });

  for (let i = 1; i <= numTests; i++) {
    try {
      const result = await model.generateContent('Say "' + i + '" in 1 word.');
      const text = result.response.text();
      console.log(`  Request ${i}: ✅ "${text.trim()}"`);
      success++;
    } catch (error) {
      if (error.message.includes('429') || error.message.includes('quota')) {
        console.log(`  Request ${i}: ❌ QUOTA EXCEEDED`);
        failed++;
        errors.push('Quota exceeded at request ' + i);
        break;
      } else {
        console.log(`  Request ${i}: ❌ ${error.message.substring(0, 30)}`);
        failed++;
        errors.push(error.message.substring(0, 50));
      }
    }

    // Small delay between requests
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\n📊 Results: ${success} succeeded, ${failed} failed`);

  return { success, failed, errors };
}

async function main() {
  console.log('🔍 Testing QUOTA for Key 2: AIzaSyCnRgvkr5MSmNaLRY9PueDs5j8AZoangGU');
  console.log('⏰ Time: ' + new Date().toISOString());
  console.log('='.repeat(50));

  // Test gemini-2.5-flash-lite (the working vision model)
  console.log('\n🟢 MODEL: gemini-2.5-flash-lite');
  const liteResults = await testQuota(key, 'gemini-2.5-flash-lite', 10);

  // Test gemini-2.5-flash
  console.log('\n🔵 MODEL: gemini-2.5-flash');
  const flashResults = await testQuota(key, 'gemini-2.5-flash', 5);

  // Test gemini-flash-latest
  console.log('\n🟡 MODEL: gemini-flash-latest');
  const latestResults = await testQuota(key, 'gemini-flash-latest', 5);

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 QUOTA SUMMARY FOR KEY 2');
  console.log('='.repeat(50));

  console.log(`
gemini-2.5-flash-lite: ~${liteResults.success} requests available
gemini-2.5-flash:      ~${flashResults.success} requests available  
gemini-flash-latest:   ~${latestResults.success} requests available

gemini-2.0-flash:      ❌ QUOTA EXCEEDED (0 available)
gemini-2.0-flash-lite: ❌ QUOTA EXCEEDED (0 available)
  `);

  // Calculate total
  const totalAvailable = liteResults.success + flashResults.success + latestResults.success;
  console.log(`💡 Total requests available (approx): ${totalAvailable}`);

  if (liteResults.success >= 5) {
    console.log(`\n✅ Key 2 is SUFFICIENT for vision/image analysis`);
    console.log(`   Recommended model: gemini-2.5-flash-lite`);
  } else {
    console.log(`\n⚠️ Key 2 has LIMITED quota - may run out soon`);
    console.log(`   Consider using Key 3 for production`);
  }
}

main().catch(console.error);