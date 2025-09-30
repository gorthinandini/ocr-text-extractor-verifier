import { GoogleGenAI, Type } from "@google/genai";
import { FormData, VerificationResult, ImageQualityReport } from '../types';

// API 1: OCR Extraction API
export const extractDataFromImage = async (base64Image: string, mimeType: string, documentType: string): Promise<FormData> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable is not set.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const imagePart = {
        inlineData: {
            mimeType: mimeType,
            data: base64Image,
        },
    };

    let contextInstructions = "It could be any type of document like a form, ID card, handwritten note, or certificate.";
    switch (documentType) {
        case 'id_card':
            contextInstructions = "This is an ID card. Prioritize extracting fields like 'First Name', 'Last Name', 'Date of Birth', 'ID Number', 'Address', 'Gender', 'Issue Date', and 'Expiration Date'.";
            break;
        case 'invoice':
            contextInstructions = "This is an invoice. Prioritize extracting fields like 'Invoice Number', 'Issue Date', 'Due Date', 'Billed To', 'From', 'Subtotal', 'Tax', 'Total Amount', and any line items with description and price.";
            break;
        case 'receipt':
            contextInstructions = "This is a receipt. Prioritize extracting fields like 'Merchant Name', 'Date', 'Time', 'Total Amount', 'Tax', 'Payment Method', and a list of purchased items.";
            break;
    }

    const prompt = `
        You are an expert Optical Character Recognition (OCR) system.
        Analyze the provided image of a document.
        CONTEXT: ${contextInstructions}
        
        Extract all identifiable fields and their corresponding values based on the provided context.
        Return the result as a single, clean JSON object.
        The keys should be descriptive, human-readable labels for the fields (e.g., 'First Name', 'Date of Birth', 'Address').
        The values should be the text extracted for those fields.
        Do not include any explanatory text, markdown syntax like \`\`\`json, or backticks in your response.
        Only return the raw JSON object. If no data can be extracted, return an empty JSON object {}.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, { text: prompt }] },
            config: {
                responseMimeType: "application/json",
            }
        });

        const textResponse = response.text;
        
        const cleanedJsonString = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();

        if (!cleanedJsonString) {
            console.warn("Gemini returned an empty response.");
            return {};
        }

        const parsedData: FormData = JSON.parse(cleanedJsonString);
        return parsedData;

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Failed to extract data from image. The Gemini API call failed.");
    }
};

// API 2: AI-Powered Data Verification
export const verifyDataWithGemini = async (
    base64Image: string,
    mimeType: string,
    userSubmittedData: FormData
): Promise<VerificationResult> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable is not set.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const imagePart = {
        inlineData: {
            mimeType: mimeType,
            data: base64Image,
        },
    };

    const prompt = `
        You are an expert document verifier. I will provide you with an image of a document and a JSON object of data that was supposedly extracted from it.
        Your task is to carefully compare each field from the JSON object with the information present in the image.

        For each field, determine if the provided value matches the image.
        Provide your verification results in a single JSON object.
        The keys of this JSON object must be the exact same keys as in the input JSON.
        For each key, the value should be an object with two properties:
        1. "match": a boolean value (true if the value matches the image, false otherwise).
        2. "reason": a brief, one-sentence string explaining why there is a mismatch. If it is a match, this field should be omitted or be an empty string.

        Here is the data to verify:
        ${JSON.stringify(userSubmittedData, null, 2)}
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, { text: prompt }] },
            config: {
                responseMimeType: "application/json",
            }
        });

        const textResponse = response.text;
        const cleanedJsonString = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();

        if (!cleanedJsonString) {
            throw new Error("AI verifier returned an empty response.");
        }

        const parsedData: VerificationResult = JSON.parse(cleanedJsonString);
        return parsedData;

    } catch (error) {
        console.error("Error calling Gemini API for verification:", error);
        throw new Error("Failed to verify data with AI. The Gemini API call failed.");
    }
};

// API 3: Image Quality Analysis
export const analyzeImageQuality = async (
    base64Image: string,
    mimeType: string
): Promise<ImageQualityReport> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable is not set.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const imagePart = {
        inlineData: {
            mimeType: mimeType,
            data: base64Image,
        },
    };

    const prompt = `
        You are an expert image quality analyst specializing in Optical Character Recognition (OCR).
        Your task is to analyze the provided image of a document and determine if its quality is sufficient for accurate OCR.
        Consider factors like: blurriness, glare, shadows, contrast, lighting, resolution, and if the document is oriented correctly (not upside down or sideways).

        Based on your analysis, provide a structured JSON response with the following fields:
        1. "isGoodQuality": A boolean value. Set to 'true' if the image is good enough for reliable OCR, 'false' otherwise. Generally, a score of 70 or above is considered good quality.
        2. "score": An integer score from 0 to 100 representing the overall quality of the image for OCR. 0 is completely unreadable, 100 is perfect.
        3. "feedback": An array of short, actionable strings providing feedback to the user on how to improve the image quality. For example, "Image appears blurry, try to hold the camera steady." or "Increase contrast for better text readability." If the quality is perfect, provide a message like "Excellent image quality."
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, { text: prompt }] },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        isGoodQuality: { type: Type.BOOLEAN },
                        score: { type: Type.INTEGER },
                        feedback: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        }
                    },
                    required: ["isGoodQuality", "score", "feedback"],
                }
            }
        });

        const textResponse = response.text;
        const cleanedJsonString = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();

        if (!cleanedJsonString) {
            throw new Error("AI quality analyst returned an empty response.");
        }

        const parsedData: ImageQualityReport = JSON.parse(cleanedJsonString);
        return parsedData;

    } catch (error) {
        console.error("Error calling Gemini API for image quality analysis:", error);
        throw new Error("Failed to analyze image quality. The Gemini API call failed.");
    }
};