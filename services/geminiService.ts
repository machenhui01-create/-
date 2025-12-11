import { GoogleGenAI } from "@google/genai";
import { AspectRatio } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Sends the image and prompt to Gemini to generate a refined product image.
 * 
 * @param base64Image The base64 string of the source image (including data:image/... prefix)
 * @param customInstruction Optional user instructions
 * @param aspectRatio Desired aspect ratio
 * @returns The base64 string of the generated image or null if failed
 */
export const refineProductImage = async (
  base64Image: string, 
  customInstruction: string = "",
  aspectRatio: AspectRatio = AspectRatio.SQUARE
): Promise<string | null> => {
  
  try {
    // Strip the data URL prefix to get raw base64
    const base64Data = base64Image.split(',')[1];
    const mimeType = base64Image.substring(base64Image.indexOf(':') + 1, base64Image.indexOf(';'));

    // Construct a strong prompt for e-commerce excellence
    const prompt = `
      Act as a professional high-end product photographer and photo retoucher. 
      Transform the input image into a high-definition, studio-quality e-commerce main product image (Hero Shot).
      
      Requirements:
      1. Lighting: Use professional studio lighting (softbox/rim lighting) to highlight product details and texture.
      2. Background: Place the product on a clean, neutral background (pure white or very subtle gradient studio gray) suitable for Amazon/Shopify.
      3. Quality: Ensure 4K resolution look, sharp edges, and reduced noise.
      4. Aesthetics: Make the product look premium, expensive, and desirable.
      5. Fixes: Correct any white balance issues, remove dust/scratches if visible, and straighten the perspective if needed.
      
      User specific instructions: ${customInstruction || "Keep the product faithful to the original but significantly enhance the visual appeal."}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType
            }
          },
          {
            text: prompt
          }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio,
          // count: 1 // Default is 1
        }
      }
    });

    // Extract image from response
    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    
    throw new Error("No image data received from Gemini.");

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};