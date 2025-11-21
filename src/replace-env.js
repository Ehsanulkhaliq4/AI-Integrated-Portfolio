const fs = require('fs');
const path = require('path');

console.log('Starting environment variable replacement...');

const envFilePath = path.join(__dirname, 'src', 'environments', 'environment.prod.ts');

// Check if file exists
if (!fs.existsSync(envFilePath)) {
  console.error('Error: environment.prod.ts file not found!');
  process.exit(1);
}

let content = fs.readFileSync(envFilePath, 'utf8');

// Replace Netlify environment variables
const envVars = {
  'NETLIFY_OPENAI_API_KEY': process.env.OPENAI_API_KEY || ''
};

Object.keys(envVars).forEach(key => {
  const value = envVars[key] || '';
  content = content.replace(new RegExp(key, 'g'), value);
  console.log(`Replaced ${key}: ${value ? '***' + value.slice(-4) : 'NOT FOUND'}`);
});

fs.writeFileSync(envFilePath, content, 'utf8');
console.log('Environment file updated successfully!');