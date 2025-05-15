const fs = require('fs');

async function saveCitationsToFile(citations, filename, fullCitation, journImg) {
    // Sort citations by year in descending order (most recent first)
    const sortedCitations = Object.values(citations).sort((a, b) => b.year - a.year);

    let html = `<html><head><title>Citations</title>
        <style>
            a { color: blue; text-decoration: none; }
            .container { display: inline-block; width: 20%; margin: 10px; position: relative; }
            .image { opacity: 1; display: block; width: 100%; height: auto; transition: .5s ease; backface-visibility: hidden; }
            .middle { transition: .5s ease; opacity: 0; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); }
            .container:hover .image { opacity: 0.3; }
            .container:hover .middle { opacity: 1; }
            .text { color: black; font-size: 10px; }
        </style>
        </head><body>`;

    let currentYear = null;
    for (const citation of sortedCitations) {
        const year = citation.year;

        // If the year changes, write a new header (H1) for the new year
        if (year !== currentYear) {
            if (currentYear) {
                html += '<br><hr><br>';
            }
            html += `<h1>${year}</h1>`;
            currentYear = year;
        }

        // Citation
        const pubmedUrl = `https://pubmed.ncbi.nlm.nih.gov/${citation.pmid}/`;
        if (journImg && citation.journalImage) {
            html += `<div class="container">
                        <img src="${citation.journalImage}" alt="${citation.journalName}" class="image">
                        <a href="${pubmedUrl}" target="_blank">
                            <div class="middle">
                                <div class="text">${citation.title}</div>
                            </div>
                        </a>
                      </div>`;
        } else {
            html += `<div class="citation">
                        <a href="${pubmedUrl}" target="_blank">${citation.title}</a>
                        ${fullCitation ? ` ${citation.authors}. ${citation.journalName}. ${citation.source}. DOI: ${citation.doi}. PMID: ${citation.pmid}.` : ''}
                     </div><br>`;
        }
    }

    html += `</body></html>`;
    
    fs.writeFileSync(filename, html, 'utf-8');
}

module.exports = { saveCitationsToFile };
