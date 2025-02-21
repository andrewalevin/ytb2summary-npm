import { VOTAgent } from "@vot.js/node/utils/fetchAgent";
import { NeuroClient } from "@toil/neurojs";
import { writeFile } from "fs/promises";
import { join } from "path";

// Initialize NeuroClient with VOTAgent
const client = new NeuroClient({
    fetchOpts: { dispatcher: new VOTAgent() },
});

async function waitForSession(sessionId, maxRetries = 50, delayMs = 5000) {
    let attempt = 0;
    let previousChapters = [];
    let roundsBeforeCheck = 3;
    let lastResult = null;

    console.log("🧬🔄 Monitoring session progress...");

    while (attempt < maxRetries) {
        try {
            const result = await client.summarizeVideo({ extraOpts: { sessionId } });

            console.log(`🧬📋 Session Status: ${result.chapters ? result.chapters.length : 0} chapters detected`);
            lastResult = result;

            if (roundsBeforeCheck <= 0) {
                if (JSON.stringify(result.chapters) === JSON.stringify(previousChapters)) {
                    console.log("🧬⚠️ No new chapters detected. Stopping monitoring...");
                    break;
                }
            } else {
                roundsBeforeCheck--;
            }

            previousChapters = result.chapters;
            if (result.status === "done") return result;

        } catch (error) {
            console.error("🧬❌ Error during session monitoring:", error);
        }

        attempt++;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    console.log("🧬🔚 Session monitoring completed.");
    return lastResult;
}

export async function summarizeVideo({ videoId, outputDir, language }) {
    try {
        console.log("🧬🚀 Starting video summarization...");

        const requestData = {
            url: `https://www.youtube.com/watch?v=${videoId}`,
            language,
            extraOpts: {},
        };

        const res = await client.summarizeVideo(requestData);

        if (!res.sessionId) throw new Error("No session ID received.");

        console.log(`🧬🎬 Session started: ${res.sessionId}`);
        const finalResult = await waitForSession(res.sessionId);

        if (!finalResult) {
            console.log("🧬⚠️ No chapters detected. Using the last known result.");
            return;
        }

        const filePath = join(outputDir, `${videoId}-summary.json`);
        await writeFile(filePath, JSON.stringify(finalResult, null, 2));

        console.log(`🧬✅ Summary saved: ${filePath}`);
    } catch (error) {
        console.error("🧬❌ Error during summarization:", error);
    }
}