var Device = require('./device');
var Block = require('./block');
var BlockChain = require('./chain');
var uuidv1 = require('uuid/v1');
var cluster = require('cluster');

const deviceChain = new BlockChain();
if (cluster.isMaster) {
    var cpuCores = require('os').cpus();
    console.log("Number of CPU cores: " + cpuCores.length);
    cpuCores.forEach(cpuCore => {
        let worker = cluster.fork();
        console.log("Worker created with id: " + worker.id);
    });
} else {
    var express = require('express');
    var app = express();
    app.use(express.json());

    app.post('/device', (req, res) => {
        console.log("Request for device registration.." + cluster.worker.id);
        let id = req.body.id;
        if (deviceChain.hasBlockForDeviceId(id)) {
            res.status(409);
        } else {
            res.status(201);
            res.send({ status: 'queued' });
            registerDevice(id);
        }
        res.end();
    });

    app.get('/chain', (req, res) => {
        console.log("Request for chain.." + cluster.worker.id);
        res.json(deviceChain.getChain());
        res.status(200);
    });

    app.listen(8080, () => {
        deviceChain.init();
    });

    function registerDevice(id) {
        var device1 = new Device(id);
        var block1 = new Block(Date.now(), device1);
        deviceChain.addBlock(block1);
    }
}
