// // netlify/functions/chat.js
// exports.handler = async (event) => {
//   // Add CORS headers so your Angular app can talk to this function
//   const headers = {
//     'Access-Control-Allow-Origin': '*',
//     'Access-Control-Allow-Headers': 'Content-Type',
//     'Access-Control-Allow-Methods': 'POST, OPTIONS'
//   };

//   if (event.httpMethod === "OPTIONS") {
//     return { statusCode: 200, headers, body: "OK" };
//   }

//   try {
//     const { model, messages, max_tokens, temperature } = JSON.parse(event.body);
    
//     const response = await fetch('https://api.openai.com/v1/chat/completions', {
//       method: 'POST',
//       headers: {
//         'Authorization': `Bearer ${process.env.NG_APP_API_KEY_PLACEHOLDER}`,
//         'Content-Type': 'application/json'
//       },
//       body: JSON.stringify({
//         model: 'gpt-3.5-turbo', // Start with this to ensure it works
//         messages,
//         max_tokens,
//         temperature
//       })
//     });

//     const data = await response.json();

//     return {
//       statusCode: response.status,
//       headers,
//       body: JSON.stringify(data)
//     };
//   } catch (error) {
//     return {
//       statusCode: 500,
//       headers,
//       body: JSON.stringify({ error: error.message })
//     };
//   }
// };


// netlify/functions/chat.js
exports.handler = async (event, context) => {
  console.log('=== CHAT FUNCTION CALLED ===');
  console.log('HTTP Method:', event.httpMethod);
  console.log('Path:', event.path);
  console.log('Has body:', !!event.body);
  console.log('Environment check - OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    console.log('Handling OPTIONS preflight');
    return { statusCode: 200, headers, body: "OK" };
  }

  // Only handle POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    console.log('Parsing request body...');
    const requestBody = JSON.parse(event.body);
    console.log('Request body parsed:', JSON.stringify(requestBody, null, 2));
    
    const { 
      model = 'gpt-3.5-turbo', 
      messages, 
      max_tokens = 300, 
      temperature = 0.7 
    } = requestBody;
    
    console.log('Model:', model);
    console.log('Messages count:', messages?.length);
    
    // Get API key from Netlify environment
    const apiKey = process.env.OPENAI_API_KEY;
    console.log('API Key exists:', !!apiKey);
    console.log('API Key first 10 chars:', apiKey ? `${apiKey.substring(0, 10)}...` : 'MISSING');
    
    if (!apiKey) {
      console.error('ERROR: OPENAI_API_KEY environment variable is not set');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Server configuration error: OpenAI API key is not set',
          details: 'Please configure OPENAI_API_KEY in Netlify environment variables'
        })
      };
    }

    if (!messages || !Array.isArray(messages)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Messages array is required' })
      };
    }

    console.log('Making request to OpenAI API...');
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens,
        temperature
      })
    });

    console.log('OpenAI response status:', openaiResponse.status);
    console.log('OpenAI response headers:', Object.fromEntries(openaiResponse.headers.entries()));
    
    const responseData = await openaiResponse.json();
    console.log('OpenAI response data:', JSON.stringify(responseData, null, 2));

    return {
      statusCode: openaiResponse.status,
      headers,
      body: JSON.stringify(responseData)
    };

  } catch (error) {
    console.error('Unhandled error in chat function:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
};