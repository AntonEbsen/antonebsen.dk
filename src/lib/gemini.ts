
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.warn("WARN: GEMINI_API_KEY is not set in environment variables. AI features will be disabled.");
}

const genAI = new GoogleGenerativeAI(API_KEY || "mock-key");

// Use Gemini 2.0 Flash as requested
export const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
