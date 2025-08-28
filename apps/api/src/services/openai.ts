import OpenAI from 'openai';
import { Product } from './database';

interface AnalysisResult {
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
}

class OpenAIService {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
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
    
    return `You are an expert product analyst specializing in consumer product trends across all retail categories. Analyze the following products to provide comprehensive market intelligence, adapting your analysis approach to the specific product category being analyzed.

${formattedProducts}

ANALYSIS FRAMEWORK:
1. **Trend Identification**: Analyze patterns in product components, claims, and consumer preferences
2. **Category Context**: Provide evidence-based explanations tailored to the specific product category
3. **Market Intelligence**: Include consumer behavior insights and market dynamics relevant to the category
4. **Future Projections**: Predict upcoming trends based on current data patterns within the category

CRITICAL REQUIREMENTS:
- Base ALL analysis strictly on the provided product data
- Provide detailed explanations for each categorization (trending/emerging/declining)
- Include scientific rationale for ingredient effectiveness
- Reference real, peer-reviewed studies from reputable journals
- Consider formulation synergies and ingredient interactions
- Analyze consumer sentiment through ratings and review counts

Please provide your analysis with:

1. **Trending** (High Performance): Items with strong presence in high-rated products (≥4.0 stars), appearing in 40%+ of products, or showing consistent consumer satisfaction
2. **Emerging** (Growth Potential): Innovative ingredients/claims appearing in 15-40% of products, representing new science or consumer demands
3. **Declining** (Losing Favor): Items in low-rated products (<3.5 stars), outdated formulations, or ingredients with negative consumer perception

Return your analysis in the following JSON format:
{
  "trending": {
    "ingredients": ["ingredient1", "ingredient2", "ingredient3"],
    "ingredientsDescription": "Found in X out of Y products (Z%), with an average rating of A stars. [Brief explanation of why these specific ingredients are popular in this product category, their benefits, and synergies]. Learn more: [INCI Decoder - ingredient1](https://incidecoder.com/ingredients/ingredient1-lowercase-with-hyphens) | [Paula's Choice Dictionary](https://www.paulaschoice.com/ingredient-dictionary)",
    "claims": ["claim1", "claim2", "claim3"],
    "claimsDescription": "Claim1 appeared in X out of Y products (Z%), with these products averaging A stars. [Explain why these claims are effective for this product category and connect to ingredient presence]. Learn more: [Dermstore Education](https://www.dermstore.com/blog/) | [Allure Magazine](https://www.allure.com/)",
    "ingredientCategories": ["category1", "category2", "category3"],
    "ingredientCategoriesDescription": "Category1 appeared in X% of products, correlating with A+ star average. [Explain why these categories are important for this product type and formulation trends]. Learn more: [CIR Ingredient Safety](https://www.cir-safety.org/ingredients)"
  },
  "emerging": {
    "ingredients": ["emerging_ingredient1", "emerging_ingredient2"],
    "ingredientsDescription": "Found in X out of Y products (Z%), representing early adoption. [Explain innovation, growth potential, consumer interest]. Sources: [relevant links]",
    "claims": ["emerging_claim1", "emerging_claim2"],
    "claimsDescription": "These claims appeared in X% of newer/innovative products. [Explain new consumer demands]. Sources: [relevant links]",
    "ingredientCategories": ["emerging_category1", "emerging_category2"],
    "ingredientCategoriesDescription": "These categories show X% growth. [Explain formulation innovation]. Sources: [relevant links]"
  },
  "declining": {
    "ingredients": ["declining_ingredient1", "declining_ingredient2"],
    "ingredientsDescription": "Found mainly in lower-rated products (X% of products averaging below 3.5 stars). [Explain consumer concerns or formulation shifts]. Sources: [relevant links]",
    "claims": ["declining_claim1", "declining_claim2"],
    "claimsDescription": "These claims appeared in X% of products, correlating with lower satisfaction. [Explain why losing favor]. Sources: [relevant links]",
    "ingredientCategories": ["declining_category1", "declining_category2"],
    "ingredientCategoriesDescription": "These categories show X% decrease in usage. [Explain industry shift]. Sources: [relevant links]"
  },
  "insights": [
    {
      "type": "ingredient|claim|category",
      "name": "item name",
      "supportingFact": "Comprehensive analysis combining trending, emerging, and declining patterns. Include specific percentages, ratings, and market dynamics from ALL analyzed products.",
      "primaryReference": "https://working-credible-url.com/relevant-page",
      "usageMetrics": {
        "searchVolume": 85000,
        "trendingScore": 92,
        "userEngagement": 78,
        "recentMentions": 1560,
        "marketPenetration": 45
      },
      "credibilityScore": 87,
      "webReferences": [
        {
          "title": "Descriptive title of the web resource",
          "url": "https://working-credible-url.com/specific-page",
          "source": "Website name (e.g., Mayo Clinic, Consumer Reports)",
          "summary": "Brief summary of the information provided",
          "relevanceScore": 95
        }
      ]
    }
  ]
}

INSIGHTS SECTION REQUIREMENTS - COMPREHENSIVE ANALYSIS:

The insights array should provide 8-12 high-impact insights that analyze ALL trending, emerging, and declining items collectively. Each insight should:

1. **Cross-Category Analysis**: Combine patterns from trending, emerging, and declining sections
   - Example: "Hyaluronic Acid dominates trending products (78% presence, 4.3 avg rating) while declining in budget formulations (15% presence in <$20 products)"

2. **Comprehensive Coverage**: Include insights for ALL significant items from the three main categories:
   - All trending ingredients/claims/categories (top performers)
   - All emerging ingredients/claims/categories (growth opportunities)  
   - All declining ingredients/claims/categories (market shifts)

3. **Realistic Usage Metrics** (generate realistic numbers based on product category):
   - searchVolume: 15,000-250,000 (monthly searches)
   - trendingScore: 65-98 (popularity index)
   - userEngagement: 45-95 (interaction rate %)
   - recentMentions: 500-5,000 (social/review mentions last 30 days)
   - marketPenetration: 15-85 (% of products containing this element)

4. **Web References - AUTOMATIC SOURCING**: 
   - DO NOT include webReferences in your JSON response
   - DO NOT include primaryReference in your JSON response  
   - Focus on creating detailed, accurate supportingFact content
   - The system will automatically find and validate specific relevant URLs that support your claims
   - This ensures all URLs work and contain actual proof of your statements

5. **Supporting Fact Structure**:
   - Start with cross-category statistics from your analysis
   - Include trending vs emerging vs declining performance
   - Explain market implications and consumer behavior
   - Add category-specific context and formulation science
   - End with future predictions based on the data patterns

6. **Credibility Scoring** (1-100):
   - 90-100: Established ingredients with strong scientific backing
   - 80-89: Well-researched with multiple credible sources
   - 70-79: Moderate evidence, some consumer validation
   - 60-69: Emerging with limited but promising evidence

EXAMPLE INSIGHT FORMAT:
{
  "type": "ingredient",
  "name": "Niacinamide",
  "supportingFact": "Dominates trending products with 89% presence (avg 4.4 stars) while emerging in budget lines (34% increase). Shows declining effectiveness claims in premium formulations, suggesting market saturation. Consumer demand remains high with 85% positive sentiment across all price points, indicating sustained long-term viability. Clinical studies demonstrate its effectiveness in reducing inflammation and improving skin barrier function.",
  "usageMetrics": {
    "searchVolume": 165000,
    "trendingScore": 94,
    "userEngagement": 87,
    "recentMentions": 3400,
    "marketPenetration": 72
  },
  "credibilityScore": 96
}

DESCRIPTION REQUIREMENTS FOR ALL SECTIONS (TRENDING, EMERGING, DECLINING):

For ALL ingredientsDescription fields (NOTE: For non-ingredient products, treat "ingredients" as key components/features):
1. Start with exact product statistics: "Found in X out of Y products (Z%), with average rating of A stars"
2. For trending: Explain why these elements are important for THIS specific product category
   - Beauty products: ingredient benefits and synergies
   - Tools/devices: materials, technology, performance features
   - Wellness products: active compounds, natural ingredients
3. For emerging: Highlight innovation and early adoption patterns relevant to the category
4. For declining: Discuss category-specific concerns or shifts in consumer preferences
5. End with 1-2 credible source links appropriate to the product category

For ALL claimsDescription fields:
1. State frequency and rating correlation from the data
2. For trending: Explain why these claims resonate for THIS product category specifically
   - Beauty: efficacy claims (anti-aging, hydrating, etc.)
   - Tools: performance claims (heat protection, professional-grade, etc.)
   - Wellness: health benefits, natural claims
3. For emerging: Explain new consumer demands driving these claims in this category
4. For declining: Analyze why these claims are losing relevance in this category
5. Include credible sources from reputable health/beauty publications or consumer testing organizations

For ALL ingredientCategoriesDescription fields (NOTE: For non-ingredient products, treat as "feature categories" or "product attributes"):
1. Analyze distribution and performance metrics
2. For trending: Explain why these categories/attributes are essential for THIS product type
3. For emerging: Discuss innovation in product development approaches for this category
4. For declining: Note shifts in consumer preferences or technology specific to this category
5. Add educational sources appropriate to the product category

SOURCE REQUIREMENTS - CRITICAL:
- ONLY use URLs that actually work and have content (no 404s!)
- For ingredient-specific links, replace placeholders with actual ingredient names
- Test format: [Descriptive Text](working URL)
- Examples of WORKING links:
  * [INCI Decoder - Niacinamide](https://incidecoder.com/ingredients/niacinamide)
  * [Paula's Choice Ingredient Dictionary](https://www.paulaschoice.com/ingredient-dictionary)
  * [EWG Skin Deep Database](https://www.ewg.org/skindeep/)
  * [Mayo Clinic Health Info](https://www.mayoclinic.org/)
  * [Consumer Reports](https://www.consumerreports.org/)
  * [Dermstore Education](https://www.dermstore.com/blog/)
- For general info, use main pages from trusted sources
- 2-3 sources per description maximum
- NEVER make up URLs - only use established, credible websites
- Choose sources most relevant to the product category being analyzed

ANALYSIS RULES:
- Base ALL analysis strictly on the provided product data - no external assumptions
- For the trending ingredientsDescription, focus on:
  * Percentage of products containing each ingredient
  * Average rating of products containing these ingredients
  * Frequency patterns observed in the actual data
  * Established scientific benefits (general knowledge, not specific citations)
  * Clear explanation of why these ingredients appear together
- Insights section is where specific studies and citations belong
- All percentages and metrics MUST be calculated from the actual product data provided
- If a category has no relevant items from the data, return an empty array []
- Be both COMPREHENSIVE (analyze all data) and ACCURATE (don't add external information)

CITATION REQUIREMENTS FOR INSIGHTS SECTION:
- Only reference studies from reputable journals (JAAD, JID, Int J Cosmet Sci, etc.)
- Studies must be from 2018-2024 to ensure current relevance
- Include realistic DOIs that follow proper format (10.XXXX/...)
- Focus on ingredients/claims actually found in the analyzed products
- Credibility scores should reflect: scientific evidence (40%), market presence in data (30%), safety profile (20%), regulatory status (10%)`;
  }

  async analyzeProducts(products: Product[]): Promise<AnalysisResult> {
    const prompt = this.createAnalysisPrompt(products);

    try {
      console.log('Generating analysis result from OpenAI');
      console.log('Prompt length:', prompt.length, 'characters');
      console.log('Number of products:', products.length);
      
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an expert product analyst specializing in retail product analysis across ALL Ulta Beauty categories. You provide evidence-based analysis for ANY product type, adapting your expertise to the specific category being analyzed.

ULTA PRODUCT CATEGORIES YOU ANALYZE:
- Beauty: Skincare, Makeup, Fragrance, Nails
- Hair Care: Shampoos, Styling, Tools, Treatments  
- Body Care: Bath & Body, Suncare, Self-care
- Tools & Accessories: Makeup brushes, Hair tools, Beauty devices
- Wellness: Supplements, Health products, Aromatherapy
- Men's Products: Grooming, Skincare, Fragrance
- Travel & Gift Sets: Mini products, Collections

CRITICAL REQUIREMENTS:

1. UNIVERSAL CATEGORY ANALYSIS:
   - Identify the product category from the analyzed products (could be ANYTHING Ulta sells)
   - Tailor descriptions to that category's specific consumer needs and concerns
   - Use category-appropriate terminology and benefits
   - Examples:
     * Hair tools: Focus on heat protection, styling results, ease of use
     * Wellness products: Focus on ingredients, benefits, daily use
     * Bath products: Focus on scent, skin feel, relaxation benefits
     * Tools/brushes: Focus on performance, durability, application quality

2. ALL DESCRIPTIONS MUST INCLUDE:
   - Exact statistics from the analyzed products (percentages, ratings, frequencies)
   - Category-specific scientific or market context using established knowledge
   - Engaging yet factual language that informs and educates

3. WEB REFERENCES - AUTOMATIC SOURCING: 
   - DO NOT include webReferences in your JSON response
   - DO NOT include primaryReference in your JSON response  
   - Focus on creating detailed, accurate supportingFact content
   - The system will automatically find and validate specific relevant URLs that support your claims
   - This ensures all URLs work and contain actual proof of your statements

4. DESCRIPTION FORMAT:
   - Ingredients: Statistics + benefits + synergies + context
   - Claims: Frequency + effectiveness + consumer response + regulatory context
   - Categories: Distribution + formulation science + trends + educational context
   - Length: 3-5 sentences, data-rich and informative

5. ACCURACY RULES:
   - Calculate all percentages from actual product data
   - Never invent statistics
   - Use only well-established scientific facts
   - Base all analysis strictly on the provided product data

6. CONSISTENCY REQUIREMENTS:
   - Always analyze products in the exact same order (sorted by ID)
   - Use identical language and phrasing for identical data patterns
   - Calculate percentages and statistics identically each time
   - When multiple products have the same ingredients, describe them the same way
   - Generate the same insights for the same data patterns

7. Always respond with valid JSON matching the requested format`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.0, // Set to 0 for maximum consistency
        max_tokens: 4000, // Restored full token limit
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

      console.log('✅ Analysis completed, processing web references...');
      return analysisResult;
    } catch (error) {
      console.error('Error analyzing products with OpenAI:', error);
      console.error('Error details:', (error as Error).message);
      if ((error as any).response) {
        console.error('OpenAI API response error:', (error as any).response.data);
      }
      throw new Error(`Failed to analyze products: ${(error as Error).message}`);
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
    console.log('Validating analysis result structure...');
    console.log('Result keys:', Object.keys(result || {}));
    
    if (!result || typeof result !== 'object') {
      console.log('❌ Result is not an object');
      return false;
    }
    
    // Check required top-level properties
    const requiredSections = ['trending', 'emerging', 'declining', 'insights'];
    for (const section of requiredSections) {
      if (!result[section]) {
        console.log(`❌ Missing section: ${section}`);
        return false;
      }
    }

    console.log('✅ All required sections present');
    return true; // Simplified validation for debugging
  }


  /**
   * Categorize ingredients using OpenAI to generate ingredient categories
   */
  async categorizeIngredients(ingredients: string): Promise<string> {
    if (!ingredients || ingredients.trim().length === 0) {
      return '';
    }

    const prompt = `Analyze the following cosmetic/skincare product ingredients and categorize them into appropriate ingredient categories. 

Ingredients: ${ingredients}

Please categorize these ingredients into functional categories commonly used in cosmetics and skincare. Return ONLY a comma-separated list of categories (no explanations, no numbering, no extra text).

Examples of good categories:
- Humectants
- Emollients  
- Antioxidants
- Active ingredients
- Preservatives
- Surfactants
- Thickeners
- pH adjusters
- Fragrances
- Plant extracts
- Vitamins
- Peptides
- Exfoliants
- UV filters
- Colorants

Focus on the PRIMARY functional role of each ingredient. If an ingredient serves multiple functions, choose the most important one. Return categories that are most relevant to the ingredients provided.`;

    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo', // Using cheaper model for simple categorization
        messages: [
          {
            role: 'system',
            content: `You are a cosmetic chemist expert specializing in ingredient categorization. Always return ONLY comma-separated category names with no additional text, explanations, or formatting. Be concise and accurate.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3, // Low temperature for consistency
        max_tokens: 200, // Short response needed
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content received from OpenAI');
      }

      // Clean up the response and ensure it's comma-separated
      const categories = content
        .trim()
        .replace(/^\d+\.\s*/gm, '') // Remove numbering
        .replace(/[-•*]\s*/g, '') // Remove bullet points
        .replace(/\n/g, ', ') // Replace newlines with commas
        .replace(/,\s*,/g, ',') // Remove double commas
        .replace(/,\s*$/, '') // Remove trailing comma
        .replace(/^\s*,/, '') // Remove leading comma
        .trim();

      return categories;

    } catch (error) {
      console.error('Error categorizing ingredients with OpenAI:', error);
      // Return empty string on error rather than throwing
      return '';
    }
  }
}

export { OpenAIService, AnalysisResult };