// Load environment variables
require('dotenv').config();

// Import the Gemini library
const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiModel {
  /**
   * model list: gemini-2.0-flash, gemini-2.5-flash, gemini-2.5-pro
   */
  constructor(modelName = 'gemini-2.0-turbo') {
    this.modelName = modelName;

    const apiKey = process.env.Gemini_api_key;
    if (!apiKey) {
      throw new Error('Gemini_api_key not found in environment variables.');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);

    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        temperature: 0.2,
        topP: 0.8,
        topK: 64,
        maxOutputTokens: 8192,
      },
    });
  }

  async generate(prompt) {
    const result = await this.model.generateContent([prompt]);
    const response = await result.response;
    return response.text();
  }
}

module.exports = GeminiModel;
