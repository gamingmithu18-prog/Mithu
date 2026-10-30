const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('<h1>LAKSHAN-MD Pair Site Working! 🔥</h1><p>Now we will add pair code</p>');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log('Server running on ' + PORT));
