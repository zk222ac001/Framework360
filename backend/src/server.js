require('dotenv').config();

const { validateEnv } = require('./config/env');
const app = require('./app');

validateEnv();

const port = Number(process.env.PORT) || 3000;

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});
