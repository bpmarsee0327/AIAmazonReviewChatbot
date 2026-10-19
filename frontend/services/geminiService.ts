import { GoogleGenAI, Type, Chat } from '@google/genai';
import { AnalysisResult, ProductSearchResult } from '../types';

// Initialize the Gemini client
// Note: In a real app, ensure process.env.API_KEY is available in your build environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY, vertexai: true });

// SYSTEM PROMPT ENGINEERING, FORMATS THE SEARCH OUTPUT IN THE DESIRED FORMAT
// USED FOR PRODUCT SEARCHING
export const searchAmazonProducts = async (query: string): Promise<ProductSearchResult[]> => {
  const prompt = `Find 5 specific Amazon product pages for the search query: "${query}".
  You MUST return the results as a plain text list where each line contains the product name and the Amazon URL separated by a pipe character "|".
  Example format:
  Product Name 1 | https://www.amazon.com/...
  Product Name 2 | https://www.amazon.com/...
  Do not include any other text, markdown formatting, or bullet points.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }], // Google search tool is enabled in order to pull the proper URLs
      }
    });

    const text = response.text || '';
    const results: ProductSearchResult[] = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      if (!line.trim()) continue;

      // Try to match markdown format [Name](URL) just in case Gemini ignores instructions
      const mdMatch = line.match(/\[(.*?)\]\((https?:\/\/[^\s\)]+)\)/);
      if (mdMatch) {
        results.push({ name: mdMatch[1].trim(), url: mdMatch[2].trim() });
        continue;
      }

      // Try to match Name | URL format
      const parts = line.split('|');
      if (parts.length >= 2) {
        const name = parts[0].replace(/^[\d\.\-\*\s]+/, '').trim(); // Clean up leading bullets/numbers
        const urlMatch = parts.slice(1).join('|').match(/(https?:\/\/[^\s]+)/);
        if (name && urlMatch) {
          results.push({ name, url: urlMatch[1] });
        }
      }
    }
    
    return results.slice(0, 5); // Ensure max 5 results
  } catch (error) {
    console.error("Error searching products:", error);
    throw new Error("Failed to search for products. Please try again.");
  }
};

// CHAT COMPLETION FOR SUMMARIZING REVIEWS AND GETTING TOPICS
export const analyzeProductReviews = async (url: string): Promise<AnalysisResult> => {
  const prompt = `
    Analyze the following Amazon product URL (or product name if it looks like one).
    Simulate reading hundreds of customer reviews for this product.
    
    Product URL/Name: ${url}
    
    Provide a comprehensive summary of the overall opinion and sentiment.
    Then, extract up to 8 of the most commonly reviewed/talked about topics for that product.
    For each topic, assign an overall sentiment score clamped between -1.0 (extremely negative) and 1.0 (extremely positive).
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // BEST FOR LOW COST AND SPEED
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: 'A concise summary of the overall opinion and sentiment of the product based on simulated reviews.',
            },
            topics: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: {
                    type: Type.STRING,
                    description: 'The name of the topic (e.g., "Battery Life", "Build Quality").',
                  },
                  sentiment: {
                    type: Type.NUMBER,
                    description: 'Sentiment score from -1.0 to 1.0.',
                  },
                },
                required: ['name', 'sentiment'],
              },
              description: 'List of up to 8 most discussed topics.',
            },
          },
          required: ['summary', 'topics'],
        },
      },
    });

    if (!response.text) {
      throw new Error("No response text received from Gemini.");
    }

    const result = JSON.parse(response.text) as AnalysisResult;
    
    // Ensure topics are clamped and limited to 8
    result.topics = result.topics.slice(0, 8).map(t => ({
      ...t,
      sentiment: Math.max(-1, Math.min(1, t.sentiment))
    }));

    return result;
  } catch (error) {
    console.error("Error analyzing reviews:", error);
    throw new Error("Failed to analyze reviews. Please try again.");
  }
};

// CREATE THE REVIEW CHATBOT
export const createReviewChatSession = (analysisContext: AnalysisResult): Chat => {
  const systemInstruction = `
    You are an AI assistant helping a user understand Amazon reviews for a specific product.
    Use the following analysis as your primary context for answering questions.
    
    Context Analysis:
    Summary: ${analysisContext.summary}
    Topics: ${analysisContext.topics.map(t => `${t.name} (Sentiment: ${t.sentiment})`).join(', ')}
    
    Answer the user's questions based on this context. If they ask something outside this context, 
    you can make reasonable assumptions based on typical product reviews for similar items, but clarify that it's a general assumption.
    Keep answers concise and helpful.
  `;

  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction,
    },
  });
};
