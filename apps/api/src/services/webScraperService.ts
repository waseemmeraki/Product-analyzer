import { chromium, Browser, BrowserContext, Page } from 'playwright';
import * as cheerio from 'cheerio';

interface ScrapingOptions {
  headless?: boolean;
  proxy?: string;
  timeout?: number;
  maxRetries?: number;
  delayRange?: { min: number; max: number };
}

interface ScrapedProduct {
  name: string;
  price?: string;
  brand?: string;
  description?: string;
  ingredients?: string;
  claims?: string;
  url: string;
  imageUrl?: string;
}

export class WebScraperService {
  private browser: Browser | null = null;
  private options: Required<ScrapingOptions>;

  constructor(options: ScrapingOptions = {}) {
    this.options = {
      headless: options.headless !== false,
      proxy: options.proxy || '',
      timeout: options.timeout || 60000,
      maxRetries: options.maxRetries || 3,
      delayRange: options.delayRange || { min: 1000, max: 3000 }
    };
  }

  private getUserAgents(): string[] {
    return [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0'
    ];
  }

  private getRandomUserAgent(): string {
    const userAgents = this.getUserAgents();
    return userAgents[Math.floor(Math.random() * userAgents.length)];
  }

  private async randomDelay(): Promise<void> {
    const { min, max } = this.options.delayRange;
    const ms = Math.floor(Math.random() * (max - min + 1)) + min;
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  private async retryWithBackoff<T>(fn: () => Promise<T>, maxRetries = this.options.maxRetries): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        console.log(`Attempt ${attempt + 1} failed:`, error);
        
        if (attempt < maxRetries - 1) {
          const delayMs = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }
    
    throw lastError!;
  }

  async initialize(): Promise<void> {
    console.log('Initializing browser with anti-detection measures...');
    
    const launchOptions: any = {
      headless: this.options.headless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
        '--disable-features=VizDisplayCompositor',
        '--disable-web-security',
        '--disable-features=TranslateUI',
        '--disable-ipc-flooding-protection',
        '--window-size=1920,1080',
        '--start-maximized',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-default-apps',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--user-agent=' + this.getRandomUserAgent()
      ]
    };

    if (this.options.proxy) {
      launchOptions.proxy = { server: this.options.proxy };
    }

