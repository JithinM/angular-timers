const fs = require('fs');
const path = require('path');

// Configuration
const baseUrl = 'https://www.timersandtools.com'; // Replace with your actual domain
const routes = [
  // Main pages
  { path: '', priority: 1.0, changefreq: 'weekly' },
  
  // Timer components
  { path: '/stopwatch', priority: 0.9, changefreq: 'monthly' },
  { path: '/stopwatch/fullscreen', priority: 0.8, changefreq: 'monthly' },
  { path: '/timer', priority: 0.9, changefreq: 'monthly' },
  { path: '/timer/interval', priority: 0.8, changefreq: 'monthly' },
  { path: '/timer/pomodoro', priority: 0.9, changefreq: 'monthly' },
  { path: '/timer/meditation', priority: 0.8, changefreq: 'monthly' },
  
  // Clock components
  { path: '/clock', priority: 0.8, changefreq: 'monthly' },
  { path: '/clock/alarm', priority: 0.8, changefreq: 'monthly' },
  { path: '/clock/conversion', priority: 0.7, changefreq: 'monthly' },
  { path: '/clock/days-between', priority: 0.7, changefreq: 'monthly' },
  
  // Fun timers
  { path: '/fun/egg-timer', priority: 0.6, changefreq: 'monthly' },
  { path: '/fun/bomb-timer', priority: 0.6, changefreq: 'monthly' },
  { path: '/fun/classroom/basketball', priority: 0.6, changefreq: 'monthly' },
  { path: '/fun/classroom/hockey', priority: 0.6, changefreq: 'monthly' },
  { path: '/fun/classroom/presentation', priority: 0.6, changefreq: 'monthly' },
  
  // Utility pages
  { path: '/settings', priority: 0.5, changefreq: 'yearly' },
  { path: '/stats', priority: 0.5, changefreq: 'monthly' },
  { path: '/achievements', priority: 0.5, changefreq: 'monthly' },
  { path: '/about', priority: 0.4, changefreq: 'yearly' }
];

function generateSitemapXML() {
  const currentDate = new Date().toISOString().split('T')[0];
  
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  routes.forEach(route => {
    xml += '  <url>\n';
    xml += `    <loc>${baseUrl}${route.path}</loc>\n`;
    xml += `    <lastmod>${currentDate}</lastmod>\n`;
    xml += `    <changefreq>${route.changefreq}</changefreq>\n`;
    xml += `    <priority>${route.priority}</priority>\n`;
    xml += '  </url>\n';
  });
  
  xml += '</urlset>';
  
  return xml;
}

function generateRobotsTxt() {
  return `User-agent: *
Allow: /

# Disallow admin and API routes
Disallow: /api/
Disallow: /admin/

# Sitemap location
Sitemap: ${baseUrl}/sitemap.xml
`;
}

async function generateFiles() {
  try {
    console.log('Generating sitemap and robots.txt...');
    
    // Create output directories if they don't exist
    const distDir = path.join(__dirname, '../dist/angular-timers');
    const assetsDir = path.join(__dirname, '../src/assets');
    
    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir, { recursive: true });
    }
    
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
    }
    
    // Generate sitemap XML
    const sitemapXML = generateSitemapXML();
    const robotsTxt = generateRobotsTxt();
    
    // Write sitemap to dist folder
    const distSitemapPath = path.join(distDir, 'sitemap.xml');
    fs.writeFileSync(distSitemapPath, sitemapXML);
    console.log(`Sitemap generated at: ${distSitemapPath}`);
    
    // Write robots.txt to dist folder
    const distRobotsPath = path.join(distDir, 'robots.txt');
    fs.writeFileSync(distRobotsPath, robotsTxt);
    console.log(`Robots.txt generated at: ${distRobotsPath}`);
    
    // Also copy to src/assets for development
    const assetsSitemapPath = path.join(assetsDir, 'sitemap.xml');
    fs.writeFileSync(assetsSitemapPath, sitemapXML);
    console.log(`Sitemap copied to: ${assetsSitemapPath}`);
    
    const assetsRobotsPath = path.join(assetsDir, 'robots.txt');
    fs.writeFileSync(assetsRobotsPath, robotsTxt);
    console.log(`Robots.txt copied to: ${assetsRobotsPath}`);
    
    console.log('\n✅ Sitemap and robots.txt generated successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Replace "https://www.timersandtools.com" with your actual domain in this script');
    console.log('2. Run "npm run build" to include these files in your production build');
    console.log('3. Submit the sitemap to Google Search Console');
    
  } catch (error) {
    console.error('Error generating files:', error);
    process.exit(1);
  }
}

// Run the generator
generateFiles();