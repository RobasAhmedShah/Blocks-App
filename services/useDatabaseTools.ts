// Database tool functions for Gemini function calling
const NEON_PROJECT_ID = 'frosty-frost-91275260';
const NEON_DATABASE = 'neondb';

export interface DatabaseTool {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

// Define tools for Gemini function calling
export const databaseTools: DatabaseTool[] = [
  {
    name: 'getPropertyDetails',
    description: 'Get detailed information about a specific property by ID, title, or display code. Returns all property information including pricing, ROI, tokens, location, and features.',
    parameters: {
      type: 'object',
      properties: {
        propertyId: {
          type: 'string',
          description: 'The UUID of the property',
        },
        propertyTitle: {
          type: 'string',
          description: 'The title of the property (partial match supported)',
        },
        displayCode: {
          type: 'string',
          description: 'The display code of the property',
        },
      },
    },
  },
  {
    name: 'searchProperties',
    description: 'Search for properties by city, country, status, or type. Returns a list of matching properties.',
    parameters: {
      type: 'object',
      properties: {
        city: {
          type: 'string',
          description: 'Filter by city name',
        },
        country: {
          type: 'string',
          description: 'Filter by country name',
        },
        status: {
          type: 'string',
          description: 'Filter by status (e.g., funding, construction, completed)',
        },
        type: {
          type: 'string',
          description: 'Filter by property type',
        },
        minROI: {
          type: 'number',
          description: 'Minimum expected ROI percentage',
        },
        maxPricePerToken: {
          type: 'number',
          description: 'Maximum price per token in USDT',
        },
      },
    },
  },
  {
    name: 'getPropertyFinancials',
    description: 'Get financial information for a property including token price, ROI, total value, and available tokens.',
    parameters: {
      type: 'object',
      properties: {
        propertyId: {
          type: 'string',
          description: 'The UUID of the property',
        },
        propertyTitle: {
          type: 'string',
          description: 'The title of the property',
        },
      },
      required: ['propertyId'],
    },
  },
];

// Convert tools to Gemini function calling format
export function getGeminiTools() {
  return [
    {
      functionDeclarations: databaseTools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      })),
    },
  ];
}

