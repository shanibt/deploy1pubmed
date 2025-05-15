const fs = require('fs');
const path = require('path');
const { loadJournalImages } = require('./step0.js');
const { fetchPmidsFromPubMed } = require('./step1');
const { fetchCitationsFromPmids } = require('./step2');
const { saveCitationsToFile } = require('./step3');

// Main function to handle the entire publication scraping process
async function publicationScraping(firstName, lastName, filterTerm, fullCitation, journImg, citationsOutputFile) {
    const apiKey = process.env.API_KEY;

    console.log(`Starting scraping for ${firstName} ${lastName}...`);

    // Step 0: Clear existing output files if they exist
    if (fs.existsSync(citationsOutputFile)) {
        fs.unlinkSync(citationsOutputFile);
        console.log(`${citationsOutputFile} has been cleared.`);
    }

    let journalImages = null;
    if (journImg) {
        const pluginDir = path.dirname(__filename);
        const csvFilePath = path.join(pluginDir, './journal_images.csv');
        journalImages = await loadJournalImages(csvFilePath);
    }
    console.log(journalImages);

    // Step 1: Fetch PMIDs
    const pmidList = await fetchPmidsFromPubMed(firstName, lastName, filterTerm, apiKey);
    console.log(`Fetched ${pmidList.length} PMIDs for ${firstName} ${lastName}.`);
    console.log(pmidList);

    // Step 2: Fetch citations for the PMIDs
    const citations = await fetchCitationsFromPmids(pmidList, apiKey, journalImages);
    console.log(`Fetched citations for ${citations.length} articles.`);
    console.log(citations);

    // Step 3: Save citations to file, sorted by year
    await saveCitationsToFile(citations, citationsOutputFile, fullCitation, journImg);
    console.log(`Citations have been saved to ${citationsOutputFile}.`);
}

// Entry point for script execution
if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.length < 6) {
        console.log('Usage: node main.js <first_name> <last_name> <filter_term> <full_citation> <journImg> <citation_output_file>');
        process.exit(1); // Exit the script if the wrong number of arguments is passed
    }

    const [firstName, lastName, filterTerm, fullCitationStr, journImgStr, citationsOutputFile] = args;
    const fullCitation = fullCitationStr === '1';
    const journImg = journImgStr === '1';
    publicationScraping(firstName, lastName, filterTerm, fullCitation, journImg, citationsOutputFile);
}
