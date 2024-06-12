const net = require("net")
const readline = require("readline")

const server = net.createServer((socket) => {
  console.log("Під'єднаний клієнт");

  socket.on("data", (data) => {
    console.log("Отримані дані:", data.toString());
    socket.write("Автоматична відповідь сервера")
  });

  socket.on("end", () => {
    console.log("Клієнт від'єднався")
  });

  socket.on("error", (err) => {
    console.log("Помилка:");
    console.log(err);
  });
});

server.listen(8080, "127.0.0.1", () => {
  console.log("Прослухається порт 8080");
});