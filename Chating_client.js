const net = require("net")
const readline = require("readline");
const { clearTimeout } = require("timers");

let connectData = {
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
      insertLineAbove(`Успішне підключення до ${host}`, connectedRL);
    });

    // timeout setup
    // function for close socket (for easier use)
    function closeConnect() {
      client.end();
      insertLineAbove("З'єднання закрито через неактивність тої сторони");
      startRegularRL();
    }
    let timeoutObj = setTimeout(closeConnect, timeout);

    // connections event bind
    // on get data
    client.on("data", (data) => {
      insertLineAbove(host + " >> " + data.toString(), connectedRL);

      // reset timeout timer
      clearTimeout(timeoutObj);
      timeoutObj = setTimeout(closeConnect, timeout);
    });

    // on close connection
    client.on("close", () => {
      clearTimeout(timeoutObj);
    });

    // on error
    client.on("error", (err) => {
      reject(err);
    });

    // on connect
    client.on("connect", () => {
      resolve(client);
    });

    // function for sending message
    client.send = (message) => {
      if (!client.destroyed) {
        client.write(message);
        // reset timeout timer
        clearTimeout(timeoutObj);
        timeoutObj = setTimeout(closeConnect, timeout);
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
let regularRL = readline.createInterface(process.stdin, process.stdout);
regularRL.setPrompt(">> ");

/** Readline snterface when connected */
let connectedRL;

/** A buffer for storing input */
let currentInput = '';

/** TCP socket */
let activeSocket;

// storing to buffer input
regularRL.input.on('data', (char) => {
  if (char == String.fromCharCode(13)) {
    // Enter key pressed, reset current input
    currentInput = '';
  } else {
    currentInput += char;
  }
});

/**
 * Insert string before input line in console
 * @param {string} text string for output
 */
function insertLineAbove(text, rl = null) {
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
function regularRLprocc() {
  regularRL.question(regularRL.getPrompt(), (answer) => {
    let words = answer.split(" ").filter(element => element !== "");

    // connect to server
    if (words[0] == "connect") {
      // when 'connect' without ip and port
      if (words.length == 1) {
        startConnectedRL();
      // when 'connect' whith one argument
      } else if (words.length == 2) {
        // it's IPv6
        if (isValidIPv6(words[1])) {
          connectData.host = '['+words[1]+']';
          startConnectedRL();
        // it's IPv4
        } else if (isValidIPv4(words[1])) {
          connectData.host = words[1];
          startConnectedRL();
        // it's IPv6+Port
      } else if (parceIPv6andPort(words[1])) {
          let temp = parceIPv6andPort(words[1]);
          connectData.host = '['+temp[1]+']';
          connectData.port = temp[2];
          startConnectedRL();
        // it's IPv4+Port
        } else if (parceIPv4andPort(words[1])) {
          let temp = parceIPv4andPort(words[1]);
          connectData.host = temp[0];
          connectData.port = temp[1];
          startConnectedRL();
        // it's Port
        } else if (isValidPort(words[1])) {
          connectData.port = words[1];
          startConnectedRL();
        } else {
          console.log(`Не коректний формат вводу: ${words[1]}`)
          regularRLprocc();
        }
      // when 'connect' whith two argument
      } else if (words.length == 3) {
        if (isValidIPv4(words[1]) || isValidIPv6(words[1]) && isValidPort(words[2])) {
          if (isValidIPv4(words[1])) connectData.host = words[1];
          else connectData.host = '['+words[1]+']';
          connectData.port = words[2];
          startConnectedRL();
        } else {
          console.log("Не коректний формат вводу");
          regularRLprocc();
        }
      // when 'connect' whith two and more argument
      } else {
        console.log("Забагато аргументів");
        regularRLprocc();
      }
    // exit 
    } else if (answer == "exit") {
      regularRL.close();
    // new port
    } else if (words[0] == "port") {
      if (isValidPort(words[1])) {
        connectData.port = words[1];
        console.log(`Новий порт тепер ${connectData.port}`);
      // Uncorrect port
      } else {
        console.log(`'${words[1]}' не валідний порт`);
      }
      regularRLprocc();
    // new IP
    } else if (words[0] == "ip") {
      // IPv4
      if (isValidIPv4(words[1])) {
        connectData.host = words[1];
        console.log(`Новий IP тепер ${connectData.host}`);
      // IPv6
      } else if (isValidIPv6(words[1])) {
        connectData.host = '['+words[1]+']';
        console.log(`Новий IP тепер ${connectData.host}`);
      // Uncorrect IP
      } else {
        console.log(`'${words[1]}' не валідний IP`);
      }
      regularRLprocc();
    // help
    } else if (answer == "help") {
      console.log("Довідник ще не готовий")
      regularRLprocc();
    // Uncorrect command
    } else {
      console.log("Невідома команда '"+answer+"'");
      regularRLprocc();
    }
  })
}


/**
 * Cycling readline interface when connected
 */
function connectedRLprocc() {
  connectedRL.question(connectedRL.getPrompt(), (answer) => {
    // disconnect
    if (answer == "%exit" || answer == "%disconnect") {
      startRegularRL();
    // send message
    } else {
      activeSocket.send(answer);
      connectedRLprocc();
    }
  });
}


/**
 * Starting regular console 
 */
function startRegularRL() {
  activeSocket.end()
  connectedRL.close();
  regularRL = readline.createInterface(process.stdin, process.stdout);
  regularRL.setPrompt(">> ")
  console.log("Введіть help для отримання довідки");
  regularRLprocc();
}


/**
 * Starting connected console 
 */
function startConnectedRL() {
  console.log(`Спроба під'єднатись до ${connectData.host}:${connectData.port}...`)
  makeConnect(connectData)
    .then((socket) => {
      activeSocket = socket;
      regularRL.close();
      connectedRL = readline.createInterface(process.stdin, process.stdout);
      connectedRL.setPrompt(`${connectData.host} << `);
      console.log("Введіть %exit щоб закрити з'єднання");
      connectedRLprocc();
    })
    .catch((err) => {
      console.log("Помилка з'єднання");
      console.log(err);
      regularRLprocc();
    });
}


// start program
console.log("Введіть help для отримання довідки");
regularRLprocc();
