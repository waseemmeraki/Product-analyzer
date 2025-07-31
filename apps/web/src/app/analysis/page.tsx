'use client';

import { useState, useEffect } from 'react';

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

export default function AnalysisPage() {
  const [brands, setBrands] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

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
      const response = await fetch(`${API_BASE_URL}/api/products/brands/${encodeURIComponent(brand)}/categories/${encodeURIComponent(category)}/products`);
      const data = await response.json();
      if (data.success) {
        setProducts(data.data);
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

  const renderAnalysisSection = (title: string, data: { ingredients: string[]; claims: string[]; ingredientCategories: string[] }) => (
    <div className="mb-6 p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-3 text-gray-800">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <h4 className="font-medium text-sm mb-2 text-gray-600">Ingredients</h4>
          <ul className="text-sm space-y-1">
            {data.ingredients.map((item, index) => (
              <li key={index} className="bg-blue-50 px-2 py-1 rounded">{item}</li>
            ))}
            {data.ingredients.length === 0 && <li className="text-gray-400 italic">None found</li>}
          </ul>
        </div>
        <div>
          <h4 className="font-medium text-sm mb-2 text-gray-600">Claims</h4>
          <ul className="text-sm space-y-1">
            {data.claims.map((item, index) => (
              <li key={index} className="bg-green-50 px-2 py-1 rounded">{item}</li>
            ))}
            {data.claims.length === 0 && <li className="text-gray-400 italic">None found</li>}
          </ul>
        </div>
        <div>
          <h4 className="font-medium text-sm mb-2 text-gray-600">Ingredient Categories</h4>
          <ul className="text-sm space-y-1">
            {data.ingredientCategories.map((item, index) => (
              <li key={index} className="bg-purple-50 px-2 py-1 rounded">{item}</li>
            ))}
            {data.ingredientCategories.length === 0 && <li className="text-gray-400 italic">None found</li>}
          </ul>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Product Analysis</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Brand Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Brand
          </label>
          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Choose a brand...</option>
            {brands.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>
        </div>

        {/* Category Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Category
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            disabled={!selectedBrand}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
          >
            <option value="">Choose a category...</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* Analyze Button */}
        <div className="flex items-end">
          <button
            onClick={analyzeProducts}
            disabled={selectedProducts.length === 0 || loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Analyzing...' : 'Analyze Products'}
          </button>
        </div>
      </div>

      {/* Product Selection */}
      {products.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Select Products ({selectedProducts.length} selected)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
            {products.map((product) => (
              <div key={product.Id} className="border rounded-lg p-3 hover:bg-gray-50">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedProducts.includes(product.Id)}
                    onChange={(e) => handleProductSelection(product.Id, e.target.checked)}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{product.Name}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Rating: {product.Rating}/5 ({product.ReviewCount} reviews)
                    </div>
                  </div>
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analysis Results */}
      {analysis && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Analysis Results</h2>
          
          {renderAnalysisSection('Trending', analysis.trending)}
          {renderAnalysisSection('Emerging', analysis.emerging)}
          {renderAnalysisSection('Declining', analysis.declining)}

          {/* Insights */}
          {analysis.insights.length > 0 && (
            <div className="mb-6 p-4 border rounded-lg">
              <h3 className="text-lg font-semibold mb-3 text-gray-800">Key Insights</h3>
              <div className="space-y-3">
                {analysis.insights.map((insight, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-sm">
                          {insight.name}
                          <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                            {insight.type}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{insight.supportingFact}</p>
                        {insight.studyReference && (
                          <p className="text-xs text-blue-600 mt-1 italic">
                            Reference: {insight.studyReference}
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
      )}
    </div>
  );
}