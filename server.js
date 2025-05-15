const express = require("express");
const bodyParser = require("body-parser");
const { exec } = require("child_process");
const path = require("path");

const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Serve static files from the 'public' directory
// app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(__dirname));

// Handle root route to serve index.html
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
    // res.sendFile(path.join(__dirname, "public", "index.html"));

});

// Endpoint to run the Node.js script
app.post("/run-pubmed", (req, res) => {
    const { fname, lname, fterm, fullCit, image } = req.body;

    // Construct command
    const cmd = `node includes/main.js ${fname} ${lname} ${fterm} ${fullCit} ${image} output/output.html`;
    console.log("Running:", cmd);

    exec(cmd, (error, stdout, stderr) => {
        if (error) {
            console.error("Error:", stderr);
            return res.status(500).send("Command failed.");
        }

        // Send output.html as downloadable file
        const outputPath = path.join(__dirname, "output", "output.html");
        res.download(outputPath, "output.html", (err) => {
            if (err) {
                console.error("Download error:", err);
                res.status(500).send("Failed to download output.");
            }
        });
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
