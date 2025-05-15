const axios = require('axios');
const { DOMParser } = require('xmldom');

async function fetchCitationsFromPmids(pmids, apiKey, journalImages, rateLimit = 5) {
    const baseUrl = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi";
    let citations = {};

    for (let i = 0; i < pmids.length; i += 200) {
        const pmidChunk = pmids.slice(i, i + 200);
        const ids = pmidChunk.join(',');

        const params = {
            db: "pubmed",
            id: ids,
            retmode: "xml",
            api_key: apiKey,
        };

        try {
            const response = await axios.get(baseUrl, { params });
            if (response.status === 200) {
                const parsedCitations = parseCitationsFromXml(response.data, journalImages);
                citations = { ...citations, ...parsedCitations };
            } else {
                console.log(`Error fetching citations for PMIDs: ${response.status}`);
            }
        } catch (error) {
            console.log(`Error fetching citations: ${error.message}`);
        }

        await new Promise(resolve => setTimeout(resolve, 1000 / rateLimit));
    }

    return citations;
}

function getTextContent(parent, tagName) {
    const el = parent.getElementsByTagName(tagName)[0];
    return el ? el.textContent : '';
}

function extractDate(pubDateEl) {
    let year = getTextContent(pubDateEl, 'Year');
    let month = getTextContent(pubDateEl, 'Month');
    let day = getTextContent(pubDateEl, 'Day');

    const season = getTextContent(pubDateEl, 'Season');
    const medlineDate = getTextContent(pubDateEl, 'MedlineDate');

    if (season) {
        month = season.split('-')[0];
    }

    if (medlineDate) {
        const parts = medlineDate.split(' ');
        year = parts[0];
        if (parts[1]) month = parts[1].split('-')[0];
        if (parts[2]) day = parts[2];
    }

    return { year, month, day };
}

function parseCitationsFromXml(xmlData, journalImages) {
    const doc = new DOMParser().parseFromString(xmlData, 'text/xml');
    const articles = doc.getElementsByTagName('PubmedArticle');
    const citations = {};

    for (let i = 0; i < articles.length; i++) {
        const article = articles[i];
        const citation = {};

        const articleEl = article.getElementsByTagName('Article')[0];
        const journalEl = article.getElementsByTagName('Journal')[0];
        const journalIssueEl = journalEl?.getElementsByTagName('JournalIssue')[0];
        const pubDateEl = journalIssueEl?.getElementsByTagName('PubDate')[0];

        citation.title = getTextContent(articleEl, 'ArticleTitle');

        const authorEls = articleEl?.getElementsByTagName('Author') || [];
        const authors = [];
        for (let j = 0; j < authorEls.length; j++) {
            const author = authorEls[j];
            const foreName = getTextContent(author, 'ForeName');
            const lastName = getTextContent(author, 'LastName');
            if (foreName || lastName) {
                authors.push(`${foreName} ${lastName}`.trim());
            }
        }
        citation.authors = authors.join(', ');

        citation.journalName = getTextContent(journalEl, 'ISOAbbreviation');

        if (journalImages) {
            const imgKey = citation.journalName?.replace('.', '')?.trim();
            citation.journalImage = journalImages[imgKey] || null;
        }

        if (pubDateEl) {
            const { year, month, day } = extractDate(pubDateEl);
            citation.year = year;
            citation.month = month;
            citation.day = day;
        }

        const volume = getTextContent(journalIssueEl, 'Volume');
        const issue = getTextContent(journalIssueEl, 'Issue');
        const pages = getTextContent(articleEl, 'MedlinePgn');

        citation.volume = volume ? `;${volume}` : '';
        citation.issue = issue ? `(${issue})` : '';
        citation.pages = pages ? `:${pages}` : '';
        citation.source = `${citation.year} ${citation.month} ${citation.day};${citation.volume}${citation.issue}${citation.pages}`;

        // DOI
        const articleIdList = article.getElementsByTagName('ArticleIdList')[0];
        let doi = 'N/A';
        if (articleIdList) {
            const ids = articleIdList.getElementsByTagName('ArticleId');
            for (let k = 0; k < ids.length; k++) {
                const idNode = ids[k];
                if (idNode.getAttribute('IdType') === 'doi') {
                    doi = idNode.textContent;
                    break;
                }
            }
        }
        citation.doi = doi;

        // PMID
        const pmidEl = article.getElementsByTagName('PMID')[0];
        if (pmidEl) {
            const pmid = pmidEl.textContent;
            citation.pmid = pmid;
            citations[pmid] = citation;
        }
    }

    return citations;
}

module.exports = {
    fetchCitationsFromPmids,
    parseCitationsFromXml,
};
