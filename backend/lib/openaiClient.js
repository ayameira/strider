import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

let openaiInstance;

function logOpenAICall(payload, response) {
  console.log('==== OpenAI Request ====');
  console.log(JSON.stringify(payload, null, 2));
  console.log('==== OpenAI Response ====');
  console.log(JSON.stringify(response, null, 2));
  console.log('========================');
}

export function getOpenAIClient() {
  if (!openaiInstance) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set in the environment.');
    }

    openaiInstance = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Wrap the chat.completions.create method to add logging
    const originalCreate = openaiInstance.chat.completions.create;
    openaiInstance.chat.completions.create = async function (...args) {
      const payload = args[0];
      try {
        const response = await originalCreate.apply(this, args);
        logOpenAICall(payload, response);
        return response;
      } catch (error) {
        console.error('==== OpenAI Call Failed ====');
        logOpenAICall(payload, { error: error.message });
        console.error('============================');
        throw error;
      }
    };
  }

  return openaiInstance;
}

