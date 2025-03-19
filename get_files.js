const axios = require('axios');
const fs = require('fs'); 
const path = require('path');

async function downloadFile(url, folder = 'downloads') {
    try {
        // Create downloads folder if it doesn't exist
        await fs.promises.mkdir(folder, { recursive: true });

        // Get filename from URL or create a default one
        const urlObj = new URL(url);
        let filename = path.basename(urlObj.pathname);
        if (!filename) {
            filename = `downloaded_file_${Date.now()}${path.extname(urlObj.pathname) || ''}`;
        }

        const filepath = path.join(folder, filename);

        // Download the file
        const response = await axios({
            method: 'get',
            url: url,
            responseType: 'stream'
        });

        // Write the file using regular fs.createWriteStream
        await new Promise((resolve, reject) => {
            const writer = response.data.pipe(fs.createWriteStream(filepath));
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        console.log(`Successfully downloaded: ${filename}`);
        return true;

    } catch (error) {
        console.error(`Error downloading ${url}: ${error.message}`);
        return false;
    }
}

async function downloadLinksFromJson(jsonFile) {
    try {
        // Read and parse the JSON file
        const data = await fs.promises.readFile(jsonFile, 'utf8');
        const urls = JSON.parse(data);

        if (!Array.isArray(urls) || urls.length === 0) {
            console.log('No valid URL array found in the JSON file');
            return;
        }

        // Download each URL
        let successful = 0;
        let failed = 0;

        for (const url of urls) {
            if (typeof url === 'string' && url.startsWith('http')) {
                if (await downloadFile(url)) {
                    successful++;
                } else {
                    failed++;
                }
            } else {
                console.log(`Skipping invalid URL: ${url}`);
                failed++;
            }
        }

        // Print summary
        console.log('\nDownload Summary:');
        console.log(`Successful downloads: ${successful}`);
        console.log(`Failed downloads: ${failed}`);

    } catch (error) {
        if (error.code === 'ENOENT') {
            console.error(`Error: File '${jsonFile}' not found`);
        } else if (error instanceof SyntaxError) {
            console.error(`Error: Invalid JSON format in '${jsonFile}'`);
        } else {
            console.error(`Error processing file: ${error.message}`);
        }
    }
}

// Run the script
async function main() {
    const jsonFile = 'urls.json';
    console.log(`Starting download process from ${jsonFile}...\n`);
    await downloadLinksFromJson(jsonFile);
}

main().catch(console.error);