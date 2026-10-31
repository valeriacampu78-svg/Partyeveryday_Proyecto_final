import express from 'express';

const app = express();
const port = process.env.PORT || 3000;

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok', message: 'Party Everyday API is running.' });
});

app.listen(port, () => {
  console.log(`Party Everyday API listening on port ${port}`);
});
