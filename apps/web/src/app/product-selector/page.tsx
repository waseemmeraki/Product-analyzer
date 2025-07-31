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
  }>;
}

export default function ProductSelectorPage() {
  const [brands, setBrands] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showReportModal, setShowReportModal] = useState(false);

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
      setSelectedProduct('');
      setAnalysis(null);
    }
  }, [selectedBrand]);

  // Fetch products when category changes
  useEffect(() => {
    if (selectedBrand && selectedCategory) {
      fetchProducts(selectedBrand, selectedCategory);
      setSelectedProducts([]);
      setSelectedProduct('');
      setAnalysis(null);
    }
  }, [selectedCategory]);

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
        setShowReportModal(true);
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

          <div className="control-card">
            <h3 className="card-title">
              🎯 Product Selection
            </h3>
            <select
              value={selectedProduct}
              onChange={(e) => {
                setSelectedProduct(e.target.value);
                if (e.target.value && !selectedProducts.includes(e.target.value)) {
                  setSelectedProducts([...selectedProducts, e.target.value]);
                }
              }}
              disabled={!selectedCategory || products.length === 0}
              className="select-input"
            >
              <option value="">Select a product...</option>
              {products.map((product) => (
                <option key={product.Id} value={product.Id}>
                  {product.Name}
                </option>
              ))}
            </select>
            <div className="count-badge">{products.length} products available</div>
          </div>

          <div className="control-card">
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
          </div>
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
                {analysis && (
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="view-report-button"
                  >
                    📊 View Last Report
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {showReportModal && analysis && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <button
                  onClick={() => setShowReportModal(false)}
                  className="modal-close"
                >
                  ✕
                </button>
                <h1 className="modal-title">📊 Product Analysis Report</h1>
                <p className="modal-subtitle">AI-powered ingredient intelligence and market trends</p>
                <div className="modal-tags">
                  <div className="modal-tag">
                    📊 {selectedProducts.length} Products Analyzed
                  </div>
                  <div className="modal-tag">
                    📅 Generated {new Date().toLocaleDateString()}
                  </div>
                  <div className="modal-tag">
                    ⭐ {selectedBrand} - {selectedCategory}
                  </div>
                </div>
              </div>

              <div className="modal-body">
                <div className="summary-grid">
                  <div className="summary-card">
                    <h3 className="section-title">📈 Trending</h3>
                    <div className="summary-value">
                      {analysis.trending.ingredients.length + analysis.trending.claims.length + analysis.trending.ingredientCategories.length}
                    </div>
                    <div className="summary-label">Active trends identified</div>
                  </div>
                  <div className="summary-card">
                    <h3 className="section-title">🚀 Emerging</h3>
                    <div className="summary-value">
                      {analysis.emerging.ingredients.length + analysis.emerging.claims.length + analysis.emerging.ingredientCategories.length}
                    </div>
                    <div className="summary-label">New opportunities</div>
                  </div>
                  <div className="summary-card">
                    <h3 className="section-title">📉 Declining</h3>
                    <div className="summary-value">
                      {analysis.declining.ingredients.length + analysis.declining.claims.length + analysis.declining.ingredientCategories.length}
                    </div>
                    <div className="summary-label">Fading trends</div>
                  </div>
                </div>

                <div className="analysis-grid">
                  <div className="analysis-section">
                    <h3 className="section-title">
                      📈 Trending Elements
                    </h3>
                    <div className="subsection">
                      <h4 className="subsection-title">🧪 Ingredients</h4>
                      <div className="subsection-content">
                        {analysis.trending.ingredients.length > 0 
                          ? analysis.trending.ingredients.join(', ')
                          : 'None identified'
                        }
                      </div>
                    </div>
                    <div className="subsection">
                      <h4 className="subsection-title">✨ Claims</h4>
                      <div className="subsection-content">
                        {analysis.trending.claims.length > 0 
                          ? analysis.trending.claims.join(', ')
                          : 'None identified'
                        }
                      </div>
                    </div>
                    <div className="subsection">
                      <h4 className="subsection-title">📂 Ingredients Categories</h4>
                      <div className="subsection-content">
                        {analysis.trending.ingredientCategories.length > 0 
                          ? analysis.trending.ingredientCategories.join(', ')
                          : 'None identified'
                        }
                      </div>
                    </div>
                  </div>

                  <div className="analysis-section">
                    <h3 className="section-title">
                      🚀 Emerging Opportunities
                    </h3>
                    <div className="subsection">
                      <h4 className="subsection-title">🧪 Ingredients</h4>
                      <div className="subsection-content">
                        {analysis.emerging.ingredients.length > 0 
                          ? analysis.emerging.ingredients.join(', ')
                          : 'None identified'
                        }
                      </div>
                    </div>
                    <div className="subsection">
                      <h4 className="subsection-title">✨ Claims</h4>
                      <div className="subsection-content">
                        {analysis.emerging.claims.length > 0 
                          ? analysis.emerging.claims.join(', ')
                          : 'None identified'
                        }
                      </div>
                    </div>
                    <div className="subsection">
                      <h4 className="subsection-title">📂 Ingredients Categories</h4>
                      <div className="subsection-content">
                        {analysis.emerging.ingredientCategories.length > 0 
                          ? analysis.emerging.ingredientCategories.join(', ')
                          : 'None identified'
                        }
                      </div>
                    </div>
                  </div>
                </div>

                {(analysis.declining.ingredients.length > 0 || analysis.declining.claims.length > 0) && (
                  <div className="analysis-section">
                    <h3 className="section-title">
                      📉 Declining Trends
                    </h3>
                    <div className="subsection">
                      <h4 className="subsection-title">🧪 Ingredients</h4>
                      <div className="subsection-content">
                        {analysis.declining.ingredients.length > 0 
                          ? analysis.declining.ingredients.join(', ')
                          : 'None identified'
                        }
                      </div>
                    </div>
                    <div className="subsection">
                      <h4 className="subsection-title">✨ Claims</h4>
                      <div className="subsection-content">
                        {analysis.declining.claims.length > 0 
                          ? analysis.declining.claims.join(', ')
                          : 'None identified'
                        }
                      </div>
                    </div>
                    <div className="subsection">
                      <h4 className="subsection-title">📂 Ingredients Categories</h4>
                      <div className="subsection-content">
                        {analysis.declining.ingredientCategories.length > 0 
                          ? analysis.declining.ingredientCategories.join(', ')
                          : 'None identified'
                        }
                      </div>
                    </div>
                  </div>
                )}

                {analysis.insights.length > 0 && (
                  <div className="analysis-section">
                    <h3 className="section-title">
                      💡 Key Insights
                    </h3>
                    <div className="insights-grid">
                      {analysis.insights.map((insight, index) => (
                        <div key={index} className="insight-card">
                          <div className="insight-header">
                            <div className="insight-icon">
                              {insight.type === 'ingredient' ? '🧪' : insight.type === 'claim' ? '✨' : '📂'}
                            </div>
                            <div>
                              <h4 className="insight-title">{insight.name}</h4>
                              <p className="insight-fact">{insight.supportingFact}</p>
                              {insight.studyReference && (
                                <p className="insight-reference">
                                  📚 {insight.studyReference}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <div className="modal-footer-text">
                  Powered by Product Analytics AI
                </div>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="close-modal-button"
                >
                  Close Report
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}