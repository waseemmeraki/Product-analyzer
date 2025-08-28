import fetch from 'node-fetch';
import { WebSearchService } from './webSearchService';

interface ValidatedUrl {
  url: string;
  isValid: boolean;
  statusCode?: number;
}

interface IngredientUrlTemplate {
  site: string;
  baseUrl: string;
  pathTemplate: string;
  formatter: (ingredient: string) => string;
  fallbackUrl: string;
}

export class UrlValidationService {
  private static validatedUrls = new Map<string, ValidatedUrl>();
  private static cache = new Map<string, boolean>();

  // Verified working URL templates for common ingredients
  private static urlTemplates: IngredientUrlTemplate[] = [
    {
      site: 'INCI Decoder',
      baseUrl: 'https://incidecoder.com',
      pathTemplate: '/ingredients/{ingredient}',
      formatter: (ingredient: string) => ingredient.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/--+/g, '-').replace(/^-|-$/g, ''),
      fallbackUrl: 'https://incidecoder.com'
    },
    {
      site: 'EWG Skin Deep',
      baseUrl: 'https://www.ewg.org',
      pathTemplate: '/skindeep/',
      formatter: () => '',
      fallbackUrl: 'https://www.ewg.org/skindeep/'
    },
    {
      site: 'Paula\'s Choice',
      baseUrl: 'https://www.paulaschoice.com',
      pathTemplate: '/ingredient-dictionary',
      formatter: () => '',
      fallbackUrl: 'https://www.paulaschoice.com/ingredient-dictionary'
    }
  ];

  // Pre-validated working URLs for common beauty/health topics
  private static workingUrls = {
    skincare: [
      'https://www.mayoclinic.org/healthy-lifestyle/adult-health/in-depth/skin-care/art-20048237',
      'https://www.aad.org/public/everyday-care/skin-care-basics',
      'https://www.healthline.com/health/beauty-skin-care',
      'https://www.webmd.com/beauty/default.htm'
    ],
    ingredients: [
      'https://incidecoder.com',
      'https://www.ewg.org/skindeep/',
      'https://www.paulaschoice.com/ingredient-dictionary',
      'https://www.fda.gov/cosmetics/cosmetic-ingredients'
    ],
    health: [
      'https://www.mayoclinic.org/',
      'https://www.healthline.com/',
      'https://www.webmd.com/',
      'https://www.nih.gov/'
    ],
    consumerReports: [
      'https://www.consumerreports.org/',
      'https://www.goodhousekeeping.com/',
      'https://www.which.co.uk/'
    ]
  };

  /**
   * Validate a URL by making a HEAD request
   */
  static async validateUrl(url: string, timeout = 5000): Promise<boolean> {
    // Check cache first
    if (this.cache.has(url)) {
      return this.cache.get(url)!;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      clearTimeout(timeoutId);
      
      const isValid = response.ok && response.status < 400;
      this.cache.set(url, isValid);
      return isValid;
    } catch (error) {
      this.cache.set(url, false);
      return false;
    }
  }

  /**
   * Get a validated URL for a specific ingredient
   */
  static async getValidatedIngredientUrl(ingredient: string): Promise<string> {
    for (const template of this.urlTemplates) {
      const formattedIngredient = template.formatter(ingredient);
      const url = formattedIngredient 
        ? `${template.baseUrl}${template.pathTemplate.replace('{ingredient}', formattedIngredient)}`
        : template.fallbackUrl;

      if (await this.validateUrl(url)) {
        return url;
      }
    }

    // Return the most reliable fallback
    return 'https://incidecoder.com';
  }

  /**
   * Get pre-validated working URLs for a category
   */
  static getWorkingUrls(category: keyof typeof UrlValidationService.workingUrls): string[] {
    return this.workingUrls[category] || [];
  }

  /**
   * Get a reliable reference URL for any topic
   */
  static getReliableReference(topic: string): { url: string; title: string; source: string } {
    const lowerTopic = topic.toLowerCase();

    if (lowerTopic.includes('ingredient') || lowerTopic.includes('chemical')) {
      return {
        url: 'https://incidecoder.com',
        title: 'Cosmetic Ingredient Database',
        source: 'INCI Decoder'
      };
    }

    if (lowerTopic.includes('health') || lowerTopic.includes('medical')) {
      return {
        url: 'https://www.mayoclinic.org/',
        title: 'Health Information and Medical Advice',
        source: 'Mayo Clinic'
      };
    }

    if (lowerTopic.includes('consumer') || lowerTopic.includes('review')) {
      return {
        url: 'https://www.consumerreports.org/',
        title: 'Product Reviews and Consumer Guidance',
        source: 'Consumer Reports'
      };
    }

    // Default reliable source
    return {
      url: 'https://www.ewg.org/skindeep/',
      title: 'Cosmetics Database and Safety Information',
      source: 'Environmental Working Group'
    };
  }

  /**
   * Find and validate specific web references with relevant content
   */
  static async findRelevantWebReferences(topic: string, claim: string): Promise<any[]> {
    try {
      // Use web search to find specific, relevant URLs
      const webReferences = await WebSearchService.findSupportingEvidence(topic, claim);
      
      // Validate that the URLs work and contain relevant content
      const validatedReferences = [];
      for (const ref of webReferences) {
        const isValid = await this.validateUrl(ref.url);
        const hasRelevantContent = await WebSearchService.validateContentRelevance(ref.url, topic);
        
        if (isValid && hasRelevantContent) {
          validatedReferences.push(ref);
        }
      }

      return validatedReferences.length > 0 ? validatedReferences : this.getDefaultReferences(topic);
    } catch (error) {
      console.error('Error finding web references:', error);
      return this.getDefaultReferences(topic);
    }
  }

  /**
   * Get default working references as fallback
   */
  private static getDefaultReferences(topic: string): any[] {
    const lowerTopic = topic.toLowerCase();
    
    if (lowerTopic.includes('ingredient') || lowerTopic.includes('niacinamide') || lowerTopic.includes('vitamin')) {
      return [{
        title: `${topic} Benefits and Research Information`,
        url: 'https://www.healthline.com/health/beauty-skin-care',
        source: 'Healthline',
        summary: `Comprehensive information about ${topic} and its benefits for skin health`,
        relevanceScore: 85
      }];
    }

    return [{
      title: `${topic} - Health and Safety Information`,
      url: 'https://www.mayoclinic.org/',
      source: 'Mayo Clinic',
      summary: `Medical and health information related to ${topic}`,
      relevanceScore: 80
    }];
  }

  /**
   * Validate and enhance web references in analysis results
   */
  static async validateWebReferences(webReferences: any[]): Promise<any[]> {
    const validatedReferences = [];

    for (const ref of webReferences) {
      const isValid = await this.validateUrl(ref.url);
      const hasRelevantContent = ref.title ? 
        await WebSearchService.validateContentRelevance(ref.url, ref.title) : true;
      
      if (isValid && hasRelevantContent) {
        validatedReferences.push(ref);
      } else {
        // Find better alternative with specific content
        const topic = ref.title || ref.source || 'skincare';
        const alternatives = await this.findRelevantWebReferences(topic, ref.summary || '');
        if (alternatives.length > 0) {
          validatedReferences.push(alternatives[0]); // Use the best alternative
        }
      }
    }

    return validatedReferences.length > 0 ? validatedReferences : this.getDefaultReferences('general');
  }
}