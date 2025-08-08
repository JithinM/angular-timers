const fs = require('fs');
const path = require('path');

/**
 * Auto-increment version in package.json
 * Supports semantic versioning (major.minor.patch)
 * Default increment type is 'patch'
 */
function incrementVersion(incrementType = 'patch') {
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  
  try {
    // Read current package.json
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const currentVersion = packageJson.version || '0.0.0';
    
    // Parse version parts
    const versionParts = currentVersion.split('.').map(part => parseInt(part, 10));
    let [major, minor, patch] = versionParts;
    
    // Ensure we have valid numbers
    major = isNaN(major) ? 0 : major;
    minor = isNaN(minor) ? 0 : minor;
    patch = isNaN(patch) ? 0 : patch;
    
    // Increment based on type
    switch (incrementType.toLowerCase()) {
      case 'major':
        major += 1;
        minor = 0;
        patch = 0;
        break;
      case 'minor':
        minor += 1;
        patch = 0;
        break;
      case 'patch':
      default:
        patch += 1;
        break;
    }
    
    // Create new version string
    const newVersion = `${major}.${minor}.${patch}`;
    
    // Update package.json
    packageJson.version = newVersion;
    
    // Write back to file with proper formatting
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
    
    console.log(`Version incremented from ${currentVersion} to ${newVersion} (${incrementType})`);
    
    return {
      oldVersion: currentVersion,
      newVersion: newVersion,
      incrementType: incrementType
    };
    
  } catch (error) {
    console.error('Error incrementing version:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  // Get increment type from command line argument
  const incrementType = process.argv[2] || 'patch';
  incrementVersion(incrementType);
}

module.exports = incrementVersion;