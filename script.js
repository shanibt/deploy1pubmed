document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("pubMedForm");

    form.addEventListener("submit", function (event) {
        event.preventDefault();

        const fname = form.elements["fname"].value.trim();
        const lname = form.elements["lname"].value.trim();
        const fterm = form.elements["fterm"].value.trim();
        const fullCit = form.elements["fullCit"].checked ? 1 : 0;
        const image = form.elements["image"].checked ? 1 : 0;

        const payload = { fname, lname, fterm, fullCit, image };

        fetch('/run-pubmed', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.blob();
        })
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'output.html';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        })
        .catch(error => {
            console.error('Fetch error:', error);
            alert('Failed to fetch or download the file.');
        });
        
    });
});
