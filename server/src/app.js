const exptress = require('express');


const app = exptress();


app.get('/', (req, res) => {
    res.send('Hello World');
});

module.exports = app;