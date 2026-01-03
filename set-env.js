const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'src', 'environments', 'environment.prod.ts');

const apiKey = process.env.NG_APP_API_KEY_PLACEHOLDER;
const apiUrl = process.env.NG_APP_API_URL_PLACEHOLDER;


const envConfigFile = `export const environment = {
   production: true,
   openAIApiKey: '${apiKey}',
   openAIApiUrl: '${apiUrl}'
};
`;

try {
    fs.writeFileSync(targetPath, envConfigFile, 'utf8');
} catch (err) {
    console.error('❌ ERROR writing file:', err);
    process.exit(1);
}