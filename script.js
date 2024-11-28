const guesses = 6
let guessesRemaining = guesses
let currentGuess = [], nextLetter = 0
let words = [], randomWord = ""

function getRandomWord() {
  fetch("./data/words.txt")
    .then(response => response.text())
    .then(text => {
      words = text.split('\n').filter(word => /^[a-zA-Z]+$/.test(word) && word.length > 2 && word.length == 5).sort().map(word => word.toLowerCase())
      randomWord = words[Math.floor(Math.random() * words.length)]
    })
}

function initBoard() {
  let board = document.getElementById("game-board")

  for (let i = 0; i < guesses; i++) {
    let row = document.createElement("div")
    row.className = "letter-row"

    for (let j = 0; j < 5; j++) {
      let box = document.createElement("div")
      box.className = "letter-box"
      row.appendChild(box)
    }

    board.appendChild(row)
  }
}

function shadeKeyBoard(letter, color) {
  for (const elem of document.getElementsByClassName("keyboard-button")) {
    if (elem.textContent === letter) {
      let oldColor = elem.style.backgroundColor
      if (oldColor === '#538d4e') {
        return
      }

      if (oldColor === '#b59f3b' && color !== '#538d4e') {
        return
      }

      elem.style.backgroundColor = color
      break
    }
  }
}

function deleteLetter() {
  let row = document.getElementsByClassName("letter-row")[6 - guessesRemaining]
  let box = row.children[nextLetter - 1]
  box.textContent = ""
  box.classList.remove("filled-box")
  currentGuess.pop()
  nextLetter -= 1
}

function checkGuess() {
  let row = document.getElementsByClassName("letter-row")[6 - guessesRemaining]
  let guessString = ''
  let rightGuess = Array.from(randomWord)

  for (const val of currentGuess) {
    guessString += val
  }

  if (guessString.length != 5) {
    toastr.error("Not enough letters!")
    return
  }

  if (!words.includes(guessString)) {
    toastr.error("Word is not in list!")
    return
  }

  for (let i = 0; i < 5; i++) {
    let letterColor = ''
    let box = row.children[i], letter = currentGuess[i]
    let letterPosition = rightGuess.indexOf(currentGuess[i])

    if (letterPosition === -1) {
      letterColor = '#3a3a3c'
    } else {
      if (currentGuess[i] === rightGuess[i]) {
        letterColor = '#538d4e'
      } else {
        letterColor = '#b59f3b'
      }

      rightGuess[letterPosition] = "#"
    }

    let delay = 250 * i
    setTimeout(() => {
      animateCSS(box, 'flipInX')
      box.style.backgroundColor = letterColor
      shadeKeyBoard(letter, letterColor)
    }, delay)
  }

  if (guessString === randomWord) {
    toastr.success("You guessed it right! Good job!")
    guessesRemaining = 0
    return
  } else {
    guessesRemaining -= 1
    currentGuess = []
    nextLetter = 0

    if (guessesRemaining === 0) {
      toastr.error("Sorry, you've run out of guesses.")
      toastr.info(`The right word was: "${randomWord}"`)
    }
  }
}

function insertLetter(pressedKey) {
  if (nextLetter === 5) {
    return
  }
  pressedKey = pressedKey.toLowerCase()

  let row = document.getElementsByClassName("letter-row")[6 - guessesRemaining]
  let box = row.children[nextLetter]
  animateCSS(box, "pulse")
  box.textContent = pressedKey
  box.classList.add("filled-box")
  currentGuess.push(pressedKey)
  nextLetter += 1
}

const animateCSS = (element, animation, prefix = 'animate__') =>
  new Promise((resolve, _reject) => {
    const animationName = `${prefix}${animation}`
    const node = element
    node.style.setProperty('--animate-duration', '0.3s')

    node.classList.add(`${prefix}animated`, animationName)

    function handleAnimationEnd(event) {
      event.stopPropagation()
      node.classList.remove(`${prefix}animated`, animationName)
      resolve('Animation ended')
    }

    node.addEventListener('animationend', handleAnimationEnd, { once: true })
  })

document.addEventListener("keyup", (e) => {
  if (guessesRemaining === 0) {
    return
  }

  let pressedKey = String(e.key)
  if (pressedKey === "Backspace" && nextLetter !== 0) {
    deleteLetter()
    return
  }

  if (pressedKey === "Enter") {
    checkGuess()
    return
  }

  if (pressedKey.length !== 1) {
    return
  }

  let found = pressedKey.match(/[a-z]/gi)
  if (!found || found.length > 1) {
    return
  } else {
    insertLetter(pressedKey)
  }
})

document.getElementById("keyboard-cont").addEventListener("click", (e) => {
  const target = e.target

  if (!target.classList.contains("keyboard-button")) {
    return
  }
  let key = target.textContent

  if (key === "Del") {
    key = "Backspace"
  }

  document.dispatchEvent(new KeyboardEvent("keyup", { 'key': key }))
})

getRandomWord()
initBoard()