import 'dotenv/config';
import express from 'express';
import { MongoClient } from 'mongodb';

const app = express();
const port = process.env.PORT || 3000;
const mongoUri = process.env.MONGODB_URI;

async function startServer() {
  if (!mongoUri) {
    throw new Error('MONGODB_URI is not set. Add it to Backend/.env before starting the API.');
  }

  const mongoClient = new MongoClient(mongoUri);
  await mongoClient.connect();
  await mongoClient.db().command({ ping: 1 });

  app.get('/api/health', (_request, response) => {
    response.json({
      status: 'ok',
      database: 'connected',
      message: 'Party Everyday API is running.'
    });
  });

  app.listen(port, () => {
    console.log(`Party Everyday API listening on port ${port}`);
    console.log('MongoDB connection verified.');
  });
}

startServer().catch((error) => {
  const errorType = error instanceof Error ? error.name : 'Unknown error';
  console.error(`Unable to start the API (${errorType}). Verify MONGODB_URI, the database user, and the Atlas IP access list.`);
  process.exitCode = 1;
});
