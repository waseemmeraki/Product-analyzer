import OpenAI from 'openai';
import { Product } from './database';
import { AnalysisCacheService } from './analysisCache';

interface AnalysisResult {
  trending: {
    ingredients: string[];
    claims: string[];
    ingredientCategories: string[];
  };
  emerging: {
    ingredients: string[];
    claims: string[];
    ingredientCategories: string[];
  };
  declining: {
    ingredients: string[];
    claims: string[];
    ingredientCategories: string[];
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
}

class OpenAIService {
  private client: OpenAI;
  private cacheService: AnalysisCacheService;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.cacheService = new AnalysisCacheService();
  }

  private formatProductsForPrompt(products: Product[]): string {
    // Sort products by ID for consistent ordering
    const sortedProducts = [...products].sort((a, b) => a.Id.localeCompare(b.Id));
    
    return sortedProducts.map((product, index) => {
      return `Product ${index + 1}: ${product.Name}
Brand: ${product.Brand}
Category: ${product.Category}
Rating: ${Math.round(product.Rating * 10) / 10}/5 (${product.ReviewCount} reviews)
Ingredients: ${product.Ingredients?.trim() || 'Not specified'}
Ingredient Categories: ${product.IngredientCategories?.trim() || 'Not specified'}
Claims: ${product.Claims?.trim() || 'Not specified'}
---`;
    }).join('\n');
  }

  private createAnalysisPrompt(products: Product[]): string {
    const formattedProducts = this.formatProductsForPrompt(products);
    
    return `Analyze the following cosmetic and skincare products to extract intelligence about ingredients, claims, and ingredient categories. Based ONLY on the actual product data provided, identify trends and provide insights.

${formattedProducts}

CRITICAL REQUIREMENTS:
- Analyze ALL ingredients, claims, and ingredient categories that are explicitly mentioned in the provided product data
- Do not miss or skip any items that are present in the data
- Do not assume or add any ingredients, claims, or ingredient categories that are not actually mentioned in the data
- Be comprehensive in analyzing what IS provided, but strict in not adding what is NOT provided

Please analyze this data and provide:

1. **Trending**: Items that appear frequently across high-rated products (rating >= 4.0) or appear in multiple product categories
2. **Emerging**: Items that appear in newer or innovative products, or represent growing consumer interests  
3. **Declining**: Items that appear mainly in lower-rated products or represent outdated formulations

Return your analysis in the following JSON format with separate arrays for each category:
{
  "trending": {
    "ingredients": ["Niacinamide", "Hyaluronic Acid", "Vitamin C"],
    "claims": ["Anti-aging", "Hydrating", "Brightening"],
    "ingredientCategories": ["Humectants", "Antioxidants", "Active ingredients"]
  },
  "emerging": {
    "ingredients": ["Bakuchiol", "Azelaic Acid"],
    "claims": ["Clean beauty", "Microbiome-friendly"],
    "ingredientCategories": ["Plant-based actives", "Prebiotics"]
  },
  "declining": {
    "ingredients": ["Parabens", "Sulfates"],
    "claims": ["Oil-free", "Alcohol-based"],
    "ingredientCategories": ["Harsh preservatives", "Drying agents"]
  },
  "insights": [
    {
      "type": "ingredient|claim|category",
      "name": "item name",
      "supportingFact": "brief explanation with supporting data",
      "studyReference": "Reference to relevant scientific study or research",
      "usageMetrics": {
        "searchVolume": 850,
        "trendingScore": 92,
        "userEngagement": 78,
        "recentMentions": 156
      },
      "credibilityScore": 87,
      "supportingStudies": [
        {
          "title": "Study title",
          "authors": "Author names",
          "journal": "Journal name",
          "year": 2023,
          "doi": "10.1000/example",
          "summary": "Brief study summary",
          "relevanceScore": 95
        }
      ]
    }
  ]
}

ANALYSIS RULES:
- INCLUDE ALL ingredients, claims, and ingredient categories that are explicitly mentioned in the provided product data
- THOROUGHLY examine each product's Ingredients, Claims, and Ingredient Categories fields
- Do not miss any items that appear in the data - be comprehensive and complete
- Do not add any items that are not present in the actual data - be accurate and precise
- If a category (ingredients/claims/ingredientCategories) has no relevant items from the data, return an empty array []
- Base analysis strictly on the provided product information - names, brands, categories, ratings, ingredients, ingredient categories, and claims
- Provide specific insights with supporting facts like usage frequency, average ratings, or market positioning from the actual data
- For each insight, include:
  * A credibility score (0-100) based on scientific evidence and market validation
  * Usage metrics including estimated search volume, trending score, user engagement, and recent mentions
  * Supporting studies with complete bibliographic information, relevance scores, and brief summaries
  * Credible scientific references from peer-reviewed journals, clinical studies, or dermatological research
- All supporting studies must be real, credible, and relevant to cosmetic/skincare science
- Usage metrics should reflect realistic market data and search trends
- Credibility scores should consider: scientific backing (40%), market adoption (30%), safety profile (20%), regulatory approval (10%)
- If no specific studies are available for an insight, provide general category studies or omit supportingStudies field

Be both COMPREHENSIVE (don't miss anything) and ACCURATE (don't add anything) when analyzing the provided data. Provide realistic usage metrics and credible scientific backing to enhance insight credibility.`;
  }

