const axios = require('axios');

exports.handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { model, messages, max_tokens, temperature } = JSON.parse(event.body);
    
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model,
      messages,
      max_tokens,
      temperature
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.NG_APP_API_KEY_PLACEHOLDER}`,
        'Content-Type': 'application/json'
      }
    });

    return {
      statusCode: 200,
      body: JSON.stringify(response.data)
    };
  } catch (error) {
    return {
      statusCode: error.response ? error.response.status : 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};