const fs = require('fs');
const path = require('path');

// Generate build info with timestamp and incremental build number
function generateBuildInfo() {
  const buildInfoPath = path.join(__dirname, '..', 'src', 'assets', 'build-info.json');
  const buildInfoDir = path.dirname(buildInfoPath);
  
  // Ensure the directory exists
  if (!fs.existsSync(buildInfoDir)) {
    fs.mkdirSync(buildInfoDir, { recursive: true });
  }
  
  let buildNumber = 1;
  let existingBuildInfo = {};
  
  // Read existing build info if it exists
  if (fs.existsSync(buildInfoPath)) {
    try {
      const existingData = fs.readFileSync(buildInfoPath, 'utf8');
      existingBuildInfo = JSON.parse(existingData);
      buildNumber = (existingBuildInfo.buildNumber || 0) + 1;
    } catch (error) {
      console.warn('Could not read existing build info, starting from build 1');
    }
  }
  
  const buildInfo = {
    buildNumber: buildNumber,
    buildDate: new Date().toISOString(),
    version: require('../package.json').version || '0.0.0'
  };
  
  // Write build info to file
  fs.writeFileSync(buildInfoPath, JSON.stringify(buildInfo, null, 2));
  
  console.log(`Generated build info: Build #${buildNumber} at ${buildInfo.buildDate}`);
  
  return buildInfo;
}

// Run if called directly
if (require.main === module) {
  generateBuildInfo();
}

module.exports = generateBuildInfo;