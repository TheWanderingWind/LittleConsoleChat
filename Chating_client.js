const net = require("net")
const readline = require("readline");
const { clearTimeout } = require("timers");

let connect_data = {
  port: 8080,
  host: "127.0.0.1",
  timeout: 300000 // 5 min
}

/**
 * Creating client connection
 * @param {object} param0 
 * @returns connected socket 
 */
function makeConnect({port = 8080, host = "127.0.0.1", timeout = 30000} = {}) {
  return new Promise((resolve, reject) => {
    // connections create
    const client = net.createConnection( {port, host}, () => {
      insertLineAbove(`Успішне підключення до ${host}`, connected_rl);
    });

    // timeout setup
    // function for close socket (for easier use)
    function closeConnect() {
      client.end();
      insertLineAbove("З'єднання закрито через неактивність тої сторони");
      startRegularConsole();
    }
    let timeout_obj = setTimeout(closeConnect, timeout);

    // connections event bind
    // on get data
    client.on("data", (data) => {
      insertLineAbove(host + " >> " + data.toString(), connected_rl);

      // reset timeout timer
      clearTimeout(timeout_obj);
      timeout_obj = setTimeout(closeConnect, timeout);
    });

    // on close connection
    client.on("close", () => {
      clearTimeout(timeout_obj);
    });

    // on error
    client.on("error", (err) => {
      reject(err);
    });

    client.on("connect", () => {
      resolve(client);
    });

    // function for sending message
    client.send = (message) => {
      if (!client.destroyed) {
        client.write(message);
        // reset timeout timer
        clearTimeout(timeout_obj);
        timeout_obj = setTimeout(closeConnect, timeout);
      } else {
        console.log("Нема підключення, щоб відправити повідомлення");
      }
    }

    
  });
}


function isValidIPv4(ip) {
  const ipv4Regex = /^(25[0-5]|2[0-4]\d|1\d{2}|\d{1,2})(\.(25[0-5]|2[0-4]\d|1\d{2}|\d{1,2})){3}$/;
  return ipv4Regex.test(ip);
}

function isValidIPv6(ip) {
  const ipv6Regex1 = /^([0-9a-fA-F]{4}:){7}([0-9a-fA-F]{4})$/
  const ipv6Regex2 = /^([0-9a-fA-F]{4}:){,6}([0-9a-fA-F]{4})::([0-9a-fA-F]{4}:){,6}([0-9a-fA-F]{4})$/
  const ipv6Regex3 = /^::1$/
  return ipv6Regex1.test(ip) || ipv6Regex2.test(ip) || ipv6Regex3.test(ip);
}

function isValidPort(port) {
  const portNumber = parseInt(port, 10);
  return portNumber >= 0 && portNumber <= 65535;
}

function parceIPv4andPort(input) {
  const match = input.split(":");
  if (match.length == 2) {
    if (isValidIPv4(match[0]) && isValidPort(match[1])) return match;
  }
  return false;
}

function parceIPv6andPort(input) {
  const match = input.match(/^\[(.*)\]:(\d+)$/);
  if (match) {
    if (isValidIPv6(match[1]) && isValidPort(match[2])) return match;
  }
  return false;
}

/** Readline snterface when not connected */
let regular_rl = readline.createInterface(process.stdin, process.stdout);
regular_rl.setPrompt(">> ");

/** Readline snterface when connected */
let connected_rl;

/** A buffer for storing input */
let currentInput = '';

/** TCP socket */
let connected_socket;

// storing to buffer input
regular_rl.input.on('data', (char) => {
  if (char == String.fromCharCode(13)) {
    // Enter key pressed, reset current input
    currentInput = '';
  } else {
    currentInput += char;
  }
});

/**
 * Insert string before input line in console
 * @param {*} text string for output
 */
function insertLineAbove(text, rl = regular_rl) {
  // Clear current input line
  readline.clearLine(process.stdout, 0);
  readline.cursorTo(process.stdout, 0);

  // Write text and prompt + buffered input
  console.log(text);
  if (rl) rl.prompt();
  process.stdout.write(currentInput);
}


/**
 * Cycling regular readline interface
 */
