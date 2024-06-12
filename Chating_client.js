const { time } = require("console");
const net = require("net")
const readline = require("readline");
const { clearTimeout } = require("timers");


const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

let connect_data = {
  port: 8080,
  host: "127.0.0.1",
  timeout: 30000
}

let connected_socket;

function makeConnect({port = 8080, host = "127.0.0.1", timeout = 30000} = {}) {
  // connections create
  const client = net.createConnection(
    {port, host},
    () => {
    console.log("Підключення до сервера");
  });

    // timeout bind
    function closeConnect() {
      client.end();
      console.log("З'єднання з сервером закрито через неактивність");
    }
  
    let timeout_server = setTimeout(closeConnect, timeout);

  // connections event bind
  client.on("data", (data) => {
    console.log(">>", data.toString());
    // reset timeout timer
    clearTimeout(timeout_server);
    timeout = setTimeout(closeConnect, timeout);
  });
  
  client.on("end", () => {
    console.log("відключення від сервера")
  });
  
  client.on("error", (err) => {
    console.log("Помилка:");
    console.log(err);
  });
  

  client.send = (message) => {
    if (!client.destroyed) {
      client.write(message);
      // reset timeout timer
      clearTimeout(timeout_server);
      timeout = setTimeout(closeConnect, timeout);
    } else {
      console.log("Нема підключення, щоб відправити повідомлення");
    }
  }

  return client
}

connected_socket = makeConnect();
connected_socket.send("Тестове повідомлення");
connected_socket.send("Друге тестове повідомлення");

