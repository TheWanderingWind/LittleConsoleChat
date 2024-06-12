const net = require("net")
const readline = require("readline")


let connected_socket;

function makeConnect(data = {
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

function send(message) {
  if (connected_socket) {
    connected_socket.write(message);
  } else {
    console.log("Не підключений до сервера");
  }
}

connected_socket = makeConnect();
send("Тестове повідомлення");
send("Друге тестове повідомлення");

setTimeout(() => {
  connected_socket.end()
  console.log("З'єднання закрито автоматично")
}, 3000)