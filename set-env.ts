const fs = require('fs');
const targetPath = './src/environments/environment.prod.ts';


const envConfigFile = `export const environment = {
   production: true,
   apiKey: '${process.env.NG_APP_API_KEY_PLACEHOLDER}',
   apiUrl: '${process.env.openAIApiUrl || 'https://api.openai.com/v1/chat/completions'}',
};
`;

fs.writeFile(targetPath, envConfigFile, (err: Error | null) => {
   if (err) {
       console.error(err);
       throw err;
   }
   console.log(`Angular environment.prod.ts file generated correctly at ${targetPath}`);
});