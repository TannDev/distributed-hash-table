import NetworkConfig from './classes/NetworkConfig';

import Express = require('express');

const app = Express();

const networkConfig = new NetworkConfig();

console.log(networkConfig.toString());
console.log(networkConfig.serialize());
console.log(networkConfig);

app.get('/', (req, res) => {
    res.json(networkConfig.serialize());
})

app.listen(8080, () => {
    console.log(`Listening on http://localhost:8080`);
})