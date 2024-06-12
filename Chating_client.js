const net = require("net")
const readline = require("readline")


function createConnect(data = {
  port: 8080,
  host: "127.0.0.1"
}) {
  const client = net.createConnection(
    data,
    () => {
    console.log("Підключення до сервера");
  });
  
  client.on("data", (data) => {
    console.log(">>", data.toString());
  });
  
  client.on("end", () => {
    console.log("відключення від сервера")
  });
  
  client.on("error", (err) => {
    console.log("Помилка:");
    console.log(err);
  });

  return client
}