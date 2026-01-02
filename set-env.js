const fs = require('fs');
const targetPath = './src/environments/environment.prod.ts'; // This path is now correct from the root

const envConfigFile = `export const environment = {
   production: true,
   apiKey: '${process.env.NG_APP_API_KEY_PLACEHOLDER}',
   apiUrl: '${process.env.openAIApiUrl || 'https://api.openai.com/v1'}'
};
`;

fs.writeFileSync(targetPath, envConfigFile);
console.log('Environment file generated successfully!');