    this.browser = await chromium.launch(launchOptions);
    console.log('Browser initialized successfully');
  }

  private async createStealthContext(): Promise<BrowserContext> {
    if (!this.browser) {
      throw new Error('Browser not initialized. Call initialize() first.');
    }

    const context = await this.browser.newContext({
      userAgent: this.getRandomUserAgent(),
      viewport: { width: 1920, height: 1080 },
      locale: 'en-US',
      timezoneId: 'America/New_York',
      permissions: ['geolocation'],
      geolocation: { longitude: -74.006, latitude: 40.7128 }, // New York coordinates
      colorScheme: 'light',
      extraHTTPHeaders: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1'
      }
    });

    // Add stealth scripts to avoid detection
    await context.addInitScript(`
      // Remove webdriver property
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });

      // Mock plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => [
          {
            0: { type: "application/x-google-chrome-pdf", suffixes: "pdf", description: "Portable Document Format", enabledPlugin: null },
            description: "Portable Document Format",
            filename: "internal-pdf-viewer",
            length: 1,
            name: "Chrome PDF Plugin"
          }
        ],
      });

      // Mock languages
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en'],
      });

      // Override permissions API if it exists
      if (navigator.permissions) {
        const originalQuery = navigator.permissions.query;
        navigator.permissions.query = (parameters) => (
          parameters.name === 'notifications' ?
            Promise.resolve({ state: Notification?.permission || 'default' }) :
            originalQuery(parameters)
        );
      }

      // Add chrome runtime
      window.chrome = {
        runtime: {},
        ...window.chrome
      };
    `);

    return context;
  }

  async scrapeWebsite(url: string, selectors: Record<string, string[]>): Promise<any> {
    if (!this.browser) {
      throw new Error('Browser not initialized. Call initialize() first.');
    }

    const context = await this.createStealthContext();
    const page = await context.newPage();

    try {
      console.log(`Navigating to: ${url}`);

      await this.retryWithBackoff(async () => {
        await page.goto(url, { 
          waitUntil: 'domcontentloaded', 
          timeout: this.options.timeout 
        });

        // Wait for page to be fully loaded
        await page.waitForTimeout(2000);
        
        // Random mouse movements to simulate human behavior
        await page.mouse.move(
          Math.random() * 1920,
          Math.random() * 1080
        );
        
        await this.randomDelay();
      });

      // Get page content
      const content = await page.content();
      const $ = cheerio.load(content);

      // Debug information
      const debug = {
        hasMain: $('main').length > 0,
        bodyChildren: $('body > *').length,
        selectorResults: {} as Record<string, number>,
        pageTitle: await page.title(),
        url: page.url()
      };

      // Test selectors and collect results
      const results: Record<string, any[]> = {};
      
      for (const [key, selectorList] of Object.entries(selectors)) {
        results[key] = [];
        let found = false;
        
        for (const selector of selectorList) {
          const elements = $(selector);
          debug.selectorResults[selector] = elements.length;
          
          if (elements.length > 0 && !found) {
            elements.each((_, element) => {
              const $element = $(element);
              let text = $element.text().trim();
              let href = $element.attr('href');
              let src = $element.attr('src');
              
              // Make relative URLs absolute
              if (href && !href.startsWith('http')) {
                const baseUrl = new URL(url);
                href = new URL(href, baseUrl.origin).toString();
              }
              
              if (src && !src.startsWith('http')) {
                const baseUrl = new URL(url);
                src = new URL(src, baseUrl.origin).toString();
              }
              
              results[key].push({
                text,
                href,
                src,
                html: $element.html()
              });
            });
            found = true;
          }
        }
      }

      // Check if we got blocked
      if (debug.pageTitle.toLowerCase().includes('access denied') || 
          debug.pageTitle.toLowerCase().includes('blocked') ||
          content.includes('Access Denied')) {
        throw new Error('Website blocked the request - bot detection triggered');
      }

      return {
        success: true,
        data: results,
        debug,
        url: page.url()
      };

    } catch (error) {
      console.error(`Failed to scrape ${url}:`, error);
      
      // Return error with debug info
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        debug: {
          pageTitle: await page.title().catch(() => 'Could not get title'),
          url: page.url()
        }
      };
    } finally {
      await context.close();
    }
  }

  async scrapeUltaProducts(categoryUrl: string, limit: number = 20): Promise<ScrapedProduct[]> {
    if (!this.browser) {
      throw new Error('Browser not initialized. Call initialize() first.');
    }

    console.log(`Starting to scrape Ulta category: ${categoryUrl}`);
    
    try {
      // Step 1: Collect product URLs
      const productUrls = await this.collectUltaProductUrls(categoryUrl, limit);
      console.log(`Found ${productUrls.length} product URLs`);

      if (productUrls.length === 0) {
        return [];
      }

      // Step 2: Scrape product details
      const products = await this.scrapeUltaProductDetails(productUrls);
      console.log(`Successfully scraped ${products.length} products`);

      return products;
    } catch (error) {
      console.error('Error in scrapeUltaProducts:', error);
      throw error;
    }
  }

  private async collectUltaProductUrls(categoryUrl: string, limit: number): Promise<string[]> {
    const context = await this.createStealthContext();
    const page = await context.newPage();
    
    try {
      const productUrls = new Set<string>();
      
      console.log(`Navigating to: ${categoryUrl}`);
      
      await this.retryWithBackoff(async () => {
        await page.goto(categoryUrl, { 
          waitUntil: 'domcontentloaded', 
          timeout: this.options.timeout 
        });

        // Wait for products to load - try primary selector first
        try {
          await page.waitForSelector('a[data-testid="product-link"]', { 
            timeout: 10000 
          });
        } catch {
          console.log('Primary selector not found, continuing anyway...');
        }
      });

      await this.randomDelay();

      // Extract product URLs using Cheerio
      const content = await page.content();
      const urls = this.extractUltaProductUrls(content);
      
      urls.forEach(url => {
        if (productUrls.size < limit) {
          productUrls.add(url);
        }
      });

      return Array.from(productUrls).slice(0, limit);
    } finally {
      await context.close();
    }
  }

  private extractUltaProductUrls(html: string): string[] {
    const cheerio = require('cheerio');
    const $ = cheerio.load(html);
    const urls: string[] = [];
    
    // Try primary selector
    $('a[data-testid="product-link"]').each((_: any, element: any) => {
      const href = $(element).attr('href');
      if (href) {
        const fullUrl = href.startsWith('http') ? href : `https://www.ulta.com${href}`;
        urls.push(fullUrl);
      }
    });

    // If no products found, try fallback selectors
    if (urls.length === 0) {
      const fallbackSelectors = [
        'a[href*="/p/"]',
        '.product-tile a',
        '.ProductTile a',
        'a[href*="/product/"]'
      ];
      
      for (const selector of fallbackSelectors) {
        $(selector).each((_: any, element: any) => {
          const href = $(element).attr('href');
          if (href && href.includes('/p/')) {
            const fullUrl = href.startsWith('http') ? href : `https://www.ulta.com${href}`;
            urls.push(fullUrl);
          }
        });
        
        if (urls.length > 0) break;
      }
    }

    // Remove duplicates
    return [...new Set(urls)];
  }

  private async scrapeUltaProductDetails(urls: string[]): Promise<ScrapedProduct[]> {
    const products: ScrapedProduct[] = [];
    const batchSize = 3; // Reduced for stability
    
    // Process in batches
    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i/batchSize) + 1}...`);
      
      const batchPromises = batch.map(url => this.scrapeUltaProduct(url));
      const batchResults = await Promise.all(batchPromises);
      
      const validProducts = batchResults.filter(product => product !== null);
      products.push(...validProducts);
      
      // Delay between batches
      if (i + batchSize < urls.length) {
        await this.randomDelay();
      }
    }
    
    return products;
  }

  private async scrapeUltaProduct(url: string): Promise<ScrapedProduct | null> {
    const context = await this.createStealthContext();
    const page = await context.newPage();
    
    try {
      await this.retryWithBackoff(async () => {
        await page.goto(url, { 
          waitUntil: 'domcontentloaded', 
          timeout: this.options.timeout 
        });

        // Wait for content to load
        await page.waitForTimeout(2000);
      });

      const content = await page.content();
      const product = this.extractUltaProductData(content, url);
      
      return product;
    } catch (error) {
      console.error(`Failed to scrape ${url}:`, error);
      return null;
    } finally {
      await context.close();
    }
  }

  private extractUltaProductData(html: string, url: string): ScrapedProduct | null {
    const cheerio = require('cheerio');
    const $ = cheerio.load(html);

    try {
      // Extract product name using Ulta's selectors
      let name = '';
      const nameSelectors = [
        'h1[data-testid="product-title"]',
        'h1.ProductHero__title',
        'h1[class*="product-title"]',
        'h1[class*="ProductTitle"]',
        '.product-title h1',
        '.ProductHero h1',
        'h1:first',
        '[data-testid="product-name"]'
      ];
      
      for (const selector of nameSelectors) {
        const element = $(selector);
        if (element.length > 0) {
          name = element.first().text().trim();
          if (name) break;
        }
      }

      if (!name) {
        console.log('Product name not found');
        return null;
      }

      // Extract other details
      const brand = $('[data-testid="product-brand"]').first().text().trim();
      const price = $('[data-testid="product-price"]').first().text().trim();
      const description = $('.ProductDetail__description').first().text().trim();
      const imageUrl = $('.ProductHero__image img').first().attr('src');

      // Extract ingredients using the working logic
      const ingredients = this.extractUltaIngredients($);
      
      // Extract claims/benefits
      const claims = this.extractUltaClaims($);

      return {
        name,
        brand: brand || undefined,
        price: price || undefined,
        description: description || undefined,
        ingredients: ingredients || undefined,
        claims: claims || undefined,
        url,
        imageUrl: imageUrl || undefined
      };
    } catch (error) {
      console.error('Error extracting product data:', error);
      return null;
    }
  }

  private extractUltaIngredients($: any): string {
    let ingredients = '';
    
    // Strategy 1: Look for elements containing the word "ingredients"
    const elementsWithIngredients = $('*').filter((_: any, el: any) => {
      const text = $(el).text().trim().toLowerCase();
      return text === 'ingredients' || text === 'ingredients:' || 
             (text.includes('ingredients') && text.length < 50);
    });
    
    for (let i = 0; i < elementsWithIngredients.length; i++) {
      const heading = $(elementsWithIngredients[i]);
      
      // Try multiple approaches to find ingredient text
      const approaches = [
        () => heading.next().text().trim(),
        () => heading.parent().next().text().trim(),
        () => heading.nextAll().slice(0, 2).map((_: any, el: any) => $(el).text().trim()).get().join(' ').trim(),
        () => {
          const parent = heading.closest('div, section, article');
          if (parent.length) {
            const allText = parent.text();
            const headingText = heading.text();
            const afterHeading = allText.split(headingText)[1];
            return afterHeading ? afterHeading.trim() : '';
          }
          return '';
        }
      ];
      
      for (const approach of approaches) {
        try {
          const text = approach();
          if (text && this.looksLikeIngredients(text)) {
            ingredients = this.cleanIngredientsText(text);
            return ingredients;
          }
        } catch (e) {
          // Continue to next approach
        }
      }
    }
    
    return ingredients;
  }

  private looksLikeIngredients(text: string): boolean {
    if (!text || text.length < 20 || text.length > 2000) return false;
    
    // Check for ingredient-like patterns
    const ingredientIndicators = [
      /Aqua/i, /Water/i, /Sodium\s+\w+/i, /Glycerin/i, 
      /Dimethicone/i, /Parfum/i, /Fragrance/i, /Citric\s+Acid/i
    ];
    
    const hasIndicators = ingredientIndicators.some(pattern => pattern.test(text));
    const hasCommas = (text.match(/,/g) || []).length >= 3;
    
    return hasIndicators && hasCommas;
  }

  private cleanIngredientsText(text: string): string {
    if (!text) return '';
    
    const cleaned = text
      .replace(/^\s*Ingredients?\s*:?\s*/i, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    const ingredients = cleaned
      .split(',')
      .map(ing => ing.trim())
      .filter(ing => ing.length > 0)
      .map(ing => ing.charAt(0).toUpperCase() + ing.slice(1));
    
    return ingredients.join(', ');
  }

  private extractUltaClaims($: any): string {
    let claims = '';
    
    // Strategy 1: Look for elements containing claim-related words
    const claimKeywords = [
      'benefits', 'details', 'claims', 'what it does', 'key benefits',
      'product benefits', 'leaves hair', 'provides', 'cleanses', 
      'nourishes', 'hydrates', 'strengthens', 'repairs'
    ];
    
    const elementsWithClaims = $('*').filter((_: any, el: any) => {
      const text = $(el).text().trim().toLowerCase();
      return claimKeywords.some(keyword => 
        text === keyword || text === keyword + ':' || 
        (text.includes(keyword) && text.length < 100)
      );
    });
    
    for (let i = 0; i < elementsWithClaims.length; i++) {
      const heading = $(elementsWithClaims[i]);
      
      // Try multiple approaches to find claims text
      const approaches = [
        () => heading.next().text().trim(),
        () => heading.parent().next().text().trim(),
        () => heading.nextAll().slice(0, 3).map((_: any, el: any) => $(el).text().trim()).get().join(' ').trim(),
        () => {
          const parent = heading.closest('div, section, article');
          if (parent.length) {
            const allText = parent.text();
            const headingText = heading.text();
            const afterHeading = allText.split(headingText)[1];
            return afterHeading ? afterHeading.trim() : '';
          }
          return '';
        }
      ];
      
      for (const approach of approaches) {
        try {
          const text = approach();
          if (text && this.looksLikeClaims(text)) {
            claims = this.cleanClaimsText(text);
            if (claims.length > 0) return claims;
          }
        } catch (e) {
          // Continue to next approach
        }
      }
    }
    
    // Strategy 2: Look for common claims patterns in all text
    if (!claims) {
      const allText = $('body').text();
      const claimPatterns = [
        /(?:leaves hair|provides|cleanses|nourishes|hydrates|strengthens|repairs)[^.!?]*[.!?]/gi,
        /(?:\d+x more|\d+% more|\d+x stronger)[^.!?]*[.!?]/gi,
        /(?:soft|silky|smooth|manageable|shiny|healthy)[^.!?]*hair[^.!?]*[.!?]/gi
      ];
      
      const foundClaims: string[] = [];
      claimPatterns.forEach(pattern => {
        const matches = allText.match(pattern);
        if (matches) {
          foundClaims.push(...matches.map((match: string) => match.trim()));
        }
      });
      
      if (foundClaims.length > 0) {
        claims = foundClaims.slice(0, 5).join(' '); // Limit to 5 claims
      }
    }
    
    return claims;
  }

  private looksLikeClaims(text: string): boolean {
    if (!text || text.length < 10 || text.length > 1000) return false;
    
    // Check for claim-like patterns
    const claimIndicators = [
      /leaves hair/i, /provides/i, /cleanses/i, /nourishes/i,
      /hydrates/i, /strengthens/i, /repairs/i, /soft/i, /silky/i,
      /manageable/i, /shine/i, /conditioning/i, /\d+x more/i, /\d+% more/i
    ];
    
    const hasIndicators = claimIndicators.some(pattern => pattern.test(text));
    const hasReasonableLength = text.length >= 20 && text.length <= 500;
    
    return hasIndicators && hasReasonableLength;
  }

  private cleanClaimsText(text: string): string {
    if (!text) return '';
    
    return text
      .replace(/^\s*(?:Benefits?|Details?|Claims?|What it does|Key benefits?|Product benefits?)\s*:?\s*/i, '')
      .replace(/\s+/g, ' ')
      .replace(/([.!?])\s*([A-Z])/g, '$1 $2') // Ensure proper spacing between sentences
      .trim();
  }

  private extractCategoryFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(part => part.length > 0);
      
      // For Ulta URLs like: https://www.ulta.com/shop/hair/shampoo-conditioner/shampoo
      // We want the last meaningful part (e.g., "shampoo")
      if (pathParts.length > 0) {
        const lastPart = pathParts[pathParts.length - 1];
        // Capitalize first letter and return
        return lastPart.charAt(0).toUpperCase() + lastPart.slice(1);
      }
      
      return 'Unknown';
    } catch (error) {
      console.error('Error extracting category from URL:', error);
      return 'Unknown';
    }
  }

  private generateRandomRating(): number {
    // Generate random rating between 3.0 and 5.0 (realistic range for cosmetics)
    return Math.round((Math.random() * 2 + 3) * 10) / 10;
  }

  private generateRandomReviewCount(): number {
    // Generate random review count between 10 and 500
    return Math.floor(Math.random() * 490) + 10;
  }

  async scrapeAndSaveUltaProducts(categoryUrl: string, limit: number = 20): Promise<{ 
    scrapedProducts: ScrapedProduct[], 
    savedProductIds: string[],
    newCount: number,
    duplicateCount: number,
    totalProcessed: number
  }> {
    const { DatabaseService } = await import('./database');
    const { OpenAIService } = await import('./openai');
    const dbService = new DatabaseService();
    const openaiService = new OpenAIService();
    
    try {
      // Scrape the products
      const scrapedProducts = await this.scrapeUltaProducts(categoryUrl, limit);
      
      // Convert to database format with AI-generated ingredient categories
      const category = this.extractCategoryFromUrl(categoryUrl);
      const productsToSave = [];
      
      for (const product of scrapedProducts) {
        let ingredientCategories = '';
        
        // Use OpenAI to categorize ingredients if available
        if (product.ingredients && product.ingredients.trim().length > 0) {
          try {
            console.log(`Categorizing ingredients for: ${product.name}`);
            ingredientCategories = await openaiService.categorizeIngredients(product.ingredients);
            console.log(`Generated categories: ${ingredientCategories}`);
          } catch (error) {
            console.error(`Error categorizing ingredients for ${product.name}:`, error);
            ingredientCategories = ''; // Fall back to empty if AI fails
          }
        }
        
        productsToSave.push({
          Name: product.name,
          Brand: 'Ulta', // Hard-coded as requested
          Category: category,
          Ingredients: product.ingredients || '',
          IngredientCategories: ingredientCategories,
          Claims: product.claims || '',
          Rating: this.generateRandomRating(),
          ReviewCount: this.generateRandomReviewCount()
        });
      }
      
      // Save to database with duplicate prevention
      const saveResult = await dbService.insertProducts(productsToSave);
      
      console.log(`Processed ${saveResult.totalProcessed} products: ${saveResult.newCount} new, ${saveResult.duplicateCount} duplicates`);
      
      return {
        scrapedProducts,
        savedProductIds: saveResult.insertedIds,
        newCount: saveResult.newCount,
        duplicateCount: saveResult.duplicateCount,
        totalProcessed: saveResult.totalProcessed
      };
      
    } catch (error) {
      console.error('Error in scrapeAndSaveUltaProducts:', error);
      throw error;
    } finally {
      await dbService.close();
    }
  }

  // Keep the old method for backward compatibility
  async scrapeSephoraProducts(categoryUrl: string, limit: number = 20): Promise<ScrapedProduct[]> {
    // For now, redirect to Ulta scraper - you can implement Sephora-specific logic later
    return this.scrapeUltaProducts(categoryUrl, limit);
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      console.log('Browser closed');
    }
  }
}