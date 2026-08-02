import { createApp } from './app';

const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : 3004;

createApp().listen(port, host, () => {
  console.log(`[ ready ] benefit-aggregation-bff listening at http://${host}:${port}`);
});
