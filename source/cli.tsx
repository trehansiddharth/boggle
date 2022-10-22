#!/usr/bin/env node
import React from 'react';
import {render} from 'ink';
import meow from 'meow';
import App from './ui';
import * as boggle from './boggle';

const cli = meow(`
	Usage
	  $ boggle

	Options
		--name  Your name

	Examples
	  $ boggle --name=Jane
	  Hello, Jane
`, {
	flags: {
		name: {
			type: 'string'
		}
	}
});

const main = async () => {
	const board = boggle.createBoard();
	const dictionary = await boggle.getDictionary();
	const claimedWords = [];
	
	render(<App board={board} dictionary={dictionary}/>);
}

main();
