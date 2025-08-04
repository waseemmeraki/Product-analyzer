import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Product Analytics AI API',
    version: '1.0.0',
    description: 'API documentation for Product Analytics AI platform',
  },
  servers: [
    {
      url: 'http://localhost:3002',
      description: 'Development server',
    },
  ],
  paths: {
    '/health': {
      get: {
        summary: 'Health check endpoint',
        tags: ['Health'],
        responses: {
          '200': {
            description: 'Server is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: {
                      type: 'string',
                      example: 'OK'
                    },
                    timestamp: {
                      type: 'string',
                      format: 'date-time'
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/auth/login': {
      post: {
        summary: 'Login user',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: {
                    type: 'string',
                    format: 'email'
                  },
                  password: {
                    type: 'string',
                    minLength: 6
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'User logged in successfully'
          }
        }
      }
    },
    '/api/auth/register': {
      post: {
        summary: 'Register a new user',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: {
                    type: 'string',
                    format: 'email'
                  },
                  password: {
                    type: 'string',
                    minLength: 6
                  },
                  name: {
                    type: 'string'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'User registered successfully'
          }
        }
      }
    },
    '/api/analysis': {
      post: {
        summary: 'Analyze cosmetic products for ingredient and claim intelligence',
        tags: ['Analysis'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['productIds'],
                properties: {
                  productIds: {
                    type: 'array',
                    items: {
                      type: 'string',
                      format: 'uuid'
                    },
                    description: 'Array of product UUIDs to analyze',
                    example: ['123e4567-e89b-12d3-a456-426614174000', '987fcdeb-51a2-43d1-9f12-123456789abc']
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Analysis results',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: {
                      type: 'boolean'
                    },
                    data: {
                      type: 'object',
                      properties: {
                        productsAnalyzed: {
                          type: 'number'
                        },
                        productsRequested: {
                          type: 'number'
                        },
                        analysis: {
                          type: 'object',
                          properties: {
                            trending: {
                              type: 'object',
                              properties: {
                                ingredients: {
                                  type: 'array',
                                  items: { type: 'string' }
                                },
                                claims: {
                                  type: 'array',
                                  items: { type: 'string' }
                                },
                                ingredientCategories: {
                                  type: 'array',
                                  items: { type: 'string' }
                                }
                              }
                            },
                            emerging: {
                              type: 'object',
                              properties: {
                                ingredients: {
                                  type: 'array',
                                  items: { type: 'string' }
                                },
                                claims: {
                                  type: 'array',
                                  items: { type: 'string' }
                                },
                                ingredientCategories: {
                                  type: 'array',
                                  items: { type: 'string' }
                                }
                              }
                            },
                            declining: {
                              type: 'object',
                              properties: {
                                ingredients: {
                                  type: 'array',
                                  items: { type: 'string' }
                                },
                                claims: {
                                  type: 'array',
                                  items: { type: 'string' }
                                },
                                ingredientCategories: {
                                  type: 'array',
                                  items: { type: 'string' }
                                }
                              }
                            },
                            insights: {
                              type: 'array',
                              items: {
                                type: 'object',
                                properties: {
                                  type: {
                                    type: 'string',
                                    enum: ['ingredient', 'claim', 'category']
                                  },
                                  name: {
                                    type: 'string'
                                  },
                                  supportingFact: {
                                    type: 'string'
                                  },
                                  studyReference: {
                                    type: 'string',
                                    description: 'Reference to relevant scientific study or research'
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Invalid request format'
          },
          '404': {
            description: 'No products found'
          },
          '500': {
            description: 'Analysis failed'
          }
        }
      }
    },
    '/api/analysis/health': {
      get: {
        summary: 'Health check for analysis service',
        tags: ['Analysis'],
        responses: {
          '200': {
            description: 'Service health status',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: {
                      type: 'string'
                    },
                    services: {
                      type: 'object',
                      properties: {
                        database: {
                          type: 'string'
                        },
                        openai: {
                          type: 'string'
                        }
                      }
                    },
                    timestamp: {
                      type: 'string',
                      format: 'date-time'
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/products/brands': {
      get: {
        summary: 'Get all available brands',
        tags: ['Products'],
        responses: {
          '200': {
            description: 'List of brands',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: {
                      type: 'boolean'
                    },
                    data: {
                      type: 'array',
                      items: {
                        type: 'string'
                      },
                      example: ['AquaSkin', 'DermaFix', 'GlowBrand']
                    }
                  }
                }
              }
            }
          },
          '500': {
            description: 'Failed to fetch brands'
          }
        }
      }
    },
    '/api/products/brands/{brand}/categories': {
      get: {
        summary: 'Get categories for a specific brand',
        tags: ['Products'],
        parameters: [
          {
            name: 'brand',
            in: 'path',
            required: true,
            schema: {
              type: 'string'
            },
            description: 'Brand name',
            example: 'AquaSkin'
          }
        ],
        responses: {
          '200': {
            description: 'List of categories for the brand',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: {
                      type: 'boolean'
                    },
                    data: {
                      type: 'array',
                      items: {
                        type: 'string'
                      },
                      example: ['Moisturizer', 'Cleanser', 'Serum']
                    }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Brand parameter is required'
          },
          '500': {
            description: 'Failed to fetch categories'
          }
        }
      }
    },
    '/api/products/brands/{brand}/categories/{category}/products': {
      get: {
        summary: 'Get products for a specific brand and category',
        tags: ['Products'],
        parameters: [
          {
            name: 'brand',
            in: 'path',
            required: true,
            schema: {
              type: 'string'
            },
            description: 'Brand name',
            example: 'AquaSkin'
          },
          {
            name: 'category',
            in: 'path',
            required: true,
            schema: {
              type: 'string'
            },
            description: 'Category name',
            example: 'Moisturizer'
          }
        ],
        responses: {
          '200': {
            description: 'List of products for the brand and category',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: {
                      type: 'boolean'
                    },
                    data: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          Id: {
                            type: 'string',
                            format: 'uuid'
                          },
                          Name: {
                            type: 'string'
                          },
                          Brand: {
                            type: 'string'
                          },
                          Category: {
                            type: 'string'
                          },
                          Ingredients: {
                            type: 'string'
                          },
                          IngredientCategories: {
                            type: 'string'
                          },
                          Claims: {
                            type: 'string'
                          },
                          Rating: {
                            type: 'number'
                          },
                          ReviewCount: {
                            type: 'number'
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Brand and category parameters are required'
          },
          '500': {
            description: 'Failed to fetch products'
          }
        }
      }
    },
    '/api/scraper/health': {
      get: {
        summary: 'Health check for scraper service',
        tags: ['Scraper'],
        responses: {
          '200': {
            description: 'Scraper service health status'
          }
        }
      }
    },
    '/api/scraper/quick': {
      get: {
        summary: 'Quick scrape a website',
        tags: ['Scraper'],
        parameters: [
          {
            name: 'url',
            in: 'query',
            required: true,
            schema: {
              type: 'string'
            }
          }
        ],
        responses: {
          '200': {
            description: 'Scraping results'
          }
        }
      }
    },
    '/api/scraper/scrape': {
      post: {
        summary: 'Scrape website with custom selectors',
        tags: ['Scraper'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  url: {
                    type: 'string'
                  },
                  selectors: {
                    type: 'object'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Scraping successful'
          }
        }
      }
    },
    '/api/scraper/sephora': {
      post: {
        summary: 'Scrape Sephora products',
        tags: ['Scraper'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  categoryUrl: {
                    type: 'string'
                  },
                  limit: {
                    type: 'integer'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Products scraped successfully'
          }
        }
      }
    },
    '/api/scraper/ulta': {
      post: {
        summary: 'Scrape Ulta products from a category page',
        tags: ['Scraper'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['categoryUrl'],
                properties: {
                  categoryUrl: {
                    type: 'string',
                    format: 'uri',
                    description: 'Ulta category URL to scrape',
                    example: 'https://www.ulta.com/shop/hair/shampoo-conditioner/shampoo'
                  },
                  limit: {
                    type: 'integer',
                    minimum: 1,
                    maximum: 50,
                    default: 10,
                    description: 'Maximum number of products to scrape'
                  },
                  options: {
                    type: 'object',
                    properties: {
                      headless: {
                        type: 'boolean',
                        default: true
                      },
                      timeout: {
                        type: 'integer',
                        minimum: 30000,
                        maximum: 120000,
                        default: 60000
                      },
                      maxRetries: {
                        type: 'integer',
                        minimum: 1,
                        maximum: 3,
                        default: 2
                      }
                    }
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Ulta products scraped successfully'
          },
          '400': {
            description: 'Invalid request parameters'
          },
          '500': {
            description: 'Scraping failed'
          }
        }
      }
    },
    '/api/scraper/ulta/save': {
      post: {
        summary: 'Scrape Ulta products and save to database',
        tags: ['Scraper'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['categoryUrl'],
                properties: {
                  categoryUrl: {
                    type: 'string',
                    format: 'uri',
                    description: 'Ulta category URL to scrape',
                    example: 'https://www.ulta.com/shop/hair/shampoo-conditioner/shampoo'
                  },
                  limit: {
                    type: 'integer',
                    minimum: 1,
                    maximum: 50,
                    default: 10,
                    description: 'Maximum number of products to scrape and save'
                  },
                  options: {
                    type: 'object',
                    properties: {
                      headless: {
                        type: 'boolean',
                        default: true
                      },
                      timeout: {
                        type: 'integer',
                        minimum: 30000,
                        maximum: 120000,
                        default: 60000
                      },
                      maxRetries: {
                        type: 'integer',
                        minimum: 1,
                        maximum: 3,
                        default: 2
                      }
                    }
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Products scraped and saved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: {
                      type: 'boolean'
                    },
                    data: {
                      type: 'object',
                      properties: {
                        scrapedProducts: {
                          type: 'array',
                          items: {
                            type: 'object'
                          }
                        },
                        totalProcessed: {
                          type: 'integer',
                          description: 'Total number of products processed'
                        },
                        newProductsAdded: {
                          type: 'integer',
                          description: 'Number of new products added to database'
                        },
                        duplicatesSkipped: {
                          type: 'integer',
                          description: 'Number of duplicate products skipped'
                        },
                        savedProductIds: {
                          type: 'array',
                          items: {
                            type: 'string'
                          },
                          description: 'Array of product IDs (includes both new and existing)'
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Invalid request parameters'
          },
          '500': {
            description: 'Scraping or saving failed'
          }
        }
      }
    },
    '/api/scraper/categorize-ingredients': {
      post: {
        summary: 'Test ingredient categorization with OpenAI',
        tags: ['Scraper'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['ingredients'],
                properties: {
                  ingredients: {
                    type: 'string',
                    description: 'Comma-separated list of ingredients to categorize',
                    example: 'Water, Glycerin, Niacinamide, Hyaluronic Acid, Vitamin C, Fragrance'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Ingredients categorized successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: {
                      type: 'boolean'
                    },
                    data: {
                      type: 'object',
                      properties: {
                        ingredients: {
                          type: 'string'
                        },
                        categories: {
                          type: 'array',
                          items: {
                            type: 'string'
                          }
                        },
                        categoriesString: {
                          type: 'string'
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Invalid request parameters'
          },
          '500': {
            description: 'Categorization failed'
          }
        }
      }
    }
  }
};

export const setupSimpleSwagger = (app: Express) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerDocument);
  });
};