function ask() {
  regular_rl.question(regular_rl.getPrompt(), (answer) => {
    let words = answer.split(" ").filter(element => element !== "");

    // connect to server
    if (words[0] == "connect") {
      // when 'connect' without ip and port
      if (words.length == 1) {
        startConnectedConsole();
      // when 'connect' whith one argument
      } else if (words.length == 2) {
        // it's IPv6
        if (isValidIPv6(words[1])) {
          connect_data.host = '['+words[1]+']';
          startConnectedConsole();
        // it's IPv4
        } else if (isValidIPv4(words[1])) {
          connect_data.host = words[1];
          startConnectedConsole();
        // it's IPv6+Port
      } else if (parceIPv6andPort(words[1])) {
          let temp = parceIPv6andPort(words[1]);
          connect_data.host = '['+temp[1]+']';
          connect_data.port = temp[2];
          startConnectedConsole();
        // it's IPv4+Port
        } else if (parceIPv4andPort(words[1])) {
          let temp = parceIPv4andPort(words[1]);
          connect_data.host = temp[0];
          connect_data.port = temp[1];
          startConnectedConsole();
        // it's Port
        } else if (isValidPort(words[1])) {
          connect_data.port = words[1];
          startConnectedConsole();
        } else {
          console.log(`Не коректний формат вводу: ${words[1]}`)
          ask();
        }
      // when 'connect' whith two argument
      } else if (words.length == 3) {
        if (isValidIPv4(words[1]) || isValidIPv6(words[1]) && isValidPort(words[2])) {
          if (isValidIPv4(words[1])) connect_data.host = words[1];
          else connect_data.host = '['+words[1]+']';
          connect_data.port = words[2];
          startConnectedConsole();
        } else {
          console.log("Не коректний формат вводу");
          ask();
        }
      // when 'connect' whith two and more argument
      } else {
        console.log("Забагато аргументів");
        ask();
      }
    // exit 
    } else if (answer == "exit") {
      regular_rl.close();
    // new port
    } else if (words[0] == "port") {
      if (isValidPort(words[1])) {
        connect_data.port = words[1];
        console.log(`Новий порт тепер ${connect_data.port}`);
      // Uncorrect port
      } else {
        console.log(`'${words[1]}' не валідний порт`);
      }
      ask();
    // new IP
    } else if (words[0] == "ip") {
      // IPv4
      if (isValidIPv4(words[1])) {
        connect_data.host = words[1];
        console.log(`Новий IP тепер ${connect_data.host}`);
      // IPv6
      } else if (isValidIPv6(words[1])) {
        connect_data.host = '['+words[1]+']';
        console.log(`Новий IP тепер ${connect_data.host}`);
      // Uncorrect IP
      } else {
        console.log(`'${words[1]}' не валідний IP`);
      }
      ask();
    // help
    } else if (answer == "help") {
      console.log("Довідник ще не готовий")
      ask();
    // Uncorrect command
    } else {
      console.log("Невідома команда '"+answer+"'");
      ask();
    }
  })
}


/**
 * Cycling readline interface when connected
 */
function sending() {
  connected_rl.question(connected_rl.getPrompt(), (answer) => {
    // disconnect
    if (answer == "%exit" || answer == "%disconnect") {
      startRegularConsole();
    // send message
    } else {
      connected_socket.send(answer);
      sending();
    }
  });
}


/**
 * Starting regular console 
 */
function startRegularConsole() {
  connected_socket.end()
  connected_rl.close();
  regular_rl = readline.createInterface(process.stdin, process.stdout);
  regular_rl.setPrompt(">> ")
  console.log("Введіть help для отримання довідки");
  ask();
}


/**
 * Starting connected console 
 */
function startConnectedConsole() {
  console.log(`Спроба під'єднатись до ${connect_data.host}:${connect_data.port}...`)
  makeConnect(connect_data)
    .then((socket) => {
      connected_socket = socket;
      regular_rl.close();
      connected_rl = readline.createInterface(process.stdin, process.stdout);
      connected_rl.setPrompt(`${connect_data.host} << `);
      console.log("Введіть %exit щоб закрити з'єднання");
      sending();
    })
    .catch((err) => {
      console.log("Помилка з'єднання");
      console.log(err);
      ask();
    });
}


// start program
console.log("Введіть help для отримання довідки");
ask();
