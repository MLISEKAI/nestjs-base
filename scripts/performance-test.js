/**
 * Performance Testing Script
 * 
 * Usage:
 *   node scripts/performance-test.js
 * 
 * Requirements:
 *   npm install -g autocannon
 */

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const BASE_URL = process.env.APP_URL || 'http://localhost:3001';
const ENDPOINTS = [
  { name: 'Health Check', path: '/api', method: 'GET' },
  { name: 'Users List', path: '/api/users', method: 'GET' },
  // Add more endpoints to test
];

const TEST_CONFIG = {
  connections: 100,  // Concurrent connections
  duration: 30,      // Test duration (seconds)
  pipelining: 1,     // Requests per connection
};

async function testEndpoint(endpoint) {
  console.log(`\n🧪 Testing: ${endpoint.name}`);
  console.log(`   URL: ${BASE_URL}${endpoint.path}`);
  console.log(`   Method: ${endpoint.method}`);
  console.log(`   Config: ${TEST_CONFIG.connections} connections, ${TEST_CONFIG.duration}s duration\n`);

  const command = `autocannon -c ${TEST_CONFIG.connections} -d ${TEST_CONFIG.duration} -m ${endpoint.method} ${BASE_URL}${endpoint.path}`;

  try {
    const { stdout, stderr } = await execPromise(command);
    console.log(stdout);
    
    // Parse results
    const latencyMatch = stdout.match(/Latency.*?Avg: ([\d.]+) ms/);
    const throughputMatch = stdout.match(/Req\/Sec.*?Avg: ([\d.]+)/);
    
    if (latencyMatch && throughputMatch) {
      const avgLatency = parseFloat(latencyMatch[1]);
      const avgThroughput = parseFloat(throughputMatch[1]);
      
      console.log(`\n📊 Summary for ${endpoint.name}:`);
      console.log(`   ⏱️  Avg Latency: ${avgLatency}ms`);
      console.log(`   🚀 Avg Throughput: ${avgThroughput} req/s`);
      
      // Check if meets target
      if (avgLatency < 500) {
        console.log(`   ✅ PASS: Latency < 500ms`);
      } else {
        console.log(`   ❌ FAIL: Latency >= 500ms`);
      }
    }
    
    if (stderr) {
      console.error('Errors:', stderr);
    }
  } catch (error) {
    console.error(`❌ Test failed for ${endpoint.name}:`, error.message);
  }
}

async function runAllTests() {
  console.log('🚀 Starting Performance Tests...');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`⚙️  Config: ${TEST_CONFIG.connections} connections, ${TEST_CONFIG.duration}s duration`);
  console.log('=' .repeat(80));

  for (const endpoint of ENDPOINTS) {
    await testEndpoint(endpoint);
    console.log('=' .repeat(80));
  }

  console.log('\n✅ All tests completed!');
}

// Check if autocannon is installed
exec('autocannon --version', (error) => {
  if (error) {
    console.error('❌ Error: autocannon is not installed');
    console.log('📦 Install it with: npm install -g autocannon');
    process.exit(1);
  }
  
  runAllTests().catch(console.error);
});
