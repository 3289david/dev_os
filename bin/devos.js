#!/usr/bin/env node

/**
 * DevOS — The AI-Powered Full-Stack Development OS
 * 
 * Natural language → Code → Execute → Debug → Deploy
 * All from your terminal.
 */

import { createCLI } from '../src/cli/index.js';

const cli = createCLI();
cli.parse(process.argv);
