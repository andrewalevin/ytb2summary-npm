#!/usr/bin/env node

import { Command } from 'commander';
import { summarizeVideo } from './src/summarize.js';

// Initialize the CLI program
const program = new Command();

program
    .name('ytb2summary')
    .description('A tool to summarize YouTube videos')
    .version('1.0.0');

program
    .argument('<videoId>', 'YouTube video ID')
    .option('-o, --output-dir <dir>', 'Directory to save the summary', '.')
    .option('-l, --language <lang>', 'Language for summarization', 'en')
    .action(async (videoId, options) => {
        try {
            await summarizeVideo({
                videoId,
                outputDir: options.outputDir,
                language: options.language,
            });
        } catch (error) {
            console.error("🧬❌ Error:", error);
            process.exit(1);
        }
    });

program.parse();