const axios = require('axios');
const { DOMParser } = require('xmldom'); // Use xmldom for Node.js
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function checkAndExtractYear(filterTerm){
    const regex = /(?:1[6-9]|20)\d{2}/;
    const match = filterTerm.match(regex);

    if (match) {
        const year = parseInt(match[0], 10);
        return year;
      } else {
        return null;
      }
}

async function fetchPmidsFromPubMed(firstName, lastName, filterTerm, apiKey, maxResults = 200, rateLimit = 5) {
    const baseUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi';
    let query;
    const term = filterTerm.toLowerCase();
    if (term === 'n/a' || term === 'na') {
        query = `${lastName} ${firstName}`;
    } else {
        const year = checkAndExtractYear(filterTerm);

        if (year != null) {
            query = `${lastName} ${firstName} ${filterTerm} ${year}[pdat]`;
        } else {
            query = `${lastName} ${firstName} ${filterTerm}`;
        }
    }

    console.log(query);
    const params = {
        db: 'pubmed',
        term: query,
        retmax: maxResults,
        api_key: apiKey,
        retmode: 'xml'
    };

    const response = await axios.get(baseUrl, { params });
    if (response.status !== 200) {
        console.log(`Error fetching PMIDs: ${response.status}`);
        return [];
    }

    const totalResults = parseInt(getXmlValue(response.data, 'Count'), 10);
    console.log(`Total results found: ${totalResults}`);

    const pmids = [];
    for (let start = 0; start < totalResults; start += maxResults) {
        params.retstart = start;
        const pageResponse = await axios.get(baseUrl, { params });
        if (pageResponse.status === 200) {
            const pmidList = parsePmidsFromXml(pageResponse.data);
            pmids.push(...pmidList);
        } else {
            console.log(`Error fetching page starting at ${start}: ${pageResponse.status}`);
        }

        await sleep(1000 / rateLimit);
    }
    return pmids;
}

function getXmlValue(xml, tagName) {
    const doc = new DOMParser().parseFromString(xml, 'text/xml');
    const elements = doc.getElementsByTagName(tagName);
    return elements.length > 0 ? elements[0].textContent : null;
}

function parsePmidsFromXml(xmlData) {
    const doc = new DOMParser().parseFromString(xmlData, 'text/xml');
    const idElements = doc.getElementsByTagName('Id');
    const pmids = [];
    for (let i = 0; i < idElements.length; i++) {
        pmids.push(idElements[i].textContent.trim());
    }
    return pmids;
}

module.exports = { fetchPmidsFromPubMed };
