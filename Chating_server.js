const net = require("net");
const readline = require("readline")
const { rejects } = require("assert");
const { resolve } = require("path");

/** Defalut data for hosting */
let hostData = {
  port: 8080,
  host: "127.0.0.1",
  timeout: 300000 // 5 min
}

/** Data about connected client */
let remoteData = {
  remoteAddress: null,
  remotePort: null
}

/**
 * Create server
 * @param {object} param0 
 * @returns server object
 */
function createServer({port = hostData.port, host = hostData.host, timeout = hostData.timeout} = {}) {
  const server = net.createServer((socket) => {

    // on get data
    socket.on("data", (data) => {
      insertLineAbove(remoteData.remoteAddress+":"+remoteData.remotePort + " >> " + data.toString(), hostedRL);

      // reset timeout timer
      clearTimeout(timeoutObj);
      timeoutObj = setTimeout(closeConnect, timeout);
    });

    // on close connection
    socket.on("close", () => {
      clearTimeout(timeoutObj);
      insertLineAbove("З'єднання було розірвано");
      server.close();
      startRegularRL();
    });

    // on error
    socket.on("error", (err) => {
      //rejects(err);
      //console.log("Помилка:");
      console.log(err);
    });

    // timeout setup
    // function for close socket (for easier use)
    function closeConnect() {
      insertLineAbove("З'єднання закрито через неактивність тої сторони");
      socket.end();
    }
    /** Timeout object for closing at afk */
    let timeoutObj = setTimeout(closeConnect, timeout);
  
    // function for sending message
    socket.send = (message) => {
      if (!socket.destroyed) {
        socket.write(message);
        // reset timeout timer
        clearTimeout(timeoutObj);
        timeoutObj = setTimeout(closeConnect, timeout);
      } else {
        console.log("Нема підключення, щоб відправити повідомлення");
        startRegularRL();
      }
    }

    // On client connect
    console.log("\nПідключено");
    remoteData.remoteAddress = socket.remoteAddress;
    remoteData.remotePort = socket.remotePort;
    // host rl interface
    console.log("out socket");
    startHostedRL(socket);
  });
  
  return server
}

/** Function that start lisening server. */
function startListen(server) {
  server.listen(hostData.port, hostData.host, () => {
    waitOrDenyListen();
  });
}

/**
 * Shoud using when server open and wait to connect client
 * Can close server without client connect by user.
 */
function waitOrDenyListen() {
  console.log(`До вас можна під'єднатися за ${hostData.host}:${hostData.port}`);
  regularRL.question("Натисність Enter для скасування очікування приєднання", () => {
    activeServer.close();
    regularRLprocc();
  });
}


/** Readline interface when not connected */
let regularRL = readline.createInterface(process.stdin, process.stdout);
regularRL.setPrompt(">> ");
/** If regular RL Interface is closed */
regularRL.closed = false;

/** Readline interface when connected */
let hostedRL = {};
/** If hosted RL Interface is closed */
hostedRL.closed = false;


/** A buffer for storing input */
let currentInput = '';

/** TCP socket */
let activeSocket;
/** Hosted server */
let activeServer;

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

    if (words[0] == "host") {
      if (words.length == 1) {
        startHosting();
      } else if (words.length == 2) {
        // not ready
        startHosting();
      } else if (words.length == 3) {
        // not ready
        startHosting();
      } else {
        console.log("Завелика кількість аргументів");
        regularRL();
      }
    } else if (answer == "exit") {
      regularRL.close();
      process.exit(0);
    } else {
      console.log(`Невідома команда '${words[0]}'`);
      regularRLprocc();
    }
  });
}

/**
 * Cycling hosted readline interface
 * For correct start better use startRegularRL
 */
function hostedRLProcc() {
  hostedRL.question(hostedRL.getPrompt(), (answer) => {
    // disconnect
    if (answer == "%exit" || answer == "%disconnect") {
      activeSocket.end();
    // send message
    } else {
      activeSocket.send(answer);
      hostedRLProcc();
    }
  });
}

/**
 * Starting regular readline interface
 * For correct start better use startHostedRL
 */
function startRegularRL() {
  hostedRL.close();

  regularRL = readline.createInterface(process.stdin, process.stdout);
  regularRL.setPrompt(">> ");

  console.log("Введіть help для отримання довідки");
  regularRLprocc();
}

/**
 * Start hosted readline interface
 * @param {net.Socket} socket 
 */
function startHostedRL(socket) {
  activeSocket = socket;
  
  console.log("regularRL close");
  regularRL.close();

  hostedRL = readline.createInterface(process.stdin, process.stdout);
  hostedRL.setPrompt(remoteData.remoteAddress+":"+remoteData.port + " << ");

  console.log("Введіть %exit щоб закрити з'єднання");
  hostedRLProcc();
}

/**
 * Start hosting
 * Create server and lisening port
 */
function startHosting() {
  activeServer = createServer();
  startListen(activeServer);
}


// Start program
regularRLprocc();