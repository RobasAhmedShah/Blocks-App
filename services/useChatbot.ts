import { useState, useCallback, useEffect } from 'react';
import { Property } from '@/types/property';
import { getGeminiTools } from './useDatabaseTools';

const GEMINI_API_KEY = 'AIzaSyCMK3Lx1NZtdBxCd9bYLRK73lwwXwrEwls';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
// Production backend URL
const DATABASE_API_URL = process.env.EXPO_PUBLIC_DATABASE_API_URL || 'https://hmr-backend.vercel.app/api/database';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  error?: boolean;
}

interface UseChatbotOptions {
  property: Property;
}

export function useChatbot({ property }: UseChatbotOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `Hello! I'm your AI assistant for Blocks. I have the full details for ${property.title}. How can I help you today?`,
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [databasePropertyId, setDatabasePropertyId] = useState<string | null>(null);
  const [databaseDisplayCode, setDatabaseDisplayCode] = useState<string | null>(null);

  // Execute database function via API
  const executeDatabaseFunction = useCallback(async (functionName: string, args: any) => {
    try {
      const response = await fetch(`${DATABASE_API_URL}/${functionName}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(args),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || errorData.error || `API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Database function error:', error);
      return { 
        error: error instanceof Error ? error.message : 'Database query failed. Please try again.' 
      };
    }
  }, []);

  // Fetch property from database on mount to get the real ID/displayCode
  useEffect(() => {
    const fetchPropertyFromDatabase = async () => {
      try {
        // Try multiple strategies to find the property
        const strategies: Array<{ propertyTitle?: string; displayCode?: string; propertyId?: string }> = [
          { propertyTitle: property.title },
          { propertyTitle: property.title.split(' ')[0] }, // First word
        ];

        // If property has a displayCode already, try that first
        if (property.displayCode) {
          strategies.unshift({ displayCode: property.displayCode });
        }

        for (const strategy of strategies) {
          console.log('Trying to fetch property with strategy:', strategy);
          const result = await executeDatabaseFunction('getPropertyDetails', strategy);
          
          if (result && !result.error) {
            const propertyData = Array.isArray(result) ? result[0] : result;
            
            if (propertyData && propertyData.id) {
              setDatabasePropertyId(propertyData.id);
              setDatabaseDisplayCode(propertyData.displayCode);
              console.log('Successfully found property:', {
                id: propertyData.id,
                displayCode: propertyData.displayCode,
                title: propertyData.title,
              });
              break; // Found it, stop trying
            }
          }
        }
      } catch (error) {
        console.log('Could not fetch property from database on mount:', error);
        // Continue without database ID - will try again when user asks
      }
    };

    fetchPropertyFromDatabase();
  }, [property.title, property.displayCode, executeDatabaseFunction]);

  const buildContext = useCallback(() => {
    return `You are an AI assistant for Blocks, a real estate tokenized investment platform. 

CURRENT PROPERTY CONTEXT (from UI):
- Property Name: ${property.title}
- Location: ${property.location}
- Token Price: $${property.tokenPrice.toFixed(2)}
- Minimum Investment: $${property.minInvestment.toLocaleString()}
- Annual ROI: ${property.estimatedROI}%
- Expected Yield: ${property.estimatedYield}%
- Total Tokens: ${property.totalTokens.toLocaleString()}
- Sold Tokens: ${property.soldTokens.toLocaleString()}
- Funding Progress: ${Math.round((property.soldTokens / property.totalTokens) * 100)}%
- Status: ${property.status}
- Completion Date: ${property.completionDate}
- Developer: ${property.builder.name}
- Description: ${property.description}
${property.features.bedrooms ? `- Bedrooms: ${property.features.bedrooms}` : ''}
${property.features.bathrooms ? `- Bathrooms: ${property.features.bathrooms}` : ''}
${property.features.area ? `- Area: ${property.features.area.toLocaleString()} sq ft` : ''}
${property.features.units ? `- Units: ${property.features.units}` : ''}
${property.features.floors ? `- Floors: ${property.features.floors}` : ''}
${property.amenities.length > 0 ? `- Amenities: ${property.amenities.join(', ')}` : ''}

BLOCKS APP CONCEPT:
Blocks (formerly HMR app) is a real estate investment platform that allows users to invest in properties through tokenization. Users can purchase tokens representing fractional ownership of real estate properties. Each token represents a share of the property, and investors receive returns through rental income distributions and potential property appreciation.

CRITICAL DATABASE QUERY INSTRUCTIONS:
- You MUST use the getPropertyDetails function when users ask about a specific property
- The current property being viewed is: "${property.title}"
${databaseDisplayCode ? `
*** MOST IMPORTANT: This property's display code is "${databaseDisplayCode}" ***
- ALWAYS use displayCode="${databaseDisplayCode}" as the FIRST parameter when calling getPropertyDetails
- This is the most reliable way to find the property in the database
- Example: getPropertyDetails({ displayCode: "${databaseDisplayCode}" })
` : ''}
${databasePropertyId ? `- This property's database ID (UUID) is: "${databasePropertyId}" - Use this as a fallback if displayCode doesn't work` : ''}
- When calling getPropertyDetails, ALWAYS use this exact priority:
  1. ${databaseDisplayCode ? `FIRST: displayCode="${databaseDisplayCode}" (REQUIRED - use this first!)` : 'displayCode if available'}
  2. ${databasePropertyId ? `SECOND: propertyId="${databasePropertyId}"` : 'propertyId if available'}
  3. propertyTitle="${property.title}" (only if displayCode/propertyId not available)
  4. Partial title matches (last resort)
- ALWAYS call getPropertyDetails when users ask about property details, pricing, ROI, tokens, or any property-specific information
- Use searchProperties when users want to find multiple properties or compare properties
- Use getPropertyFinancials for financial-specific questions
- If a property is not found, the system will automatically try fallback strategies
- Never say "I couldn't find it" - the system handles retries automatically`;
  }, [property, databaseDisplayCode, databasePropertyId]);


  const sendMessage = useCallback(
    async (userMessage: string) => {
      if (!userMessage.trim() || isLoading) return;

      const userMsg: ChatMessage = {
        role: 'user',
        content: userMessage.trim(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);
      setError(null);

      try {
        // Build conversation history
        const conversationHistory = messages.map((msg) => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }],
        }));

        // Add current user message
        conversationHistory.push({
          role: 'user',
          parts: [{ text: userMessage }],
        });

        // Build system instruction with context
        const systemInstruction = buildContext();

        const requestBody: any = {
          contents: conversationHistory,
          systemInstruction: {
            parts: [{ text: systemInstruction }],
          },
          tools: getGeminiTools(),
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          },
        };

        const response = await fetch(GEMINI_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': GEMINI_API_KEY,
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorText = await response.text();
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { error: { message: errorText || `API error: ${response.status} ${response.statusText}` } };
          }
          throw new Error(
            errorData.error?.message || `API error: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();

        // Handle safety filters or empty responses
        if (!data.candidates || data.candidates.length === 0) {
          throw new Error('No response generated. Please try again.');
        }

        const candidate = data.candidates[0];
        
        if (candidate?.finishReason === 'SAFETY') {
          throw new Error('Response was blocked by safety filters. Please try rephrasing your question.');
        }

        // Check for function calls
        const functionCalls = candidate?.content?.parts?.filter((part: any) => part.functionCall);
        
        if (functionCalls && functionCalls.length > 0) {
          // Execute function calls
          const functionResults = [];
          for (const funcCall of functionCalls) {
            let { name, args } = funcCall.functionCall;
            console.log('Executing function:', name, 'with args:', args);
            
            // Auto-inject displayCode if available and not already provided
            if (name === 'getPropertyDetails' && databaseDisplayCode && !args.displayCode && !args.propertyId) {
              console.log('Auto-injecting displayCode:', databaseDisplayCode);
              args = { ...args, displayCode: databaseDisplayCode };
            }
            
            let result = await executeDatabaseFunction(name, args);
            console.log('Function result:', result);
            
            // Robust fallback strategy for getPropertyDetails
            if ((!result || (Array.isArray(result) && result.length === 0) || result.error) && 
                name === 'getPropertyDetails') {
              
              // Try fallback strategies in order of reliability
              const fallbackStrategies = [];
              
              // Strategy 1: Use displayCode if available
              if (databaseDisplayCode && !args.displayCode) {
                fallbackStrategies.push({ displayCode: databaseDisplayCode });
              }
              
              // Strategy 2: Use propertyId if available
              if (databasePropertyId && !args.propertyId) {
                fallbackStrategies.push({ propertyId: databasePropertyId });
              }
              
              // Strategy 3: Use property title from UI
              if (!args.propertyTitle) {
                fallbackStrategies.push({ propertyTitle: property.title });
              }
              
              // Strategy 4: Try partial title match
              if (property.title) {
                const partialTitle = property.title.split(' ')[0]; // First word
                if (partialTitle && partialTitle.length > 3) {
                  fallbackStrategies.push({ propertyTitle: partialTitle });
                }
              }
              
              // Try each fallback strategy
              for (const strategy of fallbackStrategies) {
                console.log('Trying fallback strategy:', strategy);
                const fallbackResult = await executeDatabaseFunction(name, strategy);
                
                if (fallbackResult && !fallbackResult.error) {
                  const isValidResult = Array.isArray(fallbackResult) 
                    ? fallbackResult.length > 0 
                    : Object.keys(fallbackResult).length > 0;
                  
                  if (isValidResult) {
                    result = fallbackResult;
                    console.log('Fallback search succeeded with:', strategy, result);
                    
                    // Update database IDs if we found the property
                    if (Array.isArray(result) && result[0]) {
                      setDatabasePropertyId(result[0].id);
                      setDatabaseDisplayCode(result[0].displayCode);
                    } else if (!Array.isArray(result)) {
                      setDatabasePropertyId(result.id);
                      setDatabaseDisplayCode(result.displayCode);
                    }
                    break;
                  }
                }
              }
            }
            
            // Format response correctly for Gemini
            functionResults.push({
              functionResponse: {
                name: name,
                response: result,
              },
            });
          }

          // Send function results back to Gemini
          const followUpRequest = {
            contents: [
              ...conversationHistory,
              {
                role: 'model',
                parts: functionCalls,
              },
              {
                role: 'function',
                parts: functionResults,
              },
            ],
            systemInstruction: {
              parts: [{ text: systemInstruction }],
            },
            tools: getGeminiTools(),
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2048,
            },
          };

          const followUpResponse = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': GEMINI_API_KEY,
            },
            body: JSON.stringify(followUpRequest),
          });

          if (!followUpResponse.ok) {
            const errorText = await followUpResponse.text();
            throw new Error(`Follow-up API error: ${followUpResponse.status} ${errorText}`);
          }

          const followUpData = await followUpResponse.json();
          
          if (!followUpData.candidates || followUpData.candidates.length === 0) {
            throw new Error('No response generated from follow-up request.');
          }

          const followUpCandidate = followUpData.candidates[0];
          
          if (followUpCandidate?.finishReason === 'SAFETY') {
            throw new Error('Response was blocked by safety filters.');
          }

          // Check if there are more function calls (recursive function calling)
          const moreFunctionCalls = followUpCandidate?.content?.parts?.filter((part: any) => part.functionCall);
          
          if (moreFunctionCalls && moreFunctionCalls.length > 0) {
            // Handle recursive function calls if needed
            console.log('Additional function calls detected, processing...');
          }
          
          let assistantContent = '';
          if (followUpCandidate?.content?.parts) {
            assistantContent = followUpCandidate.content.parts
              .map((part: any) => part.text || '')
              .join('');
          }

          if (!assistantContent.trim()) {
            assistantContent = "I retrieved the data, but couldn't generate a response. Please try rephrasing your question.";
          }

          const assistantMsg: ChatMessage = {
            role: 'assistant',
            content: assistantContent,
          };

          setMessages((prev) => [...prev, assistantMsg]);
        } else {
          // Regular text response
          let assistantContent = '';
          if (candidate?.content?.parts && candidate.content.parts.length > 0) {
            assistantContent = candidate.content.parts
              .map((part: any) => part.text || '')
              .join('');
          } else if (candidate?.content?.text) {
            assistantContent = candidate.content.text;
          } else if (candidate?.text) {
            assistantContent = candidate.text;
          }

          if (!assistantContent.trim()) {
            if (candidate?.finishReason === 'MAX_TOKENS') {
              assistantContent = "I apologize, but my response was cut off due to length limits. Could you please ask a more specific question?";
            } else {
              assistantContent = "I'm sorry, I couldn't generate a response. Please try again.";
            }
          }

          const assistantMsg: ChatMessage = {
            role: 'assistant',
            content: assistantContent,
          };

          setMessages((prev) => [...prev, assistantMsg]);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get response. Please try again.';
        setError(errorMessage);

        const errorMsg: ChatMessage = {
          role: 'assistant',
          content: "I'm sorry, I couldn't process that request. Please try rephrasing your question or check your connection.",
          error: true,
        };

        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading, buildContext, executeDatabaseFunction, databasePropertyId, databaseDisplayCode, property]
  );

  const retryLastMessage = useCallback(() => {
    if (messages.length < 2) return;
    
    const lastUserMessage = messages
      .slice()
      .reverse()
      .find((msg) => msg.role === 'user');
    
    if (lastUserMessage) {
      // Remove the last assistant message (error) and retry
      setMessages((prev) => prev.slice(0, -1));
      sendMessage(lastUserMessage.content);
    }
  }, [messages, sendMessage]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    retryLastMessage,
    clearError,
  };
}

