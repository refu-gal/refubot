const express = require('express');
const bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send({message: 'Hello world' });
});

app.listen(3000, () => {
  console.log('Server listening on port ' + 3000);
});
