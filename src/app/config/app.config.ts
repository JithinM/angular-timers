// Hardcoded configuration file for application settings
export const AppConfig = {
  // Ads configuration
  ads: {
    // Set to true to disable all ads across the application
    disabled: true,
    
    // Default ad unit IDs (these would be replaced with real IDs in production)
    adUnitIds: {
      banner: 'ca-pub-xxxxxxxxxxxxxxxx/banner',
      rectangle: 'ca-pub-xxxxxxxxxxxxxxxx/rectangle',
      leaderboard: 'ca-pub-xxxxxxxxxxxxxxxx/leaderboard',
      skyscraper: 'ca-pub-xxxxxxxxxxxxxxxx/skyscraper',
      mobileBanner: 'ca-pub-xxxxxxxxxxxxxxxx/mobile-banner'
    }
  },
  
  // Other application configurations can be added here
  features: {
    analytics: true,
    notifications: true,
    pwa: true
  }
};