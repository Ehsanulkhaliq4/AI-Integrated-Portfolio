const fs = require('fs');

// Path to the environment file
const targetPath = './src/environments/environment.prod.ts';

const envConfigFile = `export const environment = {
   production: true,
   openAIApiKey: '${process.env.NG_APP_API_KEY_PLACEHOLDER}',
   openAIApiUrl: '${process.env.openAIApiUrl || 'https://api.openai.com/v1/chat/completions'}'
};
`;

fs.writeFileSync(targetPath, envConfigFile);
console.log('Environment file generated successfully!');