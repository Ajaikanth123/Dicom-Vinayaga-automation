import fs from 'fs';
try {
  const data = JSON.parse(fs.readFileSync('backend_logs_json.json', 'utf8'));
  console.log(`Loaded ${data.length} logs.`);
  data.forEach(log => {
    const text = log.textPayload;
    if (text) {
      if (text.includes('Extracted 2D') || 
          text.includes('Failed to convert') ||
          text.includes('Processing') ||
          text.includes('Uploaded 5') ||
          text.includes('Process request received') ||
          text.includes('Extracted')) {
            console.log(`[${log.timestamp}] ${text}`);
          }
    }
  });
} catch(e) {
  console.error(e);
}
