const WebSocket = require("ws");
var ProtoBuf = require("protobufjs");
const io = require("socket.io-client");

("use strict");

let Message = ProtoBuf.loadProtoFile("./PricingData.proto", (err, builder) => {
  Message = builder.build("PricingData");
  loadMessage();
});

var useSocket = false;
let socketClientID = "xyz";

const socket = io("http://localhost:3200");
if (useSocket) {
  socket.on("connect", () => {
    console.log("Socket ID: " + socket.id);
    socketClientID = socket.id;
  });
}

let loadMessage = () => {
  const url = "wss://streamer.finance.yahoo.com";
  const connection = new WebSocket(url);

  connection.onopen = () => {
    connection.send('{"subscribe":["TATASTEEL.NS"]}');
  };

  connection.onerror = (error) => {
    console.log(`WebSocket error: ${error}`);
  };

  connection.onmessage = (e) => {
    let msg = Message.decode(e.data);
    console.log("All data set: ", msg);
    console.log("Decoded message", msg.id + " with price: " + msg.price);

    var trackedData = {
      name: msg.id,
      price: msg.price,
      identifier: hashCode(msg.id),
      sender: "Yahoo",
      clientid: socketClientID,
      symbol: msg.id,
    };

    if (useSocket) {
      socket.emit("tracked", trackedData);
    }
  };
};

function hashCode(str) {
  var hash = 0,
    i,
    chr;
  for (i = 0; i < str.length; i++) {
    chr = str.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0;
  }
  if (hash < 0) {
    hash = hash * -1;
  }
  return hash;
}
