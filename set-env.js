const fs = require('fs');
const targetPath = './src/environments/environment.prod.ts';

// This check helps debug if Netlify actually sees your variable
const apiKey = process.env.NG_APP_API_KEY_PLACEHOLDER;

if (!apiKey) {
    console.error('❌ ERROR: NG_APP_API_KEY_PLACEHOLDER is not defined in the environment!');
}

const envConfigFile = `export const environment = {
   production: true,
   openAIApiKey: '${apiKey || 'MISSING_API_KEY'}',
   openAIApiUrl: '${process.env.openAIApiUrl || 'https://api.openai.com/v1/chat/completions'}'
};
`;

fs.writeFileSync(targetPath, envConfigFile);
console.log('Environment file generated successfully!');