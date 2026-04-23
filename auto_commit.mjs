import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';

// --- CONFIGURATION ---
const COMMITS_PER_RUN = 3;
const MESSAGES_FILE =  path.resolve('./commit_messages.txt');

/**
 * Safely executes a shell command and returns its output.
 */
function runCommand(command) {
    try {
        return execSync(command, { encoding: 'utf8', stdio: 'pipe' }).trim();
    } catch (error) {
        // We throw so the caller can handle the error appropriately
        throw new Error(`Command failed: ${command}\n${error.stderr || error.message}`);
    }
}

/**
 * Checks if there are any uncommitted changes in the repository.
 */
function hasChanges() {
    try {
        const status = runCommand('git status --porcelain');
        return status.length > 0;
    } catch (error) {
        console.error("❌ Failed to check git status. Are you in a git repository?");
        return false;
    }
}

async function runAutoCommits() {
    console.log(`\n🚀 Starting Auto-Commit Process (Target: ${COMMITS_PER_RUN} commits max)\n`);

    // 1. Check if the messages file exists
    if (!fs.existsSync(MESSAGES_FILE)) {
        console.error(`❌ Error: Could not find ${MESSAGES_FILE}`);
        return;
    }

    // 2. Read and parse messages
    const fileContent = fs.readFileSync(MESSAGES_FILE, 'utf8');
    const allMessages = fileContent
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

    if (allMessages.length === 0) {
        console.log("ℹ️ No commit messages left in the file.");
        return;
    }

    // 3. Determine how many commits we can actually make
    const commitsToMakeCount = Math.min(COMMITS_PER_RUN, allMessages.length);
    const messagesToUse = allMessages.slice(0, commitsToMakeCount);
    const remainingMessages = allMessages.slice(commitsToMakeCount);

    let successfulCommits = 0;

    // 4. Process each message
    for (const message of messagesToUse) {
        if (!hasChanges()) {
            console.log("ℹ️ No more unstaged/uncommitted changes found. Stopping early to prevent empty commits.");
            break;
        }

        console.log(`⏳ Processing commit: "${message}"`);

        try {
            // Stage all changes
            runCommand('git add .');

            // Sanitize message: escape double quotes so the command doesn't break
            const sanitizedMessage = message.replace(/"/g, '\\"');
            
            // Execute commit
            runCommand(`git commit -m "${sanitizedMessage}"`);
            
            console.log(`✅ Success: Committed changes with message.`);
            successfulCommits++;
        } catch (error) {
            console.error(`❌ Failed to commit: ${error.message}`);
            break; // Stop processing if a git error occurs
        }
    }

    // 5. Update the messages file, removing ONLY the ones we successfully used
    if (successfulCommits > 0) {
        const unusedMessages = allMessages.slice(successfulCommits);
        fs.writeFileSync(MESSAGES_FILE, unusedMessages.join('\n') + '\n', 'utf8');
        console.log(`\n🎉 Process complete! Made ${successfulCommits} commits.`);
        console.log(`📝 ${unusedMessages.length} messages remaining in ${path.basename(MESSAGES_FILE)}.`);
    } else {
        console.log(`\n💤 Process finished with 0 commits made (No messages consumed).`);
    }
}

// Execute the script
runAutoCommits().catch(err => {
    console.error("💥 Unexpected Fatal Error:", err);
});
