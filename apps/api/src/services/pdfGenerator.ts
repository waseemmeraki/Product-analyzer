import puppeteer from 'puppeteer';
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Chart, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

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
    primaryReference?: string;
    usageMetrics?: {
      searchVolume?: number;
      trendingScore?: number;
      userEngagement?: number;
      recentMentions?: number;
      marketPenetration?: number;
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
    webReferences?: Array<{
      title: string;
      url: string;
      source: string;
      summary: string;
      relevanceScore?: number;
    }>;
  }>;
}

interface ReportData {
  analysis: AnalysisResult;
  selectedCategory: string;
  productsAnalyzed: number;
  generationDate: string;
}

export class PDFGeneratorService {
  private chartJSNodeCanvas: ChartJSNodeCanvas;
  private logoBase64: string;

  constructor() {
    // Register Chart.js components and plugins
    Chart.register(...registerables, ChartDataLabels);
    
    this.chartJSNodeCanvas = new ChartJSNodeCanvas({ 
      width: 800, 
      height: 400,
      backgroundColour: 'white',
      plugins: {
        modern: ['chartjs-plugin-datalabels']
      }
    });
    
    // Load logo and convert to base64
    try {
      const logoPath = join(__dirname, '../assets/logo (1).png');
      const logoBuffer = readFileSync(logoPath);
      this.logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
    } catch (error) {
      console.warn('Logo not found, proceeding without logo:', error);
      this.logoBase64 = '';
    }
  }

