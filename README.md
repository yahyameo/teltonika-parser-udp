# Direct Implementation with UDP Server
```javascript
const dgram = require('dgram');
const server = dgram.createSocket('udp4');
const Parser=require("teltonika-parser-udp");
server.on('error', (err) => {
  server.close();
});

server.on('message', (msg, rinfo) => {
  var line;
  if (/\ufffd/.test(msg) === true) {
    line = new Buffer(msg, 'ascii').toString('hex');
  } else {
    line = msg.toString();
  }
  const parser=new Parser(line);
  //send response to the device
  const response = "0005" + line.substr(4, 8) + line.substr(48, 2);
  var resBuffer = new Buffer(response);
  server.send(resBuffer, 0, resBuffer.length, rinfo.port, rinfo.address, function (err, bytes) {
    if (err) {
      throw err;
    }
  });
});

server.on('listening', () => {
  const address = server.address();
  console.log('server listening ');
});
server.bind(3815);
```