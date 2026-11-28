import express from 'express';

const app = express();
const port = Number(process.env.PORT ?? 3001);

app.listen(port, '127.0.0.1', () => {
  console.log(`HW1 backend scaffold listening on 127.0.0.1:${port}`);
});
