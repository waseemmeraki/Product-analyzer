const OpenAI = require('openai');
require('dotenv').config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function testOpenAI() {
  try {
    console.log('Testing OpenAI API connection...');
    
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: 'Hello, please respond with just "Hello World"'
        }
      ],
      max_tokens: 10,
      temperature: 0
    });

    console.log('OpenAI API Response:', response.choices[0]?.message?.content);
    console.log('✅ OpenAI API is working!');
  } catch (error) {
    console.error('❌ OpenAI API Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testOpenAI();