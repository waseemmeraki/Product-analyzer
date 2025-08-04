'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import './styles.css';

interface Product {
  Id: string;
  Name: string;
  Brand: string;
  Category: string;
  Ingredients: string;
  IngredientCategories: string;
  Claims: string;
  Rating: number;
  ReviewCount: number;
}

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
    marketData?: {
      adoptionRate?: string;
      searchTrends?: string;
      marketGrowth?: string;
      industryReports?: string[];
    };
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

export default function ProductSelectorPage() {
  const [brands, setBrands] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<'trending' | 'emerging' | 'declining' | 'insights'>('trending');
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  
  // Scraping states
  const [scrapingUrl, setScrapingUrl] = useState<string>('');
  const [scrapingLoading, setScrapingLoading] = useState(false);
  const [scrapingResult, setScrapingResult] = useState<{
    scrapedCount: number;
    newProductsAdded: number;
    duplicatesSkipped: number;
  } | null>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

  // Fetch brands on component mount
  useEffect(() => {
    fetchBrands();
  }, []);

  // Fetch categories when brand changes
  useEffect(() => {
    if (selectedBrand) {
      fetchCategories(selectedBrand);
      setSelectedCategory('');
      setProducts([]);
      setSelectedProducts([]);
      setAnalysis(null);
    }
  }, [selectedBrand]);

  // Fetch products when category changes
  useEffect(() => {
    if (selectedBrand && selectedCategory) {
      fetchProducts(selectedBrand, selectedCategory);
      setSelectedProducts([]);
      setAnalysis(null);
    }
  }, [selectedBrand, selectedCategory]);

  const fetchBrands = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/products/brands`);
      const data = await response.json();
      if (data.success) {
        setBrands(data.data);
      }
    } catch (error) {
      console.error('Error fetching brands:', error);
      setError('Failed to fetch brands');
    } finally {
      setIsInitialLoading(false);
    }
  };

  const fetchCategories = async (brand: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/products/brands/${encodeURIComponent(brand)}/categories`);
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Failed to fetch categories');
    }
  };

  const fetchProducts = async (brand: string, category: string) => {
    try {
      console.log('Fetching products for:', { brand, category });
      const response = await fetch(`${API_BASE_URL}/api/products/brands/${encodeURIComponent(brand)}/categories/${encodeURIComponent(category)}/products`);
      const data = await response.json();
      console.log('Products API response:', data);
      if (data.success) {
        console.log('Setting products:', data.data);
        setProducts(data.data);
      } else {
        console.log('API returned success: false');
        setError(data.message || 'Failed to fetch products');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to fetch products');
    }
  };

  const handleProductSelection = (productId: string, checked: boolean) => {
    if (checked) {
      setSelectedProducts([...selectedProducts, productId]);
    } else {
      setSelectedProducts(selectedProducts.filter(id => id !== productId));
    }
  };

  const analyzeProducts = async () => {
    if (selectedProducts.length === 0) {
      setError('Please select at least one product');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productIds: selectedProducts
        })
      });

      const data = await response.json();
      if (data.success) {
        setAnalysis(data.data.analysis);
        setActiveFilter('trending'); // Reset to trending view
      } else {
        setError(data.message || 'Analysis failed');
      }
    } catch (error) {
      console.error('Error analyzing products:', error);
      setError('Failed to analyze products');
    } finally {
      setLoading(false);
    }
  };

  const scrapeUltaProducts = async () => {
    if (!scrapingUrl.trim()) {
      setError('Please enter a valid Ulta URL');
      return;
    }

    // Basic URL validation
    try {
      const url = new URL(scrapingUrl);
      if (!url.hostname.includes('ulta.com')) {
        setError('Please enter a valid Ulta.com URL');
        return;
      }
    } catch {
      setError('Please enter a valid URL');
      return;
    }

    setScrapingLoading(true);
    setError('');
    setScrapingResult(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/scraper/ulta/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          categoryUrl: scrapingUrl,
          limit: 10
        })
      });

      const data = await response.json();
      if (data.success) {
        setScrapingResult({
          scrapedCount: data.meta.scrapedCount,
          newProductsAdded: data.meta.newProductsAdded,
          duplicatesSkipped: data.meta.duplicatesSkipped
        });
        
        // Refresh brands list to show new data
        await fetchBrands();
        
        // Clear form
        setScrapingUrl('');
        
        // Show success message
        setTimeout(() => setScrapingResult(null), 10000); // Clear after 10 seconds
      } else {
        setError(data.error || 'Scraping failed');
      }
    } catch (error) {
      console.error('Error scraping products:', error);
      setError('Failed to scrape products');
    } finally {
      setScrapingLoading(false);
    }
  };


  if (isInitialLoading) {
    return (
      <div className="page-container">
        <div className="header">
          <h1 className="title">Product Analytics</h1>
          <p className="subtitle">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="header">
        <h1 className="title">Product Analytics</h1>
        <p className="subtitle">
          Intelligent ingredient analysis and market trend insights
        </p>
        <Link href="/" className="back-button">
          ← Return to Dashboard
        </Link>
      </div>

      <div className="content">
        {error && (
          <div className="error-message">
            ⚠ {error}
          </div>
        )}

        {/* Scraping success message */}
        {scrapingResult && (
          <div className="success-message">
            ✅ Successfully scraped {scrapingResult.scrapedCount} products! 
            Added {scrapingResult.newProductsAdded} new products, 
            skipped {scrapingResult.duplicatesSkipped} duplicates.
          </div>
        )}

        {/* Ulta Scraping Section */}
        <div className="scraping-section">
          <h2 className="section-title">🕷️ Scrape New Products from Ulta</h2>
          <div className="scraping-card">
            <div className="scraping-form">
              <div className="form-group">
                <label htmlFor="scrapingUrl" className="form-label">
                  Ulta Category URL
                </label>
                <input
                  id="scrapingUrl"
                  type="url"
                  value={scrapingUrl}
                  onChange={(e) => setScrapingUrl(e.target.value)}
                  placeholder="https://www.ulta.com/shop/hair/shampoo-conditioner/shampoo"
                  className="url-input"
                  disabled={scrapingLoading}
                />
                <div className="input-hint">
                  Enter a Ulta category page URL to scrape products and save them to the database
                </div>
              </div>

              <button
                onClick={scrapeUltaProducts}
                disabled={!scrapingUrl.trim() || scrapingLoading}
                className="scrape-button"
              >
                {scrapingLoading ? (
                  <>
                    <div className="loading-spinner"></div>
                    <span>Scraping Products...</span>
                  </>
                ) : (
                  `🚀 Scrape 10 Products`
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="controls-grid">
          <div className="control-card">
            <h3 className="card-title">
              🏢 Brand Selection
            </h3>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="select-input"
            >
              <option value="">Select a brand...</option>
              {brands.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
            <div className="count-badge">{brands.length} brands available</div>
          </div>

          <div className="control-card">
            <h3 className="card-title">
              📊 Category Selection
            </h3>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              disabled={!selectedBrand}
              className="select-input"
            >
              <option value="">Select a category...</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <div className="count-badge">{categories.length} categories available</div>
          </div>

          <div className="control-card multi-select-card">
            <h3 className="card-title">
              🎯 Product Selection
            </h3>
            <div className="multi-select-container">
              {products.length > 0 ? (
                <div className="products-grid">
                  {products.map((product) => (
                    <div
                      key={product.Id}
                      className={`product-checkbox-item ${selectedProducts.includes(product.Id) ? 'selected' : ''}`}
                      onClick={() => handleProductSelection(product.Id, !selectedProducts.includes(product.Id))}
                    >
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.Id)}
                        onChange={(e) => handleProductSelection(product.Id, e.target.checked)}
                        className="product-checkbox"
                      />
                      <div className="product-details">
                        <div className="product-name-small">{product.Name}</div>
                        <div className="product-meta-small">
                          <span>⭐ {product.Rating}</span>
                          <span>({product.ReviewCount})</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-products">
                  {!selectedCategory ? 'Select a category to view products' : 'No products available'}
                </div>
              )}
            </div>
            <div className="count-badge">{products.length} products available • {selectedProducts.length} selected</div>
          </div>

          {/* <div className="control-card">
            <h3 className="card-title">
              ⚡ Analysis Engine
            </h3>
            <button
              onClick={analyzeProducts}
              disabled={selectedProducts.length === 0 || loading}
              className="analyze-button"
            >
              {loading ? (
                <>
                  <div className="loading-spinner"></div>
                  <span>Analyzing...</span>
                </>
              ) : (
                `Analyze ${selectedProducts.length} products`
              )}
            </button>
            <div className="count-badge">
              {selectedProducts.length} products selected
            </div>
          </div> */}
        </div>

        {selectedProducts.length > 0 && (
          <div className="products-section">
            <div className="selected-products">
              <h3 className="card-title">
                🎯 Selected Products ({selectedProducts.length})
              </h3>
              <div className="products-list">
                {selectedProducts.map((productId) => {
                  const product = products.find((p) => p.Id === productId)
                  return product ? (
                    <div key={productId} className="product-item">
                      <div className="product-info">
                        <div className="product-name">{product.Name}</div>
                        <div className="product-meta">
                          <span>⭐ {product.Rating}/5</span>
                          <span>📊 {product.ReviewCount} reviews</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedProducts(selectedProducts.filter((id) => id !== productId))}
                        className="remove-button"
                      >
                        Remove
                      </button>
                    </div>
                  ) : null
                })}
              </div>
            </div>

            <div className="control-center">
              <h3 className="card-title">
                🎮 Actions
              </h3>
              <div className="control-buttons">
                <button
                  onClick={() => setSelectedProducts([])}
                  className="clear-button"
                  disabled={selectedProducts.length === 0}
                >
                  Clear All Products
                </button>
                <button
                  onClick={analyzeProducts}
                  disabled={selectedProducts.length === 0 || loading}
                  className="analyze-button"
                >
                  {loading ? (
                    <>
                      <div className="loading-spinner"></div>
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    `Analyze ${selectedProducts.length} products`
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {analysis && (
          <div className="analysis-report">
            <div className="report-header">
              <h2 className="report-title">📊 Analysis Results</h2>
              <div className="report-meta">
                <span className="report-info">📊 {selectedProducts.length} Products</span>
                <span className="report-info">📅 {new Date().toLocaleDateString()}</span>
                <span className="report-info">⭐ {selectedBrand} - {selectedCategory}</span>
              </div>
            </div>

            <div className="filter-tabs">
              <button
                className={`filter-tab ${activeFilter === 'trending' ? 'active' : ''}`}
                onClick={() => setActiveFilter('trending')}
              >
                📈 Trending ({analysis.trending.ingredients.length + analysis.trending.claims.length + analysis.trending.ingredientCategories.length})
              </button>
              <button
                className={`filter-tab ${activeFilter === 'emerging' ? 'active' : ''}`}
                onClick={() => setActiveFilter('emerging')}
              >
                🚀 Emerging ({analysis.emerging.ingredients.length + analysis.emerging.claims.length + analysis.emerging.ingredientCategories.length})
              </button>
              <button
                className={`filter-tab ${activeFilter === 'declining' ? 'active' : ''}`}
                onClick={() => setActiveFilter('declining')}
              >
                📉 Declining ({analysis.declining.ingredients.length + analysis.declining.claims.length + analysis.declining.ingredientCategories.length})
              </button>
              <button
                className={`filter-tab ${activeFilter === 'insights' ? 'active' : ''}`}
                onClick={() => setActiveFilter('insights')}
              >
                💡 Insights ({analysis.insights.length})
              </button>
            </div>

            <div className="report-content">
              {activeFilter === 'trending' && (
                <div className="trend-section">
                  <div className="tag-group">
                    <h4 className="tag-group-title">🧪 Ingredients</h4>
                    <div className="tags-container">
                      {analysis.trending.ingredients.length > 0 ? (
                        analysis.trending.ingredients.map((ingredient, index) => (
                          <span key={index} className="trend-tag trending">{ingredient}</span>
                        ))
                      ) : (
                        <span className="no-data">None identified</span>
                      )}
                    </div>
                  </div>
                  <div className="tag-group">
                    <h4 className="tag-group-title">✨ Claims</h4>
                    <div className="tags-container">
                      {analysis.trending.claims.length > 0 ? (
                        analysis.trending.claims.map((claim, index) => (
                          <span key={index} className="trend-tag trending">{claim}</span>
                        ))
                      ) : (
                        <span className="no-data">None identified</span>
                      )}
                    </div>
                  </div>
                  <div className="tag-group">
                    <h4 className="tag-group-title">📂 Ingredient Categories</h4>
                    <div className="tags-container">
                      {analysis.trending.ingredientCategories.length > 0 ? (
                        analysis.trending.ingredientCategories.map((category, index) => (
                          <span key={index} className="trend-tag trending">{category}</span>
                        ))
                      ) : (
                        <span className="no-data">None identified</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeFilter === 'emerging' && (
                <div className="trend-section">
                  <div className="tag-group">
                    <h4 className="tag-group-title">🧪 Ingredients</h4>
                    <div className="tags-container">
                      {analysis.emerging.ingredients.length > 0 ? (
                        analysis.emerging.ingredients.map((ingredient, index) => (
                          <span key={index} className="trend-tag emerging">{ingredient}</span>
                        ))
                      ) : (
                        <span className="no-data">None identified</span>
                      )}
                    </div>
                  </div>
                  <div className="tag-group">
                    <h4 className="tag-group-title">✨ Claims</h4>
                    <div className="tags-container">
                      {analysis.emerging.claims.length > 0 ? (
                        analysis.emerging.claims.map((claim, index) => (
                          <span key={index} className="trend-tag emerging">{claim}</span>
                        ))
                      ) : (
                        <span className="no-data">None identified</span>
                      )}
                    </div>
                  </div>
                  <div className="tag-group">
                    <h4 className="tag-group-title">📂 Ingredient Categories</h4>
                    <div className="tags-container">
                      {analysis.emerging.ingredientCategories.length > 0 ? (
                        analysis.emerging.ingredientCategories.map((category, index) => (
                          <span key={index} className="trend-tag emerging">{category}</span>
                        ))
                      ) : (
                        <span className="no-data">None identified</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeFilter === 'declining' && (
                <div className="trend-section">
                  <div className="tag-group">
                    <h4 className="tag-group-title">🧪 Ingredients</h4>
                    <div className="tags-container">
                      {analysis.declining.ingredients.length > 0 ? (
                        analysis.declining.ingredients.map((ingredient, index) => (
                          <span key={index} className="trend-tag declining">{ingredient}</span>
                        ))
                      ) : (
                        <span className="no-data">None identified</span>
                      )}
                    </div>
                  </div>
                  <div className="tag-group">
                    <h4 className="tag-group-title">✨ Claims</h4>
                    <div className="tags-container">
                      {analysis.declining.claims.length > 0 ? (
                        analysis.declining.claims.map((claim, index) => (
                          <span key={index} className="trend-tag declining">{claim}</span>
                        ))
                      ) : (
                        <span className="no-data">None identified</span>
                      )}
                    </div>
                  </div>
                  <div className="tag-group">
                    <h4 className="tag-group-title">📂 Ingredient Categories</h4>
                    <div className="tags-container">
                      {analysis.declining.ingredientCategories.length > 0 ? (
                        analysis.declining.ingredientCategories.map((category, index) => (
                          <span key={index} className="trend-tag declining">{category}</span>
                        ))
                      ) : (
                        <span className="no-data">None identified</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeFilter === 'insights' && (
                <div className="insights-section">
                  {analysis.insights.length > 0 ? (
                    <div className="insights-grid">
                      {analysis.insights.map((insight, index) => (
                        <div key={index} className="insight-card enhanced">
                          <div className="insight-header">
                            <div className="insight-title-row">
                              <div className="insight-icon">
                                {insight.type === 'ingredient' ? '🧪' : insight.type === 'claim' ? '✨' : '📂'}
                              </div>
                              <h4 className="insight-title">{insight.name}</h4>
                              <span className="insight-type-badge">{insight.type}</span>
                              {insight.credibilityScore && (
                                <div className="credibility-indicator">
                                  <div className={`credibility-dot ${
                                    insight.credibilityScore >= 80 ? 'high' : 
                                    insight.credibilityScore >= 60 ? 'medium' : 'low'
                                  }`}></div>
                                  <span className="credibility-score">{insight.credibilityScore}% credible</span>
                                </div>
                              )}
                            </div>
                            <p className="insight-fact">{insight.supportingFact}</p>
                          </div>

                          {/* Usage Metrics */}
                          {insight.usageMetrics && (
                            <div className="usage-metrics">
                              <h5 className="metrics-title">📊 Usage Analytics</h5>
                              <div className="metrics-grid">
                                <div className="metric-item">
                                  <div className="metric-value search">{insight.usageMetrics.searchVolume?.toLocaleString() || 'N/A'}</div>
                                  <div className="metric-label">Search Volume</div>
                                </div>
                                <div className="metric-item">
                                  <div className="metric-value trending">{insight.usageMetrics.trendingScore || 'N/A'}</div>
                                  <div className="metric-label">Trending Score</div>
                                </div>
                                <div className="metric-item">
                                  <div className="metric-value engagement">{insight.usageMetrics.userEngagement || 'N/A'}%</div>
                                  <div className="metric-label">Engagement</div>
                                </div>
                                <div className="metric-item">
                                  <div className="metric-value mentions">{insight.usageMetrics.recentMentions || 'N/A'}</div>
                                  <div className="metric-label">Recent Mentions</div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Market Data */}
                          {insight.marketData && (
                            <div className="market-data enhanced">
                              <h5 className="market-title">📈 Market Intelligence</h5>
                              <div className="market-stats">
                                {insight.marketData.adoptionRate && (
                                  <div className="market-stat">
                                    <span className="stat-label">Adoption Rate:</span>
                                    <span className="stat-value">{insight.marketData.adoptionRate}</span>
                                  </div>
                                )}
                                {insight.marketData.searchTrends && (
                                  <div className="market-stat">
                                    <span className="stat-label">Search Trends:</span>
                                    <span className="stat-value">{insight.marketData.searchTrends}</span>
                                  </div>
                                )}
                                {insight.marketData.marketGrowth && (
                                  <div className="market-stat">
                                    <span className="stat-label">Market Growth:</span>
                                    <span className="stat-value">{insight.marketData.marketGrowth}</span>
                                  </div>
                                )}
                              </div>
                              {insight.marketData.industryReports && insight.marketData.industryReports.length > 0 && (
                                <div className="industry-reports">
                                  <span className="stat-label">Industry Reports:</span>
                                  <ul className="reports-list">
                                    {insight.marketData.industryReports.map((report, idx) => (
                                      <li key={idx} className="report-item">• {report}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Study Reference */}
                          {insight.studyReference && (
                            <div className="study-reference">
                              <h5 className="reference-title">📚 Primary Reference</h5>
                              <p className="reference-text">{insight.studyReference}</p>
                            </div>
                          )}

                          {/* Supporting Studies */}
                          {insight.supportingStudies && insight.supportingStudies.length > 0 && (
                            <div className="supporting-studies">
                              <h5 className="studies-title">🔬 Supporting Studies</h5>
                              <div className="studies-list">
                                {insight.supportingStudies.map((study, studyIndex) => (
                                  <div key={studyIndex} className="study-item">
                                    <div className="study-header">
                                      <h6 className="study-title">{study.title}</h6>
                                      {study.relevanceScore && (
                                        <span className="relevance-score">{study.relevanceScore}% relevant</span>
                                      )}
                                    </div>
                                    {study.authors && (
                                      <p className="study-meta">
                                        <strong>Authors:</strong> {study.authors}
                                      </p>
                                    )}
                                    <div className="study-details">
                                      {study.journal && <span><strong>Journal:</strong> {study.journal}</span>}
                                      {study.year && <span><strong>Year:</strong> {study.year}</span>}
                                      {study.doi && (
                                        <span>
                                          <strong>DOI:</strong> 
                                          <a href={`https://doi.org/${study.doi}`} target="_blank" rel="noopener noreferrer" 
                                             className="doi-link">
                                            {study.doi}
                                          </a>
                                        </span>
                                      )}
                                    </div>
                                    <p className="study-summary">{study.summary}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="no-insights">
                      <p>No detailed insights available for this analysis.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}