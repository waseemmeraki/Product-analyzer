'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

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
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-purple-950/20 to-black">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(120,119,198,0.3),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,119,198,0.3),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_80%,rgba(120,219,255,0.3),transparent_50%)]"></div>
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>

      {/* Header Section */}
      <div className="relative z-10 text-center py-20 px-6">
        <div className="relative inline-block">
          <h1 className="text-8xl font-black mb-8 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-pulse">
            NEXUS ANALYZER
          </h1>
          <div className="absolute -inset-4 bg-gradient-to-r from-cyan-400/20 via-purple-400/20 to-pink-400/20 blur-xl rounded-full"></div>
        </div>
        <p className="text-2xl text-gray-300 max-w-3xl mx-auto mb-12 font-light tracking-wide">
          <span className="text-cyan-400">QUANTUM-POWERED</span> ingredient intelligence and
          <span className="text-purple-400"> NEURAL</span> trend analysis
        </p>
        <Link href="/">
          <Button className="mb-12 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-bold py-3 px-8 rounded-full border border-cyan-400/50 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all duration-300">
            ← RETURN TO BASE
          </Button>
        </Link>
      </div>

      <div className="relative z-10 container mx-auto max-w-7xl px-6">
        {/* Error Display */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-300 px-6 py-4 rounded-xl mb-8 backdrop-blur-sm shadow-[0_0_20px_rgba(239,68,68,0.2)]">
            <div className="flex items-center space-x-2">
              <span className="text-red-400">⚠</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Control Panel */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Brand Selection */}
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-300"></div>
            <Card className="relative bg-black/40 border-cyan-500/30 backdrop-blur-xl rounded-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent"></div>
              <CardHeader className="relative">
                <CardTitle className="text-cyan-300 font-bold tracking-wide flex items-center space-x-2">
                  <span className="text-cyan-400">🏢</span>
                  <span>BRAND MATRIX</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="w-full p-4 bg-black/60 border border-cyan-500/30 rounded-xl focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-cyan-100 backdrop-blur-sm transition-all duration-300 hover:border-cyan-400/50"
                >
                  <option value="">Initialize brand selection...</option>
                  {brands.map((brand) => (
                    <option key={brand} value={brand} className="bg-black text-cyan-100">
                      {brand}
                    </option>
                  ))}
                </select>
                <div className="text-xs text-cyan-400/70 mt-2 font-mono">[{brands.length}] BRANDS DETECTED</div>
              </CardContent>
            </Card>
          </div>

          {/* Category Selection */}
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-300"></div>
            <Card className="relative bg-black/40 border-purple-500/30 backdrop-blur-xl rounded-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent"></div>
              <CardHeader className="relative">
                <CardTitle className="text-purple-300 font-bold tracking-wide flex items-center space-x-2">
                  <span className="text-purple-400">📊</span>
                  <span>CATEGORY GRID</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  disabled={!selectedBrand}
                  className="w-full p-4 bg-black/60 border border-purple-500/30 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 text-purple-100 backdrop-blur-sm transition-all duration-300 hover:border-purple-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Select category protocol...</option>
                  {categories.map((category) => (
                    <option key={category} value={category} className="bg-black text-purple-100">
                      {category}
                    </option>
                  ))}
                </select>
                <div className="text-xs text-purple-400/70 mt-2 font-mono">[{categories.length}] CATEGORIES MAPPED</div>
              </CardContent>
            </Card>
          </div>

          {/* Product Selection */}
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 to-orange-500 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-300"></div>
            <Card className="relative bg-black/40 border-pink-500/30 backdrop-blur-xl rounded-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent"></div>
              <CardHeader className="relative">
                <CardTitle className="text-pink-300 font-bold tracking-wide flex items-center space-x-2">
                  <span className="text-pink-400">🎯</span>
                  <span>PRODUCT SCAN</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <select
                  value={selectedProduct}
                  onChange={(e) => {
                    setSelectedProduct(e.target.value);
                    if (e.target.value && !selectedProducts.includes(e.target.value)) {
                      setSelectedProducts([...selectedProducts, e.target.value]);
                    }
                  }}
                  disabled={!selectedCategory || products.length === 0}
                  className="w-full p-4 bg-black/60 border border-pink-500/30 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-pink-400 text-pink-100 backdrop-blur-sm transition-all duration-300 hover:border-pink-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Acquire target product...</option>
                  {products.map((product) => (
                    <option key={product.Id} value={product.Id} className="bg-black text-pink-100">
                      {product.Name}
                    </option>
                  ))}
                </select>
                <div className="text-xs text-pink-400/70 mt-2 font-mono">[{products.length}] PRODUCTS INDEXED</div>
              </CardContent>
            </Card>
          </div>

          {/* Analysis Control */}
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-300"></div>
            <Card className="relative bg-black/40 border-emerald-500/30 backdrop-blur-xl rounded-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent"></div>
              <CardHeader className="relative">
                <CardTitle className="text-emerald-300 font-bold tracking-wide flex items-center space-x-2">
                  <span className="text-emerald-400">⚡</span>
                  <span>NEURAL ENGINE</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <Button
                  onClick={analyzeProducts}
                  disabled={selectedProducts.length === 0 || loading}
                  className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-4 px-6 rounded-xl border border-emerald-400/50 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all duration-300 disabled:shadow-none"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>PROCESSING...</span>
                    </div>
                  ) : (
                    `ANALYZE [${selectedProducts.length}]`
                  )}
                </Button>
                <div className="text-xs text-emerald-400/70 mt-2 font-mono">
                  [{selectedProducts.length}] TARGETS LOCKED
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Selected Products Display */}
        {selectedProducts.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Selected Products Panel */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500 to-purple-500 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-300"></div>
              <Card className="relative bg-black/40 border-violet-500/30 backdrop-blur-xl rounded-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent"></div>
                <CardHeader className="relative">
                  <CardTitle className="text-violet-300 font-bold tracking-wide flex items-center space-x-2">
                    <span className="text-violet-400">🎯</span>
                    <span>ACTIVE TARGETS [{selectedProducts.length}]</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
                    {selectedProducts.map((productId) => {
                      const product = products.find((p) => p.Id === productId)
                      return product ? (
                        <div key={productId} className="group/item relative">
                          <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-xl blur opacity-0 group-hover/item:opacity-100 transition duration-300"></div>
                          <div className="relative flex items-center justify-between bg-black/60 rounded-xl p-4 border border-violet-500/20 backdrop-blur-sm">
                            <div className="flex-1">
                              <div className="font-bold text-violet-100 mb-1">{product.Name}</div>
                              <div className="text-xs text-violet-300/70 font-mono flex items-center space-x-4">
                                <span>⭐ {product.Rating}/5</span>
                                <span>📊 {product.ReviewCount} reviews</span>
                              </div>
                            </div>
                            <Button
                              onClick={() => setSelectedProducts(selectedProducts.filter((id) => id !== productId))}
                              className="bg-red-500/20 hover:bg-red-500/40 text-red-300 border border-red-500/30 hover:border-red-400 rounded-lg px-3 py-1 text-sm transition-all duration-300"
                            >
                              REMOVE
                            </Button>
                          </div>
                        </div>
                      ) : null
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Control Center */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-300"></div>
              <Card className="relative bg-black/40 border-cyan-500/30 backdrop-blur-xl rounded-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent"></div>
                <CardHeader className="relative">
                  <CardTitle className="text-cyan-300 font-bold tracking-wide flex items-center space-x-2">
                    <span className="text-cyan-400">🎮</span>
                    <span>COMMAND CENTER</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative space-y-4">
                  <Button
                    onClick={() => setSelectedProducts([])}
                    className="w-full bg-gradient-to-r from-orange-500/20 to-red-500/20 hover:from-orange-500/40 hover:to-red-500/40 text-orange-300 border border-orange-500/30 hover:border-orange-400 font-bold py-3 px-6 rounded-xl transition-all duration-300"
                    disabled={selectedProducts.length === 0}
                  >
                    🗑️ PURGE ALL TARGETS
                  </Button>
                  <Button
                    onClick={analyzeProducts}
                    disabled={selectedProducts.length === 0 || loading}
                    className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-bold py-4 px-6 rounded-xl border border-emerald-400/50 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all duration-300"
                  >
                    {loading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>NEURAL PROCESSING...</span>
                      </div>
                    ) : (
                      `🚀 INITIATE ANALYSIS [${selectedProducts.length}]`
                    )}
                  </Button>
                  {analysis && (
                    <Button
                      onClick={() => setShowReportModal(true)}
                      className="w-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/40 hover:to-pink-500/40 text-purple-300 border border-purple-500/30 hover:border-purple-400 font-bold py-3 px-6 rounded-xl transition-all duration-300"
                    >
                      📊 ACCESS LAST REPORT
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Analysis Report Modal */}
        {showReportModal && analysis && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden border border-purple-500/30">
              {/* Report Header */}
              <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-600 p-6">
                <Button
                  onClick={() => setShowReportModal(false)}
                  variant="ghost"
                  size="sm"
                  className="absolute top-4 right-4 text-white hover:bg-white/20"
                >
                  ✕
                </Button>
                <h1 className="text-3xl font-bold text-white mb-2">📊 Product Analysis Report</h1>
                <p className="text-blue-100">AI-powered ingredient intelligence and market trends</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <div className="bg-white/20 rounded-full px-3 py-1 text-sm text-white">
                    📊 {selectedProducts.length} Products Analyzed
                  </div>
                  <div className="bg-white/20 rounded-full px-3 py-1 text-sm text-white">
                    📅 Generated {new Date().toLocaleDateString()}
                  </div>
                  <div className="bg-white/20 rounded-full px-3 py-1 text-sm text-white">
                    ⭐ {selectedBrand} - {selectedCategory}
                  </div>
                </div>
              </div>

              {/* Report Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-xl p-4">
                    <h3 className="text-lg font-semibold text-blue-300 mb-2">📈 Trending</h3>
                    <div className="text-2xl font-bold text-white">
                      {analysis.trending.ingredients.length + analysis.trending.claims.length + analysis.trending.ingredientCategories.length}
                    </div>
                    <div className="text-sm text-blue-200">Active trends identified</div>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border border-emerald-500/30 rounded-xl p-4">
                    <h3 className="text-lg font-semibold text-emerald-300 mb-2">🚀 Emerging</h3>
                    <div className="text-2xl font-bold text-white">
                      {analysis.emerging.ingredients.length + analysis.emerging.claims.length + analysis.emerging.ingredientCategories.length}
                    </div>
                    <div className="text-sm text-emerald-200">New opportunities</div>
                  </div>
                  <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 border border-red-500/30 rounded-xl p-4">
                    <h3 className="text-lg font-semibold text-red-300 mb-2">📉 Declining</h3>
                    <div className="text-2xl font-bold text-white">
                      {analysis.declining.ingredients.length + analysis.declining.claims.length + analysis.declining.ingredientCategories.length}
                    </div>
                    <div className="text-sm text-red-200">Fading trends</div>
                  </div>
                </div>

                {/* Detailed Analysis */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  {/* Trending Section */}
                  <div className="bg-white/5 border border-blue-500/20 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-blue-300 mb-4 flex items-center">
                      📈 Trending Elements
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-blue-200 mb-2">🧪 Ingredients</h4>
                        <p className="text-blue-200 text-sm bg-blue-500/10 p-3 rounded-lg">
                          {analysis.trending.ingredients.length > 0 
                            ? analysis.trending.ingredients.join(', ')
                            : 'None identified'
                          }
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium text-green-200 mb-2">✨ Claims</h4>
                        <p className="text-green-200 text-sm bg-green-500/10 p-3 rounded-lg">
                          {analysis.trending.claims.length > 0 
                            ? analysis.trending.claims.join(', ')
                            : 'None identified'
                          }
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium text-purple-200 mb-2">📂 Categories</h4>
                        <p className="text-purple-200 text-sm bg-purple-500/10 p-3 rounded-lg">
                          {analysis.trending.ingredientCategories.length > 0 
                            ? analysis.trending.ingredientCategories.join(', ')
                            : 'None identified'
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Emerging Section */}
                  <div className="bg-white/5 border border-emerald-500/20 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-emerald-300 mb-4 flex items-center">
                      🚀 Emerging Opportunities
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-emerald-200 mb-2">🧪 Ingredients</h4>
                        <p className="text-emerald-200 text-sm bg-emerald-500/10 p-3 rounded-lg">
                          {analysis.emerging.ingredients.length > 0 
                            ? analysis.emerging.ingredients.join(', ')
                            : 'None identified'
                          }
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium text-green-200 mb-2">✨ Claims</h4>
                        <p className="text-green-200 text-sm bg-green-500/10 p-3 rounded-lg">
                          {analysis.emerging.claims.length > 0 
                            ? analysis.emerging.claims.join(', ')
                            : 'None identified'
                          }
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium text-purple-200 mb-2">📂 Categories</h4>
                        <p className="text-purple-200 text-sm bg-purple-500/10 p-3 rounded-lg">
                          {analysis.emerging.ingredientCategories.length > 0 
                            ? analysis.emerging.ingredientCategories.join(', ')
                            : 'None identified'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Key Insights */}
                {analysis.insights.length > 0 && (
                  <div className="bg-white/5 border border-purple-500/20 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-purple-300 mb-4 flex items-center">
                      💡 Key Insights
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {analysis.insights.map((insight, index) => (
                        <div key={index} className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg p-4">
                          <div className="flex items-start space-x-3">
                            <div className="bg-purple-500/20 rounded-full p-2 mt-1">
                              <span className="text-purple-300 text-sm font-bold">
                                {insight.type === 'ingredient' ? '🧪' : insight.type === 'claim' ? '✨' : '📂'}
                              </span>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-white mb-1">{insight.name}</h4>
                              <p className="text-sm text-gray-300 mb-2">{insight.supportingFact}</p>
                              {insight.studyReference && (
                                <p className="text-xs text-blue-300 italic">
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

                {/* Declining Trends */}
                {(analysis.declining.ingredients.length > 0 || analysis.declining.claims.length > 0) && (
                  <div className="mt-6 bg-white/5 border border-red-500/20 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-red-300 mb-4 flex items-center">
                      📉 Declining Trends
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-red-200 mb-2">🧪 Ingredients</h4>
                        <p className="text-red-200 text-sm bg-red-500/10 p-3 rounded-lg">
                          {analysis.declining.ingredients.length > 0 
                            ? analysis.declining.ingredients.join(', ')
                            : 'None identified'
                          }
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium text-orange-200 mb-2">✨ Claims</h4>
                        <p className="text-orange-200 text-sm bg-orange-500/10 p-3 rounded-lg">
                          {analysis.declining.claims.length > 0 
                            ? analysis.declining.claims.join(', ')
                            : 'None identified'
                          }
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium text-yellow-200 mb-2">📂 Categories</h4>
                        <p className="text-yellow-200 text-sm bg-yellow-500/10 p-3 rounded-lg">
                          {analysis.declining.ingredientCategories.length > 0 
                            ? analysis.declining.ingredientCategories.join(', ')
                            : 'None identified'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Report Footer */}
              <div className="bg-white/5 border-t border-white/10 p-4 flex justify-between items-center">
                <div className="text-sm text-gray-400">
                  Powered by Product Analytics AI
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowReportModal(false)}
                    variant="outline"
                    className="text-gray-300 border-gray-600 hover:bg-gray-600"
                  >
                    Close Report
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #8b5cf6, #06b6d4);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #7c3aed, #0891b2);
        }
      `}</style>
    </div>
  );
}