  private async generateDataOverviewChart(analysis: AnalysisResult): Promise<string> {
    const trendingCount = analysis.trending.ingredients.length + analysis.trending.claims.length + analysis.trending.ingredientCategories.length;
    const emergingCount = analysis.emerging.ingredients.length + analysis.emerging.claims.length + analysis.emerging.ingredientCategories.length;
    const decliningCount = analysis.declining.ingredients.length + analysis.declining.claims.length + analysis.declining.ingredientCategories.length;

    const configuration = {
      type: 'doughnut' as const,
      data: {
        labels: ['Trending', 'Emerging', 'Declining'],
        datasets: [{
          data: [trendingCount, emergingCount, decliningCount],
          backgroundColor: [
            '#2563eb', // Blue for trending
            '#0d9488', // Teal for emerging  
            '#dc2626'  // Red for declining
          ],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: false,
        plugins: {
          legend: {
            position: 'bottom' as const,
            labels: {
              padding: 20,
              font: {
                size: 14
              }
            }
          },
          title: {
            display: true,
            text: 'Analysis Data Overview',
            font: {
              size: 18,
              weight: 'bold' as const
            },
            padding: 20
          },
          datalabels: {
            display: true,
            color: 'white',
            font: {
              size: 14,
              weight: 'bold' as const
            },
            formatter: (value: number, context: any) => {
              const total = context.dataset.data.reduce((sum: number, val: number) => sum + val, 0);
              const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
              return value > 0 ? `${value}\n(${percentage}%)` : '';
            }
          }
        }
      }
    };

    const imageBuffer = await this.chartJSNodeCanvas.renderToBuffer(configuration);
    return `data:image/png;base64,${imageBuffer.toString('base64')}`;
  }


  private async generateHTMLTemplate(data: ReportData): Promise<string> {
    const { analysis, selectedCategory, productsAnalyzed, generationDate } = data;

    // Generate charts
    const dataOverviewChart = await this.generateDataOverviewChart(analysis);

    const renderSection = (sectionName: string, sectionData: any) => {
      if (!sectionData.ingredients.length && !sectionData.claims.length && !sectionData.ingredientCategories.length) {
        return `<div class="section-empty">No ${sectionName.toLowerCase()} data available</div>`;
      }

      // Helper function to convert markdown links to HTML
      const convertMarkdownLinksToHTML = (text: string) => {
        return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="link">$1</a>');
      };

      return `
        <div class="section">
          <h3 class="section-title">${sectionName}</h3>
          ${sectionData.ingredients.length > 0 ? `
            <div class="subsection">
              <h4><span class="emoji">🧪</span> Ingredients</h4>
              <div class="tags">
                ${sectionData.ingredients.map((ingredient: string, index: number) => 
                  `<span class="tag tag-${index % 8}">${ingredient}</span>`
                ).join('')}
              </div>
              ${sectionData.ingredientsDescription ? `
                <div class="description">
                  <p>${convertMarkdownLinksToHTML(sectionData.ingredientsDescription)}</p>
                </div>
              ` : ''}
            </div>
          ` : ''}
          ${sectionData.claims.length > 0 ? `
            <div class="subsection">
              <h4><span class="emoji">🎯</span> Claims</h4>
              <div class="tags">
                ${sectionData.claims.map((claim: string, index: number) => 
                  `<span class="tag tag-${(index + sectionData.ingredients.length) % 8}">${claim}</span>`
                ).join('')}
              </div>
              ${sectionData.claimsDescription ? `
                <div class="description">
                  <p>${convertMarkdownLinksToHTML(sectionData.claimsDescription)}</p>
                </div>
              ` : ''}
            </div>
          ` : ''}
          ${sectionData.ingredientCategories.length > 0 ? `
            <div class="subsection">
              <h4><span class="emoji">⭐</span> Ingredient Categories</h4>
              <div class="tags">
                ${sectionData.ingredientCategories.map((category: string, index: number) => 
                  `<span class="tag tag-${(index + sectionData.ingredients.length + sectionData.claims.length) % 8}">${category}</span>`
                ).join('')}
              </div>
              ${sectionData.ingredientCategoriesDescription ? `
                <div class="description">
                  <p>${convertMarkdownLinksToHTML(sectionData.ingredientCategoriesDescription)}</p>
                </div>
              ` : ''}
            </div>
          ` : ''}
        </div>
      `;
    };

    const renderInsights = () => {
      if (!analysis.insights.length) {
        return '<div class="section-empty">No insights available for this analysis</div>';
      }

      return analysis.insights.map((insight, index) => `
        <div class="insight">
          <div class="insight-header">
            <span class="insight-badge">
              ${insight.type === 'ingredient' ? '🧪' : insight.type === 'claim' ? '🎯' : '📂'} ${insight.name}
            </span>
            ${insight.credibilityScore ? `<span class="credibility">${insight.credibilityScore}% Credible</span>` : ''}
          </div>
          <p class="insight-fact">${insight.supportingFact}</p>
          <div class="insight-meta">
            <span class="insight-type">${insight.type.charAt(0).toUpperCase() + insight.type.slice(1)}</span>
          </div>
          
          ${insight.usageMetrics ? `
            <div class="analytics-section">
              <h4>User Analytics</h4>
              <div class="metrics-grid">
                <div class="metric metric-blue">
                  <div class="metric-value">${insight.usageMetrics.searchVolume || 'N/A'}</div>
                  <div class="metric-label">Search Volume</div>
                </div>
                <div class="metric metric-teal">
                  <div class="metric-value">${insight.usageMetrics.trendingScore || 'N/A'}</div>
                  <div class="metric-label">Trending Score</div>
                </div>
                <div class="metric metric-purple">
                  <div class="metric-value">${insight.usageMetrics.userEngagement || 'N/A'}%</div>
                  <div class="metric-label">Engagement</div>
                </div>
                <div class="metric metric-orange">
                  <div class="metric-value">${insight.usageMetrics.recentMentions || 'N/A'}</div>
                  <div class="metric-label">Recent Mentions</div>
                </div>
                ${insight.usageMetrics.marketPenetration ? `
                  <div class="metric metric-green">
                    <div class="metric-value">${insight.usageMetrics.marketPenetration}%</div>
                    <div class="metric-label">Market Penetration</div>
                  </div>
                ` : ''}
              </div>
            </div>
          ` : ''}

          ${insight.primaryReference ? `
            <div class="reference-section">
              <h4>Primary Reference</h4>
              <p class="reference"><a href="${insight.primaryReference}" target="_blank" rel="noopener noreferrer" class="link">${insight.primaryReference}</a></p>
            </div>
          ` : ''}

          ${insight.studyReference ? `
            <div class="reference-section">
              <h4>Study Reference</h4>
              <p class="reference">${insight.studyReference}</p>
            </div>
          ` : ''}

          ${insight.webReferences && insight.webReferences.length > 0 ? `
            <div class="web-references-section">
              <h4>Web References</h4>
              ${insight.webReferences.map((ref, refIndex) => `
                <div class="web-reference">
                  <div class="web-reference-header">
                    <h5 class="web-reference-title">
                      <a href="${ref.url}" target="_blank" rel="noopener noreferrer" class="link">${ref.title}</a>
                    </h5>
                    ${ref.relevanceScore ? `<span class="relevance">${ref.relevanceScore}% relevant</span>` : ''}
                  </div>
                  <p class="web-reference-source"><strong>Source:</strong> ${ref.source}</p>
                  <p class="web-reference-summary">${ref.summary}</p>
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${insight.supportingStudies && insight.supportingStudies.length > 0 ? `
            <div class="studies-section">
              <h4>Supporting Studies</h4>
              ${insight.supportingStudies.map(study => `
                <div class="study">
                  <div class="study-header">
                    <h5 class="study-title">${study.title}</h5>
                    ${study.relevanceScore ? `<span class="relevance">${study.relevanceScore}% relevant</span>` : ''}
                  </div>
                  ${study.authors ? `<p><strong>Authors:</strong> ${study.authors}</p>` : ''}
                  <p>
                    ${study.journal ? `<strong>Journal:</strong> ${study.journal} ` : ''}
                    ${study.year ? `<strong>Year:</strong> ${study.year} ` : ''}
                    ${study.doi ? `<strong>DOI:</strong> ${study.doi}` : ''}
                  </p>
                  <p class="study-summary">${study.summary}</p>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
        ${index < analysis.insights.length - 1 ? '<hr class="insight-divider">' : ''}
      `).join('');
    };

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Analysis Report - ${selectedCategory}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            line-height: 1.6;
            color: #374151;
            background-color: #fff;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 10px 20px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 16px;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 12px;
        }
        
        .logo {
            max-width: 120px;
            height: auto;
            margin-bottom: 8px;
        }
        
        .title {
            font-size: 28px;
            font-weight: 700;
            color: #111827;
            margin-bottom: 12px;
        }
        
        .metadata {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 32px;
            margin-bottom: 0px;
        }
        
        .brand-category {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        
        .brand-name, .category-name {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .brand-label, .category-label {
            font-size: 15px;
            font-weight: 600;
            color: #6b7280;
            min-width: 70px;
        }
        
        .brand-value {
            font-size: 15px;
            font-weight: 700;
            color: #111827;
            background-color: #f0fdfa;
            border: 2px solid #0d9488;
            padding: 8px 16px;
            border-radius: 8px;
        }
        
        .category-value {
            font-size: 15px;
            font-weight: 600;
            color: #0d9488;
            background-color: #f9fafb;
            border: 1px solid #d1d5db;
            padding: 6px 12px;
            border-radius: 6px;
        }
        
        .report-details {
            display: flex;
            flex-direction: column;
            gap: 8px;
            align-items: flex-end;
        }
        
        .metadata-item {
            display: flex;
            align-items: center;
            gap: 6px;
            color: #6b7280;
            font-size: 14px;
        }
        
        
        .section {
            margin-bottom: 32px;
        }
        
        .section:first-of-type {
            margin-top: 0;
        }
        
        .section-title {
            font-size: 24px;
            font-weight: 700;
            color: #111827;
            margin-bottom: 24px;
        }
        
        .subsection {
            margin-bottom: 32px;
        }
        
        .subsection h4 {
            font-size: 18px;
            font-weight: 600;
            color: #111827;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .emoji {
            color: #0d9488;
        }
        
        .tags {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }
        
        .tag {
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            border: 1px solid;
        }
        
        .tag-0 { background-color: #eff6ff; color: #2563eb; border-color: #bfdbfe; }
        .tag-1 { background-color: #fef2f2; color: #dc2626; border-color: #fecaca; }
        .tag-2 { background-color: #f0fdfa; color: #0d9488; border-color: #99f6e4; }
        .tag-3 { background-color: #faf5ff; color: #9333ea; border-color: #d8b4fe; }
        .tag-4 { background-color: #f0fdf4; color: #16a34a; border-color: #bbf7d0; }
        .tag-5 { background-color: #fff7ed; color: #ea580c; border-color: #fed7aa; }
        .tag-6 { background-color: #fdf2f8; color: #ec4899; border-color: #fbcfe8; }
        .tag-7 { background-color: #f0f9ff; color: #2563eb; border-color: #bae6fd; }
        
        .section-empty {
            text-align: center;
            color: #6b7280;
            font-style: italic;
            padding: 40px 0;
        }
        
        .insight {
            margin-bottom: 32px;
        }
        
        .insight-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 12px;
            flex-wrap: wrap;
            gap: 8px;
        }
        
        .insight-badge {
            background-color: #f0fdfa;
            color: #0d9488;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
        }
        
        .credibility {
            color: #0d9488;
            font-weight: 600;
            font-size: 14px;
        }
        
        .insight-fact {
            color: #6b7280;
            margin-bottom: 12px;
            line-height: 1.7;
        }
        
        .insight-meta {
            margin-bottom: 16px;
        }
        
        .insight-type {
            font-weight: 600;
            text-transform: capitalize;
        }
        
        .analytics-section,
        .reference-section,
        .studies-section,
        .web-references-section {
            margin-top: 24px;
        }
        
        .description {
            margin-top: 16px;
            padding: 16px;
            background-color: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
        }
        
        .description p {
            margin: 0;
            color: #6b7280;
            font-size: 14px;
            line-height: 1.6;
        }
        
        .link {
            color: #0d9488;
            text-decoration: underline;
            font-weight: 500;
        }
        
        .link:hover {
            color: #0f766e;
        }
        
        .analytics-section h4,
        .reference-section h4,
        .studies-section h4,
        .web-references-section h4 {
            font-size: 16px;
            font-weight: 600;
            color: #111827;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .analytics-section h4:before {
            content: "●";
            color: #111827;
        }
        
        .reference-section h4:before {
            content: "●";
            color: #111827;
        }
        
        .studies-section h4:before {
            content: "●";
            color: #111827;
        }
        
        .web-references-section h4:before {
            content: "●";
            color: #111827;
        }
        
        .web-reference {
            margin-bottom: 20px;
            padding: 16px;
            background-color: #f8fafc;
            border-radius: 8px;
            border-left: 4px solid #0d9488;
        }
        
        .web-reference-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            margin-bottom: 8px;
            gap: 16px;
        }
        
        .web-reference-title {
            font-size: 16px;
            font-weight: 600;
            color: #111827;
            flex: 1;
            margin: 0;
        }
        
        .web-reference-title a {
            text-decoration: none;
        }
        
        .web-reference-title a:hover {
            text-decoration: underline;
        }
        
        .web-reference-source {
            font-size: 14px;
            color: #6b7280;
            margin: 8px 0;
        }
        
        .web-reference-summary {
            font-size: 14px;
            color: #4b5563;
            line-height: 1.6;
            margin: 0;
        }
        
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
            gap: 16px;
        }
        
        .metric {
            text-align: center;
            padding: 16px;
            border-radius: 8px;
            border: 1px solid;
        }
        
        .metric-blue { background-color: #eff6ff; border-color: #bfdbfe; }
        .metric-teal { background-color: #f0fdfa; border-color: #99f6e4; }
        .metric-purple { background-color: #faf5ff; border-color: #d8b4fe; }
        .metric-orange { background-color: #fff7ed; border-color: #fed7aa; }
        .metric-green { background-color: #f0fdf4; border-color: #bbf7d0; }
        
        .metric-value {
            font-size: 24px;
            font-weight: 700;
        }
        
        .metric-blue .metric-value { color: #2563eb; }
        .metric-teal .metric-value { color: #0d9488; }
        .metric-purple .metric-value { color: #9333ea; }
        .metric-orange .metric-value { color: #ea580c; }
        .metric-green .metric-value { color: #16a34a; }
        
        .metric-label {
            font-size: 12px;
            color: #6b7280;
            margin-top: 4px;
        }
        
        .reference {
            font-style: italic;
            color: #6b7280;
        }
        
        .study {
            margin-bottom: 24px;
        }
        
        .study-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            margin-bottom: 8px;
            gap: 16px;
        }
        
        .study-title {
            font-size: 16px;
            font-weight: 600;
            color: #111827;
            flex: 1;
        }
        
        .relevance {
            color: #0d9488;
            font-weight: 600;
            font-size: 14px;
            white-space: nowrap;
        }
        
        .study p {
            font-size: 14px;
            color: #6b7280;
            margin-bottom: 8px;
        }
        
        .study-summary {
            line-height: 1.6;
        }
        
        .insight-divider {
            border: none;
            height: 1px;
            background-color: #e5e7eb;
            margin: 32px 0;
        }
        
        .charts-section {
            margin: 5px 0;
            page-break-inside: avoid;
        }
        
        .charts-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 32px;
            margin-top: 24px;
        }
        
        .chart-container {
            text-align: center;
            padding: 20px;
            background-color: #f9fafb;
            border-radius: 12px;
            border: 1px solid #e5e7eb;
            page-break-inside: avoid;
        }
        
        .chart-image {
            width: 100%;
            height: auto;
            max-width: 800px;
            border-radius: 8px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        .charts-title {
            font-size: 24px;
            font-weight: 700;
            color: #111827;
            margin-bottom: 6px;
            text-align: center;
        }
        
        .charts-subtitle {
            font-size: 16px;
            color: #6b7280;
            text-align: center;
            margin-bottom: 10px;
        }
        
        @media print {
            .container {
                padding: 20px 0;
            }
            
            .section {
                page-break-inside: avoid;
            }
            
            .insight {
                page-break-inside: avoid;
            }
            
            .charts-section {
                page-break-before: always;
            }
            
            .chart-container {
                page-break-inside: avoid;
                margin-bottom: 24px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            ${this.logoBase64 ? `<img src="${this.logoBase64}" alt="Company Logo" class="logo" />` : ''}
            <h1 class="title">Analysis Report</h1>
            <div class="metadata">
                <div class="brand-category">
                    <div class="brand-name">
                        <span class="brand-label">Brand:</span>
                        <span class="brand-value">Ulta</span>
                    </div>
                    <div class="category-name">
                        <span class="category-label">Category:</span>
                        <span class="category-value">${selectedCategory}</span>
                    </div>
                </div>
                <div class="report-details">
                    <div class="metadata-item">
                        <span>📅</span>
                        <span>${generationDate}</span>
                    </div>
                    <div class="metadata-item">
                        <span>📦</span>
                        <span>${productsAnalyzed} Products Analyzed</span>
                    </div>
                </div>
            </div>
        </div>

        ${renderSection('Trending', analysis.trending)}
        ${renderSection('Emerging', analysis.emerging)}
        ${renderSection('Declining', analysis.declining)}
        
        <!-- Charts Section -->
        <div class="charts-section">
            <h2 class="charts-title">Data Visualization</h2>
            <p class="charts-subtitle">Visual representation of analysis findings and metrics</p>
            
            <div class="charts-grid">
                <div class="chart-container">
                    <img src="${dataOverviewChart}" alt="Analysis Data Overview Chart" class="chart-image" />
                </div>
            </div>
        </div>
        
        <div class="section">
            <h3 class="section-title">Insights</h3>
            ${renderInsights()}
        </div>
    </div>
</body>
</html>
    `;
  }

  async generatePDF(reportData: ReportData): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      const html = await this.generateHTMLTemplate(reportData);
      
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        }
      });

      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }
}