// const fs = require('fs');
// const targetPath = './src/environments/environment.prod.ts';

// // This check helps debug if Netlify actually sees your variable
// const apiKey = process.env.NG_APP_API_KEY_PLACEHOLDER;

// if (!apiKey) {
//     console.error('❌ ERROR: NG_APP_API_KEY_PLACEHOLDER is not defined in the environment!');
// }

// const envConfigFile = `export const environment = {
//    production: true,
//    openAIApiKey: '${apiKey || 'MISSING_API_KEY'}',
//    openAIApiUrl: '${process.env.openAIApiUrl || 'https://api.openai.com/v1/chat/completions'}'
// };
// `;

// fs.writeFileSync(targetPath, envConfigFile);
// console.log('Environment file generated successfully!');

const fs = require('fs');
const path = require('path');

// Use an absolute path to be 100% sure where we are writing
const targetPath = path.join(__dirname, 'src', 'environments', 'environment.prod.ts');

const apiKey = process.env.NG_APP_API_KEY_PLACEHOLDER;

// This will show up in your Netlify Build Logs so you can verify the value
console.log(`Writing API Key (first 5 chars): ${apiKey ? apiKey.substring(0, 5) : 'NOT FOUND'}...`);

const envConfigFile = `export const environment = {
   production: true,
   openAIApiKey: '${apiKey}',
   openAIApiUrl: '${process.env.openAIApiUrl || 'https://api.openai.com/v1/chat/completions'}'
};
`;

try {
    fs.writeFileSync(targetPath, envConfigFile, 'utf8');
    console.log(`✅ SUCCESS: environment.prod.ts generated at ${targetPath}`);
} catch (err) {
    console.error('❌ ERROR writing file:', err);
    process.exit(1);
}