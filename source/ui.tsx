import React, {FC, useEffect} from 'react';
import {Newline, Spacer, Text, useFocus, useInput} from 'ink';
import * as boggle from './boggle';
import { useState } from 'react';
import TextInput from 'ink-text-input';
const { Box } = require("ink");
import * as process from 'process';

const BOGGLE_TIME_IN_SECONDS = 3 * 60;

type AppProps = {
	board: string[][],
	dictionary: string[]
}

const App: FC<AppProps> = (props) => {
	let timer : NodeJS.Timer | undefined = undefined;
	const [claimedWords, setClaimedWords] = useState<string[]>([]);
	const [claimedWordClassifications, setClaimedWordClassifications] = useState<boggle.WordClassification[]>([]);
	const [currentWord, setCurrentWord] = useState<string>('');
	const [wordStatus, setWordStatus] = useState<boggle.WordClaimableResult | undefined>(undefined);
	const [counter, setCounter] = useState(BOGGLE_TIME_IN_SECONDS);
	const [gameOngoing, setGameOngoing] = useState<boolean>(true);
	const [rotation, setRotation] = useState<number>(0);

	const updateCounter = () => {
		if (timer === undefined) {
			timer = setInterval(() => {
				setCounter(previousCounter => previousCounter - 1);
			}, 1000);
		}

		if (counter === 0) {
			clearInterval(timer);
			setGameOngoing(false);
		}
	}

	useEffect(() => {
		updateCounter();

		return () => clearInterval(timer);
	}, [counter, gameOngoing]);

	useInput((input, key) => {
		if (key.tab) {
			setRotation((rotation + 1) % 4);
		}
	})

	const handleWordSubmit = (word: string) => {
		setCurrentWord("");
		if (gameOngoing) {
			const wordClaimableResult = boggle.checkWordClaimable(word, props.board, claimedWords);
			setWordStatus(wordClaimableResult);
			if (wordClaimableResult === true) {
				const wordClassification = boggle.classifyWord(word, props.dictionary);
				setClaimedWords([...claimedWords, word]);
				setClaimedWordClassifications([...claimedWordClassifications, wordClassification]);
			}
		}
	}

	const renderWordClaimableResult = (result: boggle.WordClaimableResult) => {
		if (gameOngoing) {
			if (result === true) {
				return <Text color="green">OK</Text>;
			} else if (result === 'invalid-word') {
				return <Text color="red">NOPE: Invalid word.</Text>;
			} else if (result === 'already-claimed') {
				return <Text color="red">NOPE: Word already claimed.</Text>;
			} else if (result === 'not-on-board') {
				return <Text color="red">NOPE: Word is not on the board.</Text>;
			} else {
				return <Text color="red">NOPE: Word is too short.</Text>;
			}
		} else {
			return <></>
		}
	}

	const renderClaimedWords = () => {
		if (claimedWords.length === 0) {
			return <Text color="gray">No words claimed yet.</Text>;
		}
		return claimedWords.map((word, index) => {
			if (gameOngoing) {
				return <Text key={index} color={(index === (claimedWords.length - 1) ? "green" : "white")}>{word}</Text>;
			} else {
				const wordClassification = claimedWordClassifications[index] as boggle.WordClassification;
				const wordScore = boggle.scoreWord(wordClassification);
				const textColor = wordClassification === "not-in-dictionary" ? "red" : "green";
				return <Text key={index} color={textColor}>{word} ({wordScore > 0 ? "+" : ""}{wordScore})</Text>;
			}
		});
	}

	const renderSuggestedWords = () => {
		const allWords = boggle.getAllWords(props.board, props.dictionary);
		const suggestedWords = allWords.filter(word => !claimedWords.includes(word)).slice(0, 8);
		if (suggestedWords.length === 0) {
			return <></>;
		} else {
			return <>
				<Newline />
				<Text color="gray">Here are some words you missed:</Text>
				<Newline />
				{suggestedWords.map((word, index) => {
					return <Text key={index} color="gray">{word}</Text>;
				})}
			</>
		}
	}

	const renderRemainingTime = () => {
		const minutes = Math.floor(counter / 60);
		const seconds = counter % 60;
		return <Text color={ (counter < 20) ? "red" :  "gray" }>Remaining time: {minutes}:{seconds.toString().padStart(2, '0')} </Text>;
	}

	const renderScore = () => {
		let totalScore = 0;
		claimedWordClassifications.forEach((wordClassification) => {
			totalScore += boggle.scoreWord(wordClassification);
		});
		return <Text color="green">Score: {totalScore}</Text>;
	}

	return (<Box flexDirection="row" width={process.stdout.columns}>
			<Box flexDirection="column" flexGrow={1} height={process.stdout.rows}>
				<Text color="gray">Press &lt;tab&gt; to rotate the board!</Text>
				<Spacer />
				<Box flexDirection="row">
					<Spacer />
					<Text>
						{boggle.getBoardString(props.board, rotation)}
					</Text>
					<Spacer />
				</Box>
				<Spacer />
				{ wordStatus === undefined ? <></> : renderWordClaimableResult(wordStatus) }
				<TextInput 
						placeholder={gameOngoing ? "Enter a word..." : "Game over!"}
						value={currentWord}
						onChange={(word) => setCurrentWord(word)}
						onSubmit={(word) => { handleWordSubmit(word.toUpperCase()); }}/>
		</Box>
		<Box width={24} flexDirection="column">
			{renderClaimedWords()}
			{ gameOngoing ? <></> : renderSuggestedWords() }
			<Spacer />
			{ gameOngoing ? renderRemainingTime() : renderScore()}
		</Box>
	</Box>);
};

module.exports = App;
export default App;
