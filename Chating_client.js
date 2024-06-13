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
    insertLineAbove("відключення від сервера");
    clearTimeout(timeout_obj);
  });
  
  // on error
  client.on("error", (err) => {
    console.log("Помилка:");
    console.log(err);
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

  return client
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
    regular_rl.setPrompt(">> ");
    if (answer == "connect") {
      startConnectedConsole();
    } else if (answer == "exit") {
      regular_rl.close();
    } else if (answer == "help") {
      console.log("Довідник ще не готовий")
      ask();
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
    connected_rl.setPrompt(`${connect_data.host} << `);
    if (answer == "%exit") {
      startRegularConsole();
    } else {
      connected_socket.send(answer);
      //console.log(`${connect_data.host} << ${answer}`);
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
  connected_socket = makeConnect(connect_data);
  regular_rl.close();
  connected_rl = readline.createInterface(process.stdin, process.stdout);
  connected_rl.setPrompt(`${connect_data.host} << `);
  console.log("Введіть %exit щоб закрити з'єднання");
  sending();
}


// start program
console.log("Введіть help для отримання довідки");
ask();