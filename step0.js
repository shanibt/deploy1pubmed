const fs = require('fs');
const Papa = require('papaparse');

function loadJournalImages(csvFile) {
    return new Promise((resolve, reject) => {
        const imgDict = {};
        
        // Read the CSV file as a string
        fs.readFile(csvFile, 'utf8', (err, data) => {
            if (err) {
                return reject(err);
            }
            
            // Parse the CSV data using PapaParse
            Papa.parse(data, {
                header: false, // Assumes the CSV doesn't have headers
                skipEmptyLines: true,
                dynamicTyping: true,
                complete: (result) => {
                    // Loop through each row in the parsed result
                    result.data.forEach((row) => {
                        if (row.length >= 2) {
                            const [journalName, imageUrl] = [row[0].trim(), row[1].trim()];
                            imgDict[journalName] = imageUrl;
                        }
                    });
                    resolve(imgDict); // Resolve the promise with the image dictionary
                },
                error: (err) => {
                    reject(err); // Reject the promise if there's an error
                }
            });
        });
    });
}

module.exports = { loadJournalImages};

