import express from 'express';

const app = express();
const port = Number(process.env.PORT ?? 3002);

app.listen(port, '127.0.0.1', () => {
  console.log(`HW2 backend scaffold listening on http://127.0.0.1:${port}`);
});