  async analyzeProducts(products: Product[]): Promise<AnalysisResult> {
    // Check cache first
    const cachedResult = this.cacheService.getCachedResult(products);
    if (cachedResult) {
      console.log('Returning cached analysis result');
      // Remove cache metadata before returning
      const { cachedAt, expiresAt, ...result } = cachedResult;
      return result;
    }

    // Clean up expired cache entries periodically
    this.cacheService.cleanupExpiredEntries();

    const prompt = this.createAnalysisPrompt(products);

    try {
      console.log('Generating new analysis result from OpenAI');
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an expert cosmetic and skincare analyst with a focus on consistency and scientific accuracy. 

CRITICAL REQUIREMENTS FOR CONSISTENT ANALYSIS:
1. Always analyze products in numerical order (Product 1, Product 2, etc.)
2. Base your analysis ONLY on the explicit data provided - do not infer or assume
3. Use consistent criteria for categorizing trends:
   - TRENDING: Items appearing in 3+ products OR in products with 4.0+ rating
   - EMERGING: Items appearing in 1-2 products with potential growth indicators
   - DECLINING: Items appearing in products with <3.5 rating OR outdated formulations
4. Generate insights based on factual patterns in the data
5. Always respond with valid JSON in the exact format requested
6. Maintain scientific rigor - only include credible studies and realistic metrics`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1, // Lower temperature for more consistent results
        max_tokens: 3000,
        seed: this.generateSeed(products), // Use deterministic seed based on product data
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content received from OpenAI');
      }

      // Extract JSON from markdown code blocks if present
      let jsonContent = content;
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonContent = jsonMatch[1];
      }

      // Parse the JSON response
      const analysisResult = JSON.parse(jsonContent) as AnalysisResult;
      
      // Validate the structure
      if (!this.validateAnalysisResult(analysisResult)) {
        throw new Error('Invalid response structure from OpenAI');
      }

      // Cache the result for future requests
      this.cacheService.setCachedResult(products, analysisResult);

      return analysisResult;
    } catch (error) {
      console.error('Error analyzing products with OpenAI:', error);
      throw new Error('Failed to analyze products');
    }
  }

  /**
   * Generate a deterministic seed based on product data for consistent OpenAI responses
   */
  private generateSeed(products: Product[]): number {
    const sortedProducts = [...products].sort((a, b) => a.Id.localeCompare(b.Id));
    const dataString = sortedProducts.map(p => `${p.Id}${p.Name}${p.Brand}`).join('');
    
    // Create a simple hash to generate a consistent seed
    let hash = 0;
    for (let i = 0; i < dataString.length; i++) {
      const char = dataString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Ensure positive seed within valid range
    return Math.abs(hash) % 2147483647;
  }

  /**
   * Validate analysis result structure and content
   */
  private validateAnalysisResult(result: any): result is AnalysisResult {
    if (!result || typeof result !== 'object') return false;
    
    // Check required top-level properties
    const requiredSections = ['trending', 'emerging', 'declining', 'insights'];
    for (const section of requiredSections) {
      if (!result[section]) return false;
    }

    // Check section structure
    const trendSections = ['trending', 'emerging', 'declining'];
    for (const section of trendSections) {
      const sectionData = result[section];
      if (!sectionData.ingredients || !Array.isArray(sectionData.ingredients)) return false;
      if (!sectionData.claims || !Array.isArray(sectionData.claims)) return false;
      if (!sectionData.ingredientCategories || !Array.isArray(sectionData.ingredientCategories)) return false;
    }

    // Check insights structure
    if (!Array.isArray(result.insights)) return false;
    for (const insight of result.insights) {
      if (!insight.type || !insight.name || !insight.supportingFact) return false;
      if (!['ingredient', 'claim', 'category'].includes(insight.type)) return false;
    }

    return true;
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.cacheService.getCacheStats();
  }

  /**
   * Clear all cache entries
   */
  clearCache(): void {
    this.cacheService.clearCache();
  }

  /**
   * Clean up expired cache entries
   */
  cleanupExpiredEntries(): void {
    this.cacheService.cleanupExpiredEntries();
  }
}

export { OpenAIService, AnalysisResult };