"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, Heart, TrendingDown, Lightbulb, Calendar, Building2, Layers, Download } from "lucide-react"

type TabType = "trending" | "emerging" | "declining" | "insights"

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

interface Props {
  analysis: AnalysisResult;
  selectedCategory: string;
  selectedProductIds?: string[];
}

export default function AnalysisReport({ analysis, selectedCategory, selectedProductIds = [] }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>("trending")
  const [isExporting, setIsExporting] = useState(false)

  const tabs = [
    { 
      id: "trending" as TabType, 
      label: "Trending", 
      count: analysis.trending.ingredients.length + analysis.trending.claims.length + analysis.trending.ingredientCategories.length, 
      icon: TrendingUp 
    },
    { 
      id: "emerging" as TabType, 
      label: "Emerging", 
      count: analysis.emerging.ingredients.length + analysis.emerging.claims.length + analysis.emerging.ingredientCategories.length, 
      icon: Heart 
    },
    { 
      id: "declining" as TabType, 
      label: "Declining", 
      count: analysis.declining.ingredients.length + analysis.declining.claims.length + analysis.declining.ingredientCategories.length, 
      icon: TrendingDown 
    },
    { 
      id: "insights" as TabType, 
      label: "Insights", 
      count: analysis.insights.length, 
      icon: Lightbulb 
    },
  ]

  const getButtonColor = (index: number) => {
    const colors = [
      "border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-700",
      "border-red-200 text-red-600 bg-red-50 hover:bg-red-100 hover:text-red-700",
      "border-teal-200 text-teal-600 bg-teal-50 hover:bg-teal-100 hover:text-teal-700",
      "border-purple-200 text-purple-600 bg-purple-50 hover:bg-purple-100 hover:text-purple-700",
      "border-green-200 text-green-600 bg-green-50 hover:bg-green-100 hover:text-green-700",
      "border-orange-200 text-orange-600 bg-orange-50 hover:bg-orange-100 hover:text-orange-700",
      "border-pink-200 text-pink-600 bg-pink-50 hover:bg-pink-100 hover:text-pink-700",
      "border-indigo-200 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-700",
    ];
    return colors[index % colors.length];
  }

  const renderTrendingContent = () => {
    const currentData = analysis[activeTab as keyof Omit<AnalysisResult, 'insights'>];
    
    return (
      <div className="space-y-8">
        {/* Ingredients Section */}
        {currentData.ingredients.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-teal-500">🧪</span>
              <h3 className="font-semibold text-gray-900">Ingredients</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {currentData.ingredients.map((ingredient, index) => (
                <Button 
                  key={ingredient} 
                  variant="outline" 
                  className={getButtonColor(index)}
                >
                  {ingredient}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Claims Section */}
        {currentData.claims.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-teal-500">🎯</span>
              <h3 className="font-semibold text-gray-900">Claims</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {currentData.claims.map((claim, index) => (
                <Button 
                  key={claim} 
                  variant="outline" 
                  className={getButtonColor(index + currentData.ingredients.length)}
                >
                  {claim}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Ingredient Categories Section */}
        {currentData.ingredientCategories.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-teal-500">⭐</span>
              <h3 className="font-semibold text-gray-900">Ingredient Categories</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {currentData.ingredientCategories.map((category, index) => (
                <Button 
                  key={category} 
                  variant="outline" 
                  className={getButtonColor(index + currentData.ingredients.length + currentData.claims.length)}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {currentData.ingredients.length === 0 && currentData.claims.length === 0 && currentData.ingredientCategories.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No {activeTab} data available for this analysis.
          </div>
        )}
      </div>
    )
  }

  const renderInsightsContent = () => (
    <div className="space-y-6">
      {analysis.insights.length > 0 ? (
        analysis.insights.map((insight, index) => (
          <div key={index} className="space-y-3">
            {/* Insight Header */}
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-teal-100 text-teal-800 hover:bg-teal-200 px-3 py-1">
                {insight.type === 'ingredient' ? '🧪' : insight.type === 'claim' ? '🎯' : '📂'} {insight.name}
              </Badge>
            </div>
            <p className="text-sm text-gray-600">{insight.supportingFact}</p>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium capitalize">{insight.type}</span>
              {insight.credibilityScore && (
                <span className="text-teal-600 font-medium">{insight.credibilityScore}% Credible</span>
              )}
            </div>

            {/* User Analytics */}
            {insight.usageMetrics && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-gray-800 rounded-full"></span>
                  <h3 className="font-semibold text-gray-900">User Analytics</h3>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 rounded bg-blue-50 border border-blue-100">
                    <div className="text-2xl font-bold text-blue-500">{insight.usageMetrics.searchVolume || 'N/A'}</div>
                    <div className="text-sm text-gray-600">Search Volume</div>
                  </div>
                  <div className="text-center p-4 rounded bg-teal-50 border border-teal-100">
                    <div className="text-2xl font-bold text-teal-500">{insight.usageMetrics.trendingScore || 'N/A'}</div>
                    <div className="text-sm text-gray-600">Trending Score</div>
                  </div>
                  <div className="text-center p-4 rounded bg-purple-50 border border-purple-100">
                    <div className="text-2xl font-bold text-purple-500">{insight.usageMetrics.userEngagement || 'N/A'}%</div>
                    <div className="text-sm text-gray-600">Engagement</div>
                  </div>
                  <div className="text-center p-4 rounded bg-orange-50 border border-orange-100">
                    <div className="text-2xl font-bold text-orange-500">{insight.usageMetrics.recentMentions || 'N/A'}</div>
                    <div className="text-sm text-gray-600">Recent Mentions</div>
                  </div>
                </div>
              </div>
            )}

            {/* Primary Reference */}
            {insight.studyReference && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-gray-800 rounded-full"></span>
                  <h3 className="font-semibold text-gray-900">Primary Reference</h3>
                </div>
                <p className="text-sm text-gray-600 italic">{insight.studyReference}</p>
              </div>
            )}

            {/* Supporting Studies */}
            {insight.supportingStudies && insight.supportingStudies.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-gray-800 rounded-full"></span>
                  <h3 className="font-semibold text-gray-900">Supporting Studies</h3>
                </div>

                <div className="space-y-6">
                  {insight.supportingStudies.map((study, studyIndex) => (
                    <div key={studyIndex} className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium text-gray-900 flex-1">{study.title}</h4>
                        {study.relevanceScore && (
                          <span className="text-sm text-teal-600 font-medium whitespace-nowrap">
                            {study.relevanceScore}% relevant
                          </span>
                        )}
                      </div>
                      {study.authors && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Authors:</span> {study.authors}
                        </p>
                      )}
                      <p className="text-sm text-gray-600">
                        {study.journal && (
                          <>
                            <span className="font-medium">Journal:</span> {study.journal}{" "}
                          </>
                        )}
                        {study.year && (
                          <>
                            <span className="font-medium">Year:</span> {study.year}{" "}
                          </>
                        )}
                        {study.doi && (
                          <>
                            <span className="font-medium">DOI:</span>{" "}
                            <a href={`https://doi.org/${study.doi}`} className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">
                              {study.doi}
                            </a>
                          </>
                        )}
                      </p>
                      <p className="text-sm text-gray-600">{study.summary}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {index < analysis.insights.length - 1 && <hr className="my-6" />}
          </div>
        ))
      ) : (
        <div className="text-center py-8 text-gray-500">
          No insights available for this analysis.
        </div>
      )}
    </div>
  )

  const handleExportToPDF = async () => {
    if (selectedProductIds.length === 0) {
      alert('No products selected for export')
      return
    }

    setIsExporting(true)
    
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'
      
      const response = await fetch(`${API_BASE_URL}/api/analysis/export/pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productIds: selectedProductIds,
          selectedCategory: selectedCategory
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }

      // Get the PDF blob
      const blob = await response.blob()
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      
      // Get filename from response headers or use default
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = `Analysis_Report_${selectedCategory.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }
      
      link.download = filename
      document.body.appendChild(link)
      link.click()
      
      // Cleanup
      window.URL.revokeObjectURL(url)
      document.body.removeChild(link)
      
    } catch (error) {
      console.error('Error exporting PDF:', error)
      alert('Failed to export PDF. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "trending":
      case "emerging":
      case "declining":
        return renderTrendingContent()
      case "insights":
        return renderInsightsContent()
      default:
        return renderTrendingContent()
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Analysis Report</h2>
            <Button 
              onClick={handleExportToPDF}
              disabled={isExporting || selectedProductIds.length === 0}
              className="bg-gray-900 hover:bg-gray-800 text-white px-6 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              {isExporting ? 'Generating PDF...' : 'Export PDF'}
            </Button>
          </div>

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-6">
            <div className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              <span>{analysis.trending.ingredients.length + analysis.trending.claims.length + analysis.trending.ingredientCategories.length}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{new Date().toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <Building2 className="w-4 h-4" />
              <span>Ulta</span>
            </div>
            <div className="flex items-center gap-1">
              <Layers className="w-4 h-4" />
              <span>{selectedCategory}</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-1 border-b">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? "border-gray-900 text-gray-900"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label} ({tab.count})
                </button>
              )
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-96">{renderTabContent()}</div>
      </CardContent>
    </Card>
  )
}