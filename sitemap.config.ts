import { NgxSitemapConfig } from 'ngx-sitemap';

export const sitemapConfig: NgxSitemapConfig = {
  baseUrl: 'https://www.timersandtools.com', // Replace with your actual domain
  routes: [
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
  ],
  generateRobotsTxt: true,
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/']
      }
    ],
    sitemap: 'https://www.timersandtools.com/sitemap.xml' // Replace with your actual domain
  }
};