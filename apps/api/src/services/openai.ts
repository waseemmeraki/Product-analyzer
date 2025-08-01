import OpenAI from 'openai';
import { Product } from './database';

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

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  private formatProductsForPrompt(products: Product[]): string {
    return products.map(product => {
      return `Product: ${product.Name}
Brand: ${product.Brand}
Category: ${product.Category}
Rating: ${product.Rating}/5 (${product.ReviewCount} reviews)
Ingredients: ${product.Ingredients}
Ingredient Categories: ${product.IngredientCategories}
Claims: ${product.Claims}
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
    const prompt = this.createAnalysisPrompt(products);

    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert cosmetic and skincare analyst. Analyze product data to identify trends in ingredients, claims, and formulations. Always respond with valid JSON in the exact format requested.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
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
      if (!analysisResult.trending?.ingredients || !analysisResult.emerging?.ingredients || !analysisResult.declining?.ingredients || !analysisResult.insights) {
        throw new Error('Invalid response structure from OpenAI');
      }

      return analysisResult;
    } catch (error) {
      console.error('Error analyzing products with OpenAI:', error);
      throw new Error('Failed to analyze products');
    }
  }
}

export { OpenAIService, AnalysisResult };