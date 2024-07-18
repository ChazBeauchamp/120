// game state "object"
let gameState = {
    answer: '',
    currentGuess: 0,
    wordList: []    
    }

let defaultWordList = ['WHICH', 'THERE', 'THEIR', 'ABOUT', 'WOULD', 'THESE',
    'OTHER', 'WORDS', 'COULD', 'WRITE', 'FIRST', 'WATER', 'AFTER', 'WHERE',
    'RIGHT', 'THINK', 'THREE', 'YEARS', 'PLACE', 'SOUND', 'GREAT', 'AGAIN',
    'STILL', 'EVERY', 'SMALL', 'FOUND', 'THOSE', 'NEVER', 'UNDER', 'MIGHT']

let usedLetters = new Set()

// DOM elements
const gameBoard = document.getElementById('game-board');
const wordRows = gameBoard.querySelectorAll('.word-row');
const guessInput = document.getElementById('guess-input');
const submitButton = document.getElementById('submit-guess');
const messageArea = document.getElementById('message-area');
const restartButton = document.getElementById('restart-game');
const usedArea = document.getElementById('used-letters');

// fetch word list from Datamuse
function fetchWordList() {
    return fetch('https://api.datamuse.com/words?sp=?????&max=500&md=f&fo=freq')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => data.map(word => word.word.toUpperCase()))
        .catch(error => {
            console.error('Error fetching word list:', error);
            // Fallback to a small list of words in case the API fails
            return defaultWordList;
        });
}

function getRandomWord(wordList) {
    return gameState.wordList[Math.floor(Math.random() * wordList.length)];
}

function initializeGame() {
    if (gameState.wordList.length === 0) {
        fetchWordList().then(words => {
            gameState.wordList = words;
            startNewGame();
        });
    } else {
        startNewGame();
    }
}

function startNewGame() {
    // reset board words
    wordRows.forEach(row => {
        const letterBoxes = row.querySelectorAll('.letter-box');
        letterBoxes.forEach(box => {
            box.innerText = '';
            box.className = 'letter-box'; // get rid of colors

            $('#restart-game').hide();
            $('#guess-input').prop('disabled', false);
            $('#submit-guess').prop('disabled', false);
        });
    });

    // reset words/guessing
    gameState.answer = getRandomWord(gameState.wordList);
    gameState.currentGuess = 0;
    usedLetters.clear();
    usedArea.innerHTML = 'Used Letters: ';
    console.log('Answer:', gameState.answer); // For debugging
}

// validate guess using free dictionary api
function validateGuess(guess) {
    return fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${guess}`)
        .then(response => {
            return response.ok
        })
        .catch(error => {
            console.error('Error validating word:', error);
            return false;
        });
}

function updateBoard(guess, answer) {
   
    const $currentRow = $('.word-row').eq(gameState.currentGuess);
    const $letterBoxes = $currentRow.find('.letter-box');
    
    let answerArray = answer.split('');

    // First pass: Mark correct letters
    for (let i = 0; i < 5; i++) {
        const guessLetter = guess[i];
        $letterBoxes.eq(i).text(guessLetter);

        if (guessLetter === answer[i]) {
            $letterBoxes.eq(i).addClass('correct');
            answerArray[i] = null; // mark letter as used
        }
    }

    // Second pass: Mark present or absent letters
    for (let i = 0; i < 5; i++) {
        const guessLetter = guess[i];

        if (!$letterBoxes.eq(i).hasClass('correct')) {
            const indexInAnswer = answerArray.indexOf(guessLetter); // returns -1 if not in array
            if (indexInAnswer !== -1) {
                $letterBoxes.eq(i).addClass('present');
                answerArray[indexInAnswer] = null;
            } else {
                $letterBoxes.eq(i).addClass('absent');
            }
        }
    }

    // used letter board
    for(let i = 0; i < guess.length; i++) {
        usedLetters.add(guess[i]);
    }

    let alphabetSet = Array.from(usedLetters);
    alphabetSet.sort();
    
    usedArea.innerHTML = 'Used Letters: ';

    alphabetSet.forEach(letter => {
        usedArea.innerHTML += letter + ' ';
    });
    
    gameState.currentGuess++;
}

function checkEnd(guess, answer) {
    if (guess === answer) {
        alert("You win! Congratulations!");
        $('#restart-game').show();
        $('#guess-input').prop('disabled', true);
        $('#submit-guess').prop('disabled', true);
        return;
    }

    if (gameState.currentGuess === 6) { 
        alert(`Game over! The word was ${gameState.answer}.`);
        $('#restart-game').show();
        $('#guess-input').prop('disabled', true);
        $('#submit-guess').prop('disabled', true);
        return;
    }
}

function handleGuess() {
    const guess = guessInput.value.toUpperCase();
    
    if (guess.length !== 5) {
        messageArea.innerText = "Please enter a 5-letter word.";
        return;
    }

    validateGuess(guess)
        .then(isValid => {
            if (!isValid) {
                messageArea.innerText = "Not a valid word, try again.";
                return;
            }

            if (messageArea.innerText !== '') {
                messageArea.innerText = '';
            }

            updateBoard(guess, gameState.answer);
            checkEnd(guess, gameState.answer);
            
            guessInput.value = '';
        })
        .catch(error => {
            console.error('Error handling guess:', error);
            messageArea.innerText = "An error occurred. Please try again.";
        });
}

// event listeners
submitButton.addEventListener('click', handleGuess);
restartButton.addEventListener('click', initializeGame);
guessInput.addEventListener('keypress', (event) => {
    // If the user presses the "Enter" key on the keyboard
    if (event.key === "Enter") {
      handleGuess();
    }
})

// intialize when the script loads
initializeGame();