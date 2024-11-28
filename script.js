const guesses = 6;
let guessesRemaining = guesses;
let currentGuess = [];
let nextLetter = 0;
let words = [];
let randomWord = "";
let gameMode = "normal";
let timerInterval;
let timeLeft = 60;
let gameActive = false;

fetch("./data/words.txt")
  .then(response => response.text())
  .then(text => {
    words = text
      .split('\n')
      .filter(word => /^[a-zA-Z]+$/.test(word) && word.length === 5)
      .map(word => word.toLowerCase());
  });

document.getElementById("start-button").addEventListener("click", () => {
  gameMode = document.getElementById("gamemode").value;
  resetGame();
  startGame();
});

function resetGame() {
  guessesRemaining = guesses;
  currentGuess = [];
  nextLetter = 0;
  randomWord = "";
  gameActive = false;

  document.getElementById("game-board").innerHTML = "";
  const keys = document.getElementsByClassName("keyboard-button");
  for (const key of keys) {
    key.style.backgroundColor = "#818384";
  }

  clearInterval(timerInterval);
  timeLeft = 60;
  document.getElementById("time-left").textContent = timeLeft;

  document.getElementById("timer").style.display = "none";
  document.getElementById("game-board").style.display = "none";
  document.getElementById("keyboard-cont").style.display = "none";
}

function startGame() {
  getRandomWord();
  initBoard();
  gameActive = true;

  document.getElementById("game-board").style.display = "flex";
  document.getElementById("keyboard-cont").style.display = "flex";

  if (gameMode === "speedrun") {
    startTimer();
  }
}

function getRandomWord() {
  randomWord = words[Math.floor(Math.random() * words.length)];
  if (gameMode === "inverted") {
    randomWord = randomWord.split('').reverse().join('');
  }
}

function initBoard() {
  let board = document.getElementById("game-board");
  board.innerHTML = "";

  for (let i = 0; i < guesses; i++) {
    let row = document.createElement("div");
    row.className = "letter-row";

    for (let j = 0; j < 5; j++) {
      let box = document.createElement("div");
      box.className = "letter-box";
      row.appendChild(box);
    }

    board.appendChild(row);
  }
}

function startTimer() {
  document.getElementById("timer").style.display = "block";
  timerInterval = setInterval(() => {
    timeLeft--;
    document.getElementById("time-left").textContent = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      toastr.error("Time's up!");
      gameActive = false;
    }
  }, 1000);

  let audio = new Audio('data/background.mp3');
  audio.loop = true;
  audio.play().catch(() => {
    // Auto-play might be blocked
    toastr.info("Click anywhere to enable audio");
    document.addEventListener('click', () => {
      audio.play();
    }, { once: true });
  });
}

function deleteLetter() {
  if (!gameActive) return;
  if (nextLetter === 0) return;

  let row = document.getElementsByClassName("letter-row")[6 - guessesRemaining];
  let box = row.children[nextLetter - 1];
  box.textContent = "";
  box.classList.remove("filled-box");
  currentGuess.pop();
  nextLetter -= 1;
}

function checkGuess() {
  if (!gameActive) return;

  let row = document.getElementsByClassName("letter-row")[6 - guessesRemaining];
  let guessString = currentGuess.join('');
  let rightGuess = Array.from(randomWord);

  if (guessString.length !== 5) {
    toastr.error("Not enough letters!");
    return;
  }

  if (!words.includes(guessString)) {
    toastr.error("Word is not in list!");
    return;
  }

  let letterColorArray = [];

  // First pass: Check for correct position
  for (let i = 0; i < 5; i++) {
    let letterColor = '';
    let letter = currentGuess[i];

    if (letter === rightGuess[i]) {
      letterColor = gameMode === "inverted" ? '#3a3a3c' : '#538d4e'; // Inverted colors
      rightGuess[i] = null;
    } else {
      letterColor = null;
    }
    letterColorArray.push(letterColor);
  }

  // Second pass: Check for correct letter in wrong position
  for (let i = 0; i < 5; i++) {
    if (letterColorArray[i] !== null) continue;

    let letter = currentGuess[i];
    if (rightGuess.includes(letter)) {
      letterColorArray[i] = '#b59f3b';
      rightGuess[rightGuess.indexOf(letter)] = null;
    } else {
      letterColorArray[i] = gameMode === "inverted" ? '#538d4e' : '#3a3a3c';
    }
  }

  for (let i = 0; i < 5; i++) {
    let box = row.children[i];
    let letter = currentGuess[i];
    let letterColor = letterColorArray[i];

    let delay = 250 * i;
    setTimeout(() => {
      animateCSS(box, 'flipInX');
      box.style.backgroundColor = letterColor;
      shadeKeyBoard(letter, letterColor);
    }, delay);
  }

  if (guessString === randomWord) {
    toastr.success("You guessed it right! Good job!");
    gameActive = false;
    clearInterval(timerInterval);
    return;
  } else {
    guessesRemaining -= 1;
    currentGuess = [];
    nextLetter = 0;

    if (guessesRemaining === 0) {
      toastr.error("Sorry, you've run out of guesses.");
      toastr.info(`The right word was: "${randomWord}"`);
      gameActive = false;
      clearInterval(timerInterval);
    }
  }
}

function insertLetter(pressedKey) {
  if (!gameActive) return;
  if (nextLetter === 5) return;

  pressedKey = pressedKey.toLowerCase();

  let row = document.getElementsByClassName("letter-row")[6 - guessesRemaining];
  let box = row.children[nextLetter];
  animateCSS(box, "pulse");
  box.textContent = pressedKey;
  box.classList.add("filled-box");
  currentGuess.push(pressedKey);
  nextLetter += 1;
}

function shadeKeyBoard(letter, color) {
  for (const elem of document.getElementsByClassName("keyboard-button")) {
    if (elem.textContent.toLowerCase() === letter.toLowerCase()) {
      let oldColor = elem.style.backgroundColor;
      if (oldColor === '#538d4e' && color !== '#3a3a3c') {
        return;
      }
      if (oldColor === '#b59f3b' && (color !== '#538d4e' && color !== '#3a3a3c')) {
        return;
      }
      elem.style.backgroundColor = color;
      break;
    }
  }
}

const animateCSS = (element, animation, prefix = 'animate__') =>
  new Promise((resolve, _reject) => {
    const animationName = `${prefix}${animation}`;
    const node = element;
    node.style.setProperty('--animate-duration', '0.3s');

    node.classList.add(`${prefix}animated`, animationName);

    function handleAnimationEnd(event) {
      event.stopPropagation();
      node.classList.remove(`${prefix}animated`, animationName);
      resolve('Animation ended');
    }

    node.addEventListener('animationend', handleAnimationEnd, { once: true });
  });

document.addEventListener("keyup", (e) => {
  if (!gameActive) return;

  let pressedKey = String(e.key);
  if (pressedKey === "Backspace" || pressedKey === "Delete") {
    deleteLetter();
    return;
  }

  if (pressedKey === "Enter") {
    checkGuess();
    return;
  }

  if (/^[a-zA-Z]$/.test(pressedKey)) {
    insertLetter(pressedKey);
  }
});

document.getElementById("keyboard-cont").addEventListener("click", (e) => {
  const target = e.target;

  if (!target.classList.contains("keyboard-button")) {
    return;
  }
  let key = target.textContent;

  if (key === "Enter") {
    key = "Enter";
  } else if (key === "Del") {
    key = "Backspace";
  }

  document.dispatchEvent(new KeyboardEvent("keyup", { 'key': key }));
});
