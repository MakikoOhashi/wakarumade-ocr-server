import fetch from 'node-fetch';
import fs from 'fs';

// Read the proper test image
const testData = JSON.parse(fs.readFileSync('test_data.json', 'utf8'));
console.log('Using test image with base64 length:', testData.imageBase64.length - 'data:image/jpeg;base64,'.length);

fetch('http://localhost:3333/ocr', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(testData)
})
.then(response => {
  console.log('Status:', response.status);
  return response.json();
})
.then(data => {
  console.log('Response:', data);
})
.catch(error => {
  console.error('Error:', error);
});
