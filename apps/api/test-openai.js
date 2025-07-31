const OpenAI = require('openai');
require('dotenv').config();

async function testOpenAI() {
  try {
    console.log('Testing OpenAI connection...');
    
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    console.log('✅ OpenAI client created successfully');
    
    // Test with a simple completion
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant. Respond with a simple JSON object.'
        },
        {
          role: 'user',
          content: 'Return this exact JSON: {"test": "success", "status": "working"}'
        }
      ],
      temperature: 0,
      max_tokens: 50,
    });
    
    const content = response.choices[0]?.message?.content;
    console.log('✅ OpenAI API response:', content);
    
    // Test JSON parsing
    const parsed = JSON.parse(content);
    console.log('✅ JSON parsing successful:', parsed);
    
  } catch (error) {
    console.error('❌ OpenAI test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testOpenAI();