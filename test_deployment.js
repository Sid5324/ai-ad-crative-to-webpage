import fetch from 'node-fetch'

async function testDeployment() {
  const baseUrl = 'https://skill-deploy-6pqwko6ryc-agent-skill-vercel.vercel.app'

  try {
    console.log('Testing deployment...')

    // Test main page
    const mainPageResponse = await fetch(baseUrl)
    console.log(`Main page: ${mainPageResponse.status} ${mainPageResponse.statusText}`)

    // Test API endpoint
    const apiResponse = await fetch(`${baseUrl}/api/version`)
    console.log(`API endpoint: ${apiResponse.status} ${apiResponse.statusText}`)

    if (apiResponse.ok) {
      const data = await apiResponse.json()
      console.log('Version info:', data)
      console.log('✅ Updates are deployed!')
    } else {
      console.log('❌ API endpoint not working')
    }

  } catch (error) {
    console.error('Test failed:', error.message)
  }
}

testDeployment()