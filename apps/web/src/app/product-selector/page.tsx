"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Star, Globe, Tag, Package, BarChart3 } from "lucide-react"
import Image from "next/image"
import AnalysisReport from "@/components/analysis-report"
import rectangleImage from "@/assets/images/Rectangle 2.png"
import logoSvg from "@/assets/images/logo.svg"

interface Product {
  Id: string
  Name: string
  Brand: string
  Category: string
  Ingredients: string
  IngredientCategories: string
  Claims: string
  Rating: number
  ReviewCount: number
  selected?: boolean
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

export default function CosmicInsight() {
  const [websiteUrl, setWebsiteUrl] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedProductCount, setSelectedProductCount] = useState("10")
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [scrapingLoading, setScrapingLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [scrapingResult, setScrapingResult] = useState<{
    scrapedCount: number;
    newProductsAdded: number;
    duplicatesSkipped: number;
  } | null>(null)

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'

  // Fetch categories for Ulta on component mount
  useEffect(() => {
    fetchCategories()
  }, [])

  // Fetch products when category changes
  useEffect(() => {
    if (selectedCategory) {
      fetchProducts(selectedCategory)
    }
  }, [selectedCategory])

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/products/brands/Ulta/categories`)
      const data = await response.json()
      if (data.success) {
        setCategories(data.data)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      setError('Failed to fetch categories')
    }
  }

  const fetchProducts = async (category: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/products/brands/Ulta/categories/${encodeURIComponent(category)}/products`)
      const data = await response.json()
      if (data.success) {
        const productsWithSelection = data.data.map((product: Product) => ({
          ...product,
          selected: false
        }))
        setProducts(productsWithSelection)
      } else {
        setError(data.message || 'Failed to fetch products')
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      setError('Failed to fetch products')
    }
  }

  const scrapeUltaProducts = async () => {
    if (!websiteUrl.trim()) {
      setError('Please enter a valid Ulta URL')
      return
    }

    // Basic URL validation
    try {
      const url = new URL(websiteUrl)
      if (!url.hostname.includes('ulta.com')) {
        setError('Please enter a valid Ulta.com URL')
        return
      }
    } catch {
      setError('Please enter a valid URL')
      return
    }

    setScrapingLoading(true)
    setError('')
    setScrapingResult(null)

    try {
      const response = await fetch(`${API_BASE_URL}/api/scraper/ulta/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          categoryUrl: websiteUrl,
          limit: parseInt(selectedProductCount)
        })
      })

      const data = await response.json()
      if (data.success) {
        setScrapingResult({
          scrapedCount: data.meta.scrapedCount,
          newProductsAdded: data.meta.newProductsAdded,
          duplicatesSkipped: data.meta.duplicatesSkipped
        })
        
        // Refresh categories to show new data
        await fetchCategories()
        
        // Clear form
        setWebsiteUrl('')
        setSelectedProductCount('10')
        
        // Show success message
        setTimeout(() => setScrapingResult(null), 10000)
      } else {
        setError(data.error || 'Scraping failed')
      }
    } catch (error) {
      console.error('Error scraping products:', error)
      setError('Failed to scrape products')
    } finally {
      setScrapingLoading(false)
    }
  }

  const selectedCount = products.filter((p) => p.selected).length
  const totalProducts = products.length

  const handleProductToggle = (productId: string) => {
    setProducts(products.map((p) => (p.Id === productId ? { ...p, selected: !p.selected } : p)))
  }

  const handleSelectAll = (checked: boolean) => {
    setProducts(products.map((p) => ({ ...p, selected: checked })))
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star 
            key={star} 
            className={`w-3 h-3 ${star <= rating ? "text-gray-300" : "text-gray-300"}`}
            style={star <= rating ? { fill: '#13A794', color: '#13A794' } : {}}
          />
        ))}
        <span className="text-sm font-medium ml-1">{rating}</span>
        <span className="text-sm text-gray-500">({products.find(p => p.selected)?.ReviewCount || 0})</span>
      </div>
    )
  }

  const handleAnalyze = async () => {
    const selectedProducts = products.filter(p => p.selected)
    if (selectedProducts.length === 0) {
      setError('Please select at least one product')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productIds: selectedProducts.map(p => p.Id)
        })
      })

      const data = await response.json()
      if (data.success) {
        setAnalysis(data.data.analysis)
        setShowAnalysis(true)
      } else {
        setError(data.message || 'Analysis failed')
      }
    } catch (error) {
      console.error('Error analyzing products:', error)
      setError('Failed to analyze products')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#E5ECF2' }}>
      {/* Logo Section */}
      <div className="text-center py-12">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center justify-center">
            <Image
              src={logoSvg}
              alt="Logo"
              width={230}
              height={78.59}
              className="object-contain"
            />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 pb-8">
        <div className="space-y-8">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Success Message */}
          {scrapingResult && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              ✅ Successfully scraped {scrapingResult.scrapedCount} products! 
              Added {scrapingResult.newProductsAdded} new products, 
              skipped {scrapingResult.duplicatesSkipped} duplicates.
            </div>
          )}

          {/* Enter Website Section */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-5 h-5 text-teal-500" />
                <h2 className="text-lg font-semibold text-gray-900">Enter Website to Scrap Data</h2>
              </div>
              <p className="text-sm text-gray-600 mb-4">Enter the website URL to scrape products from and specify how many products you want to extract.</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <Label htmlFor="website-url" className="text-sm font-medium text-gray-700">
                    Website URL
                  </Label>
                  <Input
                    id="website-url"
                    placeholder="https://www.ulta.com/shop/hair/shampoo..."
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    className="mt-1 bg-white border-0"
                    disabled={scrapingLoading}
                  />
                </div>
                <div>
                  <Label htmlFor="product-count" className="text-sm font-medium text-gray-700 mb-2 block">No. of Products</Label>
                  <Input
                    id="product-count"
                    type="number"
                    placeholder="10"
                    value={selectedProductCount}
                    onChange={(e) => setSelectedProductCount(e.target.value)}
                    min="1"
                    max="50"
                    disabled={scrapingLoading}
                    className="w-full bg-white border-0"
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={scrapeUltaProducts}
                    disabled={!websiteUrl.trim() || scrapingLoading}
                    className="bg-gray-900 hover:bg-gray-800 text-white px-6 w-full"
                  >
                    {scrapingLoading ? 'Scraping...' : 'Scrap'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Select Category Section */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <Tag className="w-5 h-5 text-teal-500" />
                <h2 className="text-lg font-semibold text-gray-900">Select Category</h2>
              </div>
              <p className="text-sm text-gray-600 mb-4">Choose a product category from the dropdown menu to filter and organize your results.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">{categories.length} Categories Available</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="bg-white border-0">
                      <SelectValue placeholder="Select a category..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Step 1 - Select Available Products */}
            <Card 
              className={`${!showAnalysis ? "text-white" : "bg-gray-200"} cursor-pointer hover:opacity-80 transition-opacity`}
              style={!showAnalysis ? { backgroundColor: '#323232' } : {}}
              onClick={() => setShowAnalysis(false)}
            >
              <CardContent className="p-6">
                <div className={`text-sm font-medium mb-3 ${!showAnalysis ? "text-white" : "text-gray-700"}`}>1/2</div>
                <div className="flex items-center gap-2 mb-3">
                  <Package className={`w-5 h-5 ${!showAnalysis ? "text-teal-400" : "text-gray-500"}`} />
                  <h3 className={`text-lg font-semibold ${!showAnalysis ? "text-white" : "text-gray-700"}`}>
                    Select Available Products
                  </h3>
                </div>
                <p className={`text-sm ${!showAnalysis ? "text-gray-300" : "text-gray-600"}`}>
                  Browse the list below and select the products you want to analyze.
                </p>
              </CardContent>
            </Card>

            {/* Step 2 - Analysis Report */}
            <Card 
              className={`${showAnalysis ? "text-white" : "bg-gray-200"} cursor-pointer hover:opacity-80 transition-opacity`}
              style={showAnalysis ? { backgroundColor: '#323232' } : {}}
              onClick={() => analysis && setShowAnalysis(true)}
            >
              <CardContent className="p-6">
                <div className={`text-sm font-medium mb-3 ${showAnalysis ? "text-white" : "text-gray-700"}`}>2/2</div>
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className={`w-5 h-5 ${showAnalysis ? "text-teal-400" : "text-teal-500"}`} />
                  <h3 className={`text-lg font-semibold ${showAnalysis ? "text-white" : "text-gray-700"}`}>
                    Analysis Report
                  </h3>
                </div>
                <p className={`text-sm ${showAnalysis ? "text-gray-300" : "text-gray-600"}`}>
                Explore trends, claims, and ingredients based on the products you selected.                </p>
              </CardContent>
            </Card>
          </div>

          {/* Product Selection or Analysis Report */}
          {!showAnalysis ? (
            selectedCategory && products.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Available Products</h3>

                    <div className="flex items-center gap-2 mb-4">
                      <Checkbox
                        id="select-all"
                        checked={selectedCount === products.length && products.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                      <Label htmlFor="select-all" className="font-medium">
                        Select All ({totalProducts})
                      </Label>
                    </div>
                  </div>

                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {products.map((product) => (
                      <div key={product.Id} className="flex items-center gap-4 p-3 border rounded hover:bg-gray-50">
                        <Checkbox 
                          checked={product.selected || false} 
                          onCheckedChange={() => handleProductToggle(product.Id)} 
                        />
                        <Image
                          src={rectangleImage}
                          alt={product.Name}
                          width={60}
                          height={60}
                          className="rounded object-cover bg-gray-100"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-1">{product.Name}</h4>
                          {renderStars(product.Rating)}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between mt-6 pt-4 border-t">
                    <span className="text-sm text-gray-600">
                      {selectedCount} of {totalProducts} Selected
                    </span>
                    <Button 
                      onClick={handleAnalyze} 
                      disabled={selectedCount === 0 || loading}
                      className="bg-gray-900 hover:bg-gray-800 text-white px-8"
                    >
                      {loading ? 'Analyzing...' : 'Analyze →'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          ) : (
            analysis && <AnalysisReport analysis={analysis} selectedCategory={selectedCategory} />
          )}
        </div>
      </div>
    </div>
  )
}