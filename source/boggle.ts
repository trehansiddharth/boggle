import * as fs from 'fs';
import * as path from 'path';
import * as process from 'process';
import * as readline from 'readline';

const ALPHABET = ["A", "B", "C", "D", "E", "F", "G",
  "H", "I", "J", "K", "L", "M", "N", "O", "P", "QU",
   "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
const ALPHABET_FREQUENCIES = [
  // Ranges calculated from data found at
  // http://en.wikipedia.org/wiki/Letter_frequency
  8167,   9659,   12441,  16694,
  29396,  31624,  33639,  39733,
  46699,  46852,  47624,  51649,
  54055,  60804,  68311,  70240,
    70335,  76322,  82649,  91705,
  94463,  95441,  97801,  97951,
  99925,  100000
];
const BOARD_SIZE = 4;
const MIN_WORD_LENGTH = 3;

const rl = readline.createInterface({ 
  input: process.stdin,
  output: process.stdout
});

const getRandomLetter = () : string => {
  const random = Math.random() * 100000;
  const letterIndex = ALPHABET_FREQUENCIES.findIndex((frequency) => random < frequency);
  return ALPHABET[letterIndex] as string;
}

const createBoard = () => {
  const board : string[][] = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    const rowList : string[] = [];
    for (let col = 0; col < BOARD_SIZE; col++) {
      const letter = getRandomLetter();
      rowList.push(letter);
    }
    board.push(rowList);
  }
  return board;
}

const rotate = (row: number, col: number) => {
  return { row: col, col: BOARD_SIZE - row - 1 };
}

const getBoardString = (board: string[][], rotation: number) : string => {
  let boardStr = "";
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      let newRow = row;
      let newCol = col;
      for (let i = 0; i < rotation; i++) {
        const rotated = rotate(newRow, newCol);
        newRow = rotated.row;
        newCol = rotated.col;
      }
      boardStr += ((board[newRow] as string[])[newCol] as string).padEnd(3);
    }
    boardStr += "\n";
  }
  return boardStr;
}

const splitWord = (word: string) : string[] => {
  let currentLetter = "";
  const letterList = [];
  for (let i = 0; i < word.length; i++) {
    currentLetter += word[i];
    if (ALPHABET.find((letter) => letter === currentLetter)) {
      letterList.push(currentLetter);
      currentLetter = "";
    }
  }
  return letterList;
}

type Position = { row : number, col : number };

const findLetterInBoard = (letter: string, board: string[][]) : Position[] => {
  const positions : Position[] = [];
  board.forEach((row, rowIndex) => {
    row.forEach((col, colIndex) => {
      if (col === letter) {
        positions.push({ row: rowIndex, col: colIndex });
      }
    });
  });
  return positions;
}

const arePositionsAdjacent = (position1: Position, position2: Position) => {
  return Math.abs(position1.row - position2.row) <= 1 &&
    Math.abs(position1.col - position2.col) <= 1;
};

const wordInBoard = (word: string, board: string[][]) => {
  const wordLetters = splitWord(word);
  const stack : Position[][] = [];
  
  const firstLetterPositions = findLetterInBoard(wordLetters[0] as string, board);
  firstLetterPositions.forEach((position) => {
    stack.push([position]);
  });
  while (stack.length > 0) {
    const currentPath = stack.pop() as Position[];
    if (currentPath.length === wordLetters.length) {
      return true;
    } else {
      const nextLetter = wordLetters[currentPath.length] as string;
      const nextPositions = findLetterInBoard(nextLetter, board);
      nextPositions.forEach((position) => {
        if (arePositionsAdjacent(currentPath[currentPath.length - 1] as Position, position) &&
          !currentPath.find((pathPosition) => pathPosition.row === position.row &&
            pathPosition.col === position.col)) {
          stack.push([...currentPath, position]);
        }
      });
    }
  }
  return false;
}

const getDictionary = async () : Promise<string[]> => {
  return new Promise((resolve, reject) => {
    fs.readFile(path.join(__dirname, "dictionary_ordered.txt"), "utf8", (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data.split("\n").map((word) => word.toUpperCase()));
      }
    });
  });
};

const getAllWords = (board: string[][], dictionary: string[]) => {
  return dictionary.filter((word) => word.length >= MIN_WORD_LENGTH && wordInBoard(word, board));
}

type WordClaimableResult = true | "invalid-word" | "too-short" | "not-on-board" | "already-claimed";
const checkWordClaimable = (word: string, board: string[][], claimedWords: string[]) : WordClaimableResult => {
  if (!/[A-Z]/.test(word)) {
    return "invalid-word";
  } else if (word.length < MIN_WORD_LENGTH) {
    return "too-short";
  } else if (claimedWords.includes(word)) {
    return "already-claimed";
  } else if (!wordInBoard(word, board)) {
    return "not-on-board";
  } else {
    return true;
  }
}

type WordClassification = number | "not-in-dictionary";
const classifyWord = (word: string, dictionary: string[]) : WordClassification => {
  if (dictionary.includes(word)) {
    return splitWord(word).length;
  } else {
    return "not-in-dictionary";
  }
}

const scoreWord = (wordClassification: WordClassification) => {
  if (typeof wordClassification === "number") {
    if (wordClassification <= 4) {
      return 1;
    } else if (wordClassification == 5) {
      return 2;
    } else if (wordClassification === 6) {
      return 3;
    } else if (wordClassification === 7) {
      return 5;
    } else {
      return 11;
    }
  } else {
    return -1;
  }
}

export { WordClaimableResult, WordClassification, createBoard, getBoardString, checkWordClaimable, getDictionary, classifyWord, scoreWord, getAllWords };
