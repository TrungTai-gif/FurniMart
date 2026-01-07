// Script to find your computer's IP address
const os = require('os');
const networkInterfaces = os.networkInterfaces();

console.log('\n🔍 Finding your IP address...\n');

let found = false;

for (const interfaceName in networkInterfaces) {
  const addresses = networkInterfaces[interfaceName];
  for (const address of addresses) {
    // Skip internal (i.e. 127.0.0.1) and non-IPv4 addresses
    if (address.family === 'IPv4' && !address.internal) {
      console.log(`✅ Use this IP: ${address.address}`);
      console.log(`   Update mobile/src/config/api.ts:`);
      console.log(`   const API_URL = __DEV__ ? 'http://${address.address}:3001/api' : '...';\n`);
      found = true;
      break;
    }
  }
  if (found) break;
}

if (!found) {
  console.log('❌ Could not find IP address. Please check manually with:');
  console.log('   Windows: ipconfig');
  console.log('   Mac/Linux: ifconfig\n');
}

