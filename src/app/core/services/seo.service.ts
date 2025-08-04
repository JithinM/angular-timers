import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Title, Meta } from '@angular/platform-browser';

export interface SeoData {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  author?: string;
  published?: string;
  modified?: string;
  section?: string;
  tags?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class SeoService {
  private readonly siteName = 'TimerTools';
  private readonly defaultDescription = 'Free online timers and stopwatches for cooking, exercise, study sessions, and work breaks. No signup required.';
  private readonly defaultImage = '/assets/icons/icon-512x512.png';
  private readonly baseUrl = 'https://timertools.com'; // This should be updated with the actual domain

  constructor(
    private titleService: Title,
    private metaService: Meta,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  /**
   * Update SEO metadata for a page
   * @param seoData SEO data for the page
   */
  updateSeoMetadata(seoData: SeoData): void {
    // Set title
    this.titleService.setTitle(seoData.title);

    // Set meta description
    this.metaService.updateTag({
      name: 'description',
      content: seoData.description
    });

    // Set keywords if provided
    if (seoData.keywords) {
      this.metaService.updateTag({
        name: 'keywords',
        content: seoData.keywords
      });
    }

    // Set author if provided
    if (seoData.author) {
      this.metaService.updateTag({
        name: 'author',
        content: seoData.author
      });
    }

    // Set Open Graph tags
    this.setOpenGraphTags(seoData);

    // Set Twitter Card tags
    this.setTwitterCardTags(seoData);

    // Set structured data (JSON-LD)
    this.setStructuredData(seoData);
  }

  /**
   * Set Open Graph tags for social media sharing
   * @param seoData SEO data for the page
   */
  private setOpenGraphTags(seoData: SeoData): void {
    // Basic Open Graph tags
    this.metaService.updateTag({
      property: 'og:title',
      content: seoData.title
    });

    this.metaService.updateTag({
      property: 'og:description',
      content: seoData.description
    });

    this.metaService.updateTag({
      property: 'og:type',
      content: seoData.type || 'website'
    });

    this.metaService.updateTag({
      property: 'og:url',
      content: seoData.url || this.baseUrl
    });

    this.metaService.updateTag({
      property: 'og:site_name',
      content: this.siteName
    });

    // Image
    const imageUrl = seoData.image || this.defaultImage;
    this.metaService.updateTag({
      property: 'og:image',
      content: imageUrl.startsWith('http') ? imageUrl : `${this.baseUrl}${imageUrl}`
    });

    // Article-specific tags if applicable
    if (seoData.published) {
      this.metaService.updateTag({
        property: 'article:published_time',
        content: seoData.published
      });
    }

    if (seoData.modified) {
      this.metaService.updateTag({
        property: 'article:modified_time',
        content: seoData.modified
      });
    }

    if (seoData.section) {
      this.metaService.updateTag({
        property: 'article:section',
        content: seoData.section
      });
    }

    if (seoData.tags && seoData.tags.length > 0) {
      seoData.tags.forEach(tag => {
        this.metaService.addTag({
          property: 'article:tag',
          content: tag
        });
      });
    }
  }

  /**
   * Set Twitter Card tags for Twitter sharing
   * @param seoData SEO data for the page
   */
  private setTwitterCardTags(seoData: SeoData): void {
    // Twitter Card tags
    this.metaService.updateTag({
      name: 'twitter:card',
      content: 'summary_large_image'
    });

    this.metaService.updateTag({
      name: 'twitter:title',
      content: seoData.title
    });

    this.metaService.updateTag({
      name: 'twitter:description',
      content: seoData.description
    });

    const imageUrl = seoData.image || this.defaultImage;
    this.metaService.updateTag({
      name: 'twitter:image',
      content: imageUrl.startsWith('http') ? imageUrl : `${this.baseUrl}${imageUrl}`
    });

    this.metaService.updateTag({
      name: 'twitter:site',
      content: '@TimerTools' // This should be updated with actual Twitter handle
    });
  }

  /**
   * Set structured data (JSON-LD) for rich snippets
   * @param seoData SEO data for the page
   */
  private setStructuredData(seoData: SeoData): void {
    if (!isPlatformBrowser(this.platformId)) {
      // Only add structured data in browser environment
      return;
    }

    // Remove existing structured data
    const existingScript = document.querySelector('script[type="application/ld+json"]');
    if (existingScript) {
      existingScript.remove();
    }

    // Create structured data based on page type
    let structuredData: any = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: this.siteName,
      url: this.baseUrl,
      description: seoData.description,
      publisher: {
        '@type': 'Organization',
        name: this.siteName,
        logo: {
          '@type': 'ImageObject',
          url: `${this.baseUrl}${this.defaultImage}`
        }
      }
    };

    // If this is a specific tool page, add tool-specific structured data
    if (seoData.type === 'tool') {
      structuredData = {
        ...structuredData,
        '@type': 'SoftwareApplication',
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Web',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD'
        }
      };
    }

    // Create and append script tag
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(structuredData);
    document.head.appendChild(script);
  }

  /**
   * Set canonical URL to prevent duplicate content issues
   * @param url Canonical URL for the page
   */
  setCanonicalUrl(url: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', url);
  }

  /**
   * Remove canonical URL
   */
  removeCanonicalUrl(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (canonicalLink) {
      canonicalLink.remove();
    }
  }

  /**
   * Set robots meta tag to control indexing
   * @param content Content for robots meta tag (e.g., 'index, follow')
   */
  setRobots(content: string): void {
    this.metaService.updateTag({
      name: 'robots',
      content: content
    });
  }

  /**
   * Set viewport meta tag
   * @param content Content for viewport meta tag
   */
  setViewport(content: string): void {
    this.metaService.updateTag({
      name: 'viewport',
      content: content
    });
  }

  /**
   * Set theme color meta tag
   * @param color Color value (e.g., '#1976d2')
   */
  setThemeColor(color: string): void {
    this.metaService.updateTag({
      name: 'theme-color',
      content: color
    });
  }

  /**
   * Update SEO metadata for timer tools with dynamic titles
   * @param toolName Name of the timer tool
   * @param duration Optional duration for countdown timers
   */
  updateTimerToolSeo(toolName: string, duration?: string): void {
    let title = `${toolName} - Free Online Timer`;
    let description = `Use our free ${toolName.toLowerCase()} for your timing needs. `;

    if (duration) {
      title = `${duration} ${toolName} - Free Online Countdown`;
      description = `Free ${duration} ${toolName.toLowerCase()} for cooking, exercise, study sessions, and work breaks. No signup required.`;
    }

    this.updateSeoMetadata({
      title: title,
      description: description,
      type: 'tool',
      keywords: `${toolName.toLowerCase()}, timer, stopwatch, countdown, free, online`
    });
  }

  /**
   * Reset to default SEO metadata
   */
  resetToDefault(): void {
    this.updateSeoMetadata({
      title: `${this.siteName} - Free Online Timers & Stopwatches`,
      description: this.defaultDescription,
      keywords: 'timer, stopwatch, countdown, free, online, cooking, exercise, study, work'
    });
  }
}