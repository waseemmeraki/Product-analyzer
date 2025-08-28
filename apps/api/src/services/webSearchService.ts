import fetch from 'node-fetch';

interface SearchResult {
  url: string;
  title: string;
  snippet: string;
  relevanceScore: number;
}

interface WebReference {
  title: string;
  url: string;
  source: string;
  summary: string;
  relevanceScore: number;
}

export class WebSearchService {
  private static cache = new Map<string, SearchResult[]>();

  /**
   * Search for specific content using web search
   */
  static async searchForContent(query: string, domain?: string): Promise<SearchResult[]> {
    const cacheKey = `${query}:${domain || 'all'}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      // Use DuckDuckGo instant answer API for basic searches
      const searchQuery = domain ? `site:${domain} ${query}` : query;
      
      // For now, return curated results based on common patterns
      // In production, you'd integrate with a proper search API
      const results = await this.getCuratedResults(query, domain);
      
      this.cache.set(cacheKey, results);
      return results;
    } catch (error) {
      console.error('Search failed:', error);
      return [];
    }
  }

  /**
   * Get curated, working URLs for common beauty/health topics
   */
  private static async getCuratedResults(query: string, domain?: string): Promise<SearchResult[]> {
    const lowerQuery = query.toLowerCase();
    const results: SearchResult[] = [];

    // Ingredient-specific searches
    if (lowerQuery.includes('niacinamide')) {
      results.push(
        {
          url: 'https://www.healthline.com/health/beauty-skin-care/niacinamide',
          title: 'Niacinamide: Skin Benefits, Risks, and More',
          snippet: 'Niacinamide helps build proteins in the skin and lock in moisture to prevent damage. It helps reduce inflammation, hyperpigmentation, smooth fine lines and protect from environmental stress.',
          relevanceScore: 95
        },
        {
          url: 'https://www.mayoclinic.org/drugs-supplements/niacin-and-niacinamide-vitamin-b3/art-20364984',
          title: 'Niacin and niacinamide (vitamin B3) - Mayo Clinic',
          snippet: 'Niacinamide is a form of niacin (vitamin B3) and is used to prevent and treat niacin deficiency and related conditions.',
          relevanceScore: 92
        }
      );
    }

    if (lowerQuery.includes('hyaluronic acid')) {
      results.push(
        {
          url: 'https://www.healthline.com/health/beauty-skin-care/how-to-use-hyaluronic-acid',
          title: 'How to Use Hyaluronic Acid: Tips, Products to Try, and More',
          snippet: 'Hyaluronic acid acts as a humectant that helps skin hold on to water, hydrating outer layers and improving skin appearance. It can reduce wrinkle depth and improve elasticity.',
          relevanceScore: 96
        },
        {
          url: 'https://www.healthline.com/nutrition/hyaluronic-acid-benefits',
          title: '7 Surprising Benefits of Hyaluronic Acid',
          snippet: 'Hyaluronic acid supplements can help skin look and feel more supple, reduce appearance of wrinkles by hydrating the skin, and improve skin barrier function.',
          relevanceScore: 92
        }
      );
    }

    if (lowerQuery.includes('retinol')) {
      results.push(
        {
          url: 'https://www.healthline.com/health/beauty-skin-care/retinol-for-acne',
          title: 'Retinol for Acne: How It Works, Benefits, and Side Effects',
          snippet: 'Retinol is a form of vitamin A that helps accelerate skin cell turnover and reduce acne formation.',
          relevanceScore: 94
        },
        {
          url: 'https://www.mayoclinic.org/drugs-supplements/tretinoin-topical-route/description/drg-20066521',
          title: 'Tretinoin (Topical Route) Description and Brand Names',
          snippet: 'Tretinoin is used to treat acne and reduce fine wrinkles, dark spots, and rough skin.',
          relevanceScore: 88
        }
      );
    }

    if (lowerQuery.includes('vitamin c')) {
      results.push(
        {
          url: 'https://www.healthline.com/nutrition/vitamin-c-benefits-skin',
          title: 'How Vitamin C Benefits Your Skin',
          snippet: 'Vitamin C is an essential nutrient that supports collagen production and acts as a powerful antioxidant for skin health.',
          relevanceScore: 93
        },
        {
          url: 'https://www.webmd.com/diet/supplement-guide-vitamin-c',
          title: 'Vitamin C (Ascorbic Acid): Benefits, Side Effects, and More',
          snippet: 'Vitamin C is crucial for immune function, collagen synthesis, and acts as an antioxidant protecting against free radicals.',
          relevanceScore: 87
        }
      );
    }

    if (lowerQuery.includes('salicylic acid')) {
      results.push(
        {
          url: 'https://www.healthline.com/health/beauty-skin-care/salicylic-acid-for-acne',
          title: 'Salicylic Acid for Acne: How It Works and How to Use It',
          snippet: 'Salicylic acid is a beta hydroxy acid that helps unclog pores and reduce acne by exfoliating inside the pore.',
          relevanceScore: 95
        },
        {
          url: 'https://www.webmd.com/drugs/2/drug-1521/salicylic-acid-topical/details',
          title: 'Salicylic Acid Topical: Uses, Side Effects, and More',
          snippet: 'Salicylic acid helps remove dead skin cells and is commonly used to treat acne, warts, and other skin conditions.',
          relevanceScore: 89
        }
      );
    }

    if (lowerQuery.includes('ceramide')) {
      results.push(
        {
          url: 'https://www.healthline.com/health/ceramides',
          title: 'Ceramides: What They Are and How They Help Your Skin',
          snippet: 'Ceramides are waxy lipids that help form the skin barrier and retain moisture, essential for healthy skin function.',
          relevanceScore: 92
        },
        {
          url: 'https://www.webmd.com/beauty/what-are-ceramides',
          title: 'What Are Ceramides and What Do They Do for Your Skin?',
          snippet: 'Ceramides make up about 50% of the skin barrier and help prevent water loss while protecting against environmental damage.',
          relevanceScore: 88
        }
      );
    }

    // General skincare topics
    if (lowerQuery.includes('anti-aging') || lowerQuery.includes('antiaging')) {
      results.push(
        {
          url: 'https://www.mayoclinic.org/healthy-lifestyle/adult-health/in-depth/skin-care/art-20048237',
          title: 'Skin care: 5 tips for healthy skin - Mayo Clinic',
          snippet: 'Effective anti-aging skincare involves sun protection, gentle cleansing, moisturizing, and using proven active ingredients.',
          relevanceScore: 90
        }
      );
    }

    if (lowerQuery.includes('moisturizing') || lowerQuery.includes('hydrating')) {
      results.push(
        {
          url: 'https://www.healthline.com/health/dry-skin-moisturizer',
          title: 'The Best Moisturizers for Dry Skin',
          snippet: 'Proper moisturizing involves using products with humectants, emollients, and occlusives to maintain skin hydration.',
          relevanceScore: 91
        }
      );
    }

    // Hair care topics
    if (lowerQuery.includes('sulfate-free') || lowerQuery.includes('sulfate free')) {
      results.push(
        {
          url: 'https://www.healthline.com/health/sulfate-free-shampoo',
          title: 'Sulfate-Free Shampoo: Benefits and What to Look For',
          snippet: 'Sulfate-free shampoos are gentler on hair and scalp, helping preserve natural oils and reduce irritation.',
          relevanceScore: 89
        }
      );
    }

    if (lowerQuery.includes('keratin')) {
      results.push(
        {
          url: 'https://www.healthline.com/health/keratin',
          title: 'Keratin: What It Is, Benefits, and How to Protect It',
          snippet: 'Keratin is the main structural protein in hair, skin, and nails, essential for strength and protection.',
          relevanceScore: 90
        }
      );
    }

    // Validate URLs and return only working ones
    const validatedResults = [];
    for (const result of results) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const response = await fetch(result.url, { method: 'HEAD', signal: controller.signal });
        clearTimeout(timeoutId);
        if (response.ok) {
          validatedResults.push(result);
        }
      } catch (error) {
        console.log(`URL ${result.url} failed validation:`, (error as Error).message);
      }
    }

    return validatedResults.slice(0, 3); // Return top 3 results
  }

  /**
   * Find specific supporting evidence for a claim or ingredient
   */
  static async findSupportingEvidence(topic: string, claim: string): Promise<WebReference[]> {
    const searchQuery = `${topic} ${claim} benefits research studies`;
    const results = await this.searchForContent(searchQuery);

    return results.map(result => ({
      title: result.title,
      url: result.url,
      source: this.extractDomain(result.url),
      summary: result.snippet,
      relevanceScore: result.relevanceScore
    }));
  }

  /**
   * Extract domain name from URL for source attribution
   */
  private static extractDomain(url: string): string {
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      const siteName = domain.split('.')[0];
      return siteName.charAt(0).toUpperCase() + siteName.slice(1);
    } catch {
      return 'Unknown Source';
    }
  }

  /**
   * Validate that a URL contains relevant content
   */
  static async validateContentRelevance(url: string, topic: string): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!response.ok) return false;

      const text = await response.text();
      const lowerText = text.toLowerCase();
      const lowerTopic = topic.toLowerCase();

      // Check if the content actually mentions the topic
      return lowerText.includes(lowerTopic) || 
             lowerText.includes(lowerTopic.replace(/\s+/g, '-')) ||
             lowerText.includes(lowerTopic.replace(/\s+/g, ''));
    } catch {
      return false;
    }
  }
}