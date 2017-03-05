const cluster = require('cluster');
const numCPUs = 1;

if (cluster.isMaster) {
  console.info('Master cluster setting up ' + numCPUs + ' workers...');

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('online', function(worker) {
    console.info('Worker ' + worker.process.pid + ' is online');
  });

  cluster.on('exit', function(worker, code, signal) {
    const pid = worker.process.pid;
    console.warn(`Worker ${pid} died with code: ${code} and signal: ${signal}`);
    console.info('Starting a new worker');
    cluster.fork();
  });
} else {
  require('./server');
}
