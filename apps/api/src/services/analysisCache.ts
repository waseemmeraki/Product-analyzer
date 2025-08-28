import crypto from 'crypto';
import { Product } from './database';

interface CachedAnalysisResult {
  trending: {
    ingredients: string[];
    ingredientsDescription?: string;
    claims: string[];
    claimsDescription?: string;
    ingredientCategories: string[];
    ingredientCategoriesDescription?: string;
  };
  emerging: {
    ingredients: string[];
    ingredientsDescription?: string;
    claims: string[];
    claimsDescription?: string;
    ingredientCategories: string[];
    ingredientCategoriesDescription?: string;
  };
  declining: {
    ingredients: string[];
    ingredientsDescription?: string;
    claims: string[];
    claimsDescription?: string;
    ingredientCategories: string[];
    ingredientCategoriesDescription?: string;
  };
  insights: Array<{
    type: 'ingredient' | 'claim' | 'category';
    name: string;
    supportingFact: string;
    studyReference?: string;
    usageMetrics?: {
      searchVolume?: number;
      trendingScore?: number;
      userEngagement?: number;
      recentMentions?: number;
    };
    credibilityScore?: number;
    supportingStudies?: Array<{
      title: string;
      authors?: string;
      journal?: string;
      year?: number;
      doi?: string;
      summary: string;
      relevanceScore?: number;
    }>;
  }>;
  cachedAt: Date;
  expiresAt: Date;
}

class AnalysisCacheService {
  private cache: Map<string, CachedAnalysisResult> = new Map();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  /**
   * Generate a deterministic cache key based on product data
   */
  private generateCacheKey(products: Product[]): string {
    // Sort products by ID to ensure consistent ordering
    const sortedProducts = [...products].sort((a, b) => a.Id.localeCompare(b.Id));
    
    // Create a fingerprint of the essential product data
    const fingerprint = sortedProducts.map(product => ({
      id: product.Id,
      name: product.Name,
      brand: product.Brand,
      category: product.Category,
      ingredients: product.Ingredients?.toLowerCase().trim() || '',
      ingredientCategories: product.IngredientCategories?.toLowerCase().trim() || '',
      claims: product.Claims?.toLowerCase().trim() || '',
      rating: Math.round(product.Rating * 10) / 10, // Round to 1 decimal place
      reviewCount: product.ReviewCount
    }));

    // Create SHA-256 hash of the fingerprint
    const hash = crypto.createHash('sha256');
    hash.update(JSON.stringify(fingerprint));
    return hash.digest('hex');
  }

  /**
   * Check if cached result exists and is still valid
   */
  getCachedResult(products: Product[]): CachedAnalysisResult | null {
    const cacheKey = this.generateCacheKey(products);
    const cached = this.cache.get(cacheKey);

    if (!cached) {
      return null;
    }

    // Check if cache has expired
    if (new Date() > cached.expiresAt) {
      this.cache.delete(cacheKey);
      return null;
    }

    console.log(`Cache hit for analysis of ${products.length} products`);
    return cached;
  }

  /**
   * Store analysis result in cache
   */
  setCachedResult(products: Product[], result: Omit<CachedAnalysisResult, 'cachedAt' | 'expiresAt'>): void {
    const cacheKey = this.generateCacheKey(products);
    const now = new Date();
    
    const cachedResult: CachedAnalysisResult = {
      ...result,
      cachedAt: now,
      expiresAt: new Date(now.getTime() + this.CACHE_DURATION)
    };

    this.cache.set(cacheKey, cachedResult);
    console.log(`Cached analysis result for ${products.length} products (expires: ${cachedResult.expiresAt.toISOString()})`);
  }

  /**
   * Clear expired cache entries
   */
  cleanupExpiredEntries(): void {
    const now = new Date();
    let removedCount = 0;

    for (const [key, cached] of this.cache.entries()) {
      if (now > cached.expiresAt) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      console.log(`Cleaned up ${removedCount} expired cache entries`);
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { totalEntries: number; validEntries: number; expiredEntries: number } {
    const now = new Date();
    let validEntries = 0;
    let expiredEntries = 0;

    for (const cached of this.cache.values()) {
      if (now <= cached.expiresAt) {
        validEntries++;
      } else {
        expiredEntries++;
      }
    }

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries
    };
  }

  /**
   * Clear all cache entries (for testing or maintenance)
   */
  clearCache(): void {
    this.cache.clear();
    console.log('Analysis cache cleared');
  }
}

export { AnalysisCacheService, CachedAnalysisResult };