import { GoogleGenAI, Type, Schema } from "@google/genai";
import { BlueprintSpec } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// --- Spec Generation (Thinking Mode) ---

const specSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    material: { type: Type.STRING, description: "Recommended material. Return pure plain text only, no markdown formatting." },
    weight: { type: Type.STRING, description: "Estimated weight. Return pure plain text only." },
    dimensions: { type: Type.STRING, description: "Estimated dimensions. Return pure plain text only." },
    engineeringAnalysis: { type: Type.STRING, description: "Technical analysis. Return pure plain text only. Do not use asterisks, bolding, or bullet points." }
  },
  required: ["material", "weight", "dimensions", "engineeringAnalysis"]
};

export const generateBlueprintSpecs = async (description: string): Promise<BlueprintSpec> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Generate a detailed technical specification for the following mechanical concept: "${description}". 
      Focus on realism, industrial feasibility, and high-performance materials. 
      IMPORTANT: Return all fields as clean, plain text strings. Do NOT use Markdown, asterisks (**), hashtags (#), or bullet points.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: specSchema,
        thinkingConfig: {
          thinkingBudget: 32768, // Max budget for complex engineering reasoning
        }
      }
    });

    if (response.text) {
      const data = JSON.parse(response.text) as BlueprintSpec;
      
      // Post-processing sanitization to ensure no markdown slips through
      const cleanup = (str: string) => str.replace(/[\*#`_]/g, '').trim();
      
      return {
        material: cleanup(data.material),
        weight: cleanup(data.weight),
        dimensions: cleanup(data.dimensions),
        engineeringAnalysis: cleanup(data.engineeringAnalysis)
      };
    }
    throw new Error("No text returned from Gemini");
  } catch (error) {
    console.error("Spec generation error:", error);
    // Fallback data in case of error
    return {
      material: "Unknown Alloy",
      weight: "Pending Analysis",
      dimensions: "Pending Analysis",
      engineeringAnalysis: "Automated generation failed. Please check connection or API limits."
    };
  }
};

// --- Image Generation ---

export const generateBlueprintImage = async (description: string): Promise<string> => {
  try {
    // Using Imagen 4 for high-quality blueprint generation
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: `Generate a photorealistic image of ${description}, in the style of a high-contrast technical blueprint, white lines on dark blue grid paper, isometric view, hyper-detailed, 8k resolution.`,
      config: {
        numberOfImages: 1,
        aspectRatio: '1:1',
        outputMimeType: 'image/jpeg'
      }
    });

    const base64 = response.generatedImages?.[0]?.image?.imageBytes;
    if (base64) {
      return `data:image/jpeg;base64,${base64}`;
    }

    throw new Error("No image data returned from model");
  } catch (error) {
    console.error("Image generation error:", error);
    throw error;
  }
};

// --- Image Analysis ---

export const analyzeUploadedImage = async (file: File, prompt: string): Promise<string> => {
  try {
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: file.type,
              data: base64Data
            }
          },
          {
            text: prompt || "Analyze this technical drawing/image. Identify components, materials, and potential engineering function."
          }
        ]
      }
    });

    return response.text || "Analysis completed but no text was returned.";
  } catch (error) {
    console.error("Analysis error:", error);
    return "Error during analysis processing.";
  }
};

// --- Chat Assistant ---

export const createChatSession = () => {
  return ai.chats.create({
    model: "gemini-3-pro-preview",
    config: {
      systemInstruction: "You are an expert Senior Mechanical Engineer and Industrial Designer assisting a user in a prototyping software called 'Kinzoku'. Provide concise, technical, and helpful answers regarding materials, physics, manufacturing processes (CNC, 3D printing, injection molding), and design mechanics. Use technical terminology appropriate for the field."
    }
  });
};