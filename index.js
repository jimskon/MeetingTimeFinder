const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'meeting_user',
    password: 'Kenyon1824-348',
    database: 'meeting_app',
});

console.log("Starting");
// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve "index.html" when accessing the root route "/"
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Endpoint to create a meeting
app.post('/api/meetings', (req, res) => {
    const { title, times } = req.body;
    console.log("Meeting:",title,times);
    const link = Math.random().toString(36).substring(2, 15);
    const query = 'INSERT INTO meetings (title, link, times) VALUES (?, ?, ?)';
    db.execute(query, [title, link, JSON.stringify(times)], (err, result) => {
        if (err) return res.status(500).send(err);
        res.send({ link });
    });
});

// Endpoint to get meeting details
app.get('/api/meetings/:link', (req, res) => {
    const { link } = req.params;
    const query = 'SELECT * FROM meetings WHERE link = ?';
    db.execute(query, [link], (err, results) => {
        if (err || results.length === 0) return res.status(404).send('Meeting not found');
        res.send(results[0]);
    });
});

// Endpoint to fetch all meetings
app.get('/api/meetings', (req, res) => {
    const query = 'SELECT title, link FROM meetings';

    db.execute(query, (err, results) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({ error: "Failed to fetch meetings" });
        }
        res.json(results);
    });
});

// Endpoint to submit availability
app.post('/api/meetings/:link/respond', (req, res) => {
    const { link } = req.params;
    const { name, selectedTimes } = req.body;

    const query = 'SELECT * FROM meetings WHERE link = ?';
    db.execute(query, [link], (err, results) => {
        if (err || results.length === 0) return res.status(404).send('Meeting not found');

        const meeting = results[0];
        const responses = JSON.parse(meeting.responses || '{}');
        responses[name] = selectedTimes;

        const updateQuery = 'UPDATE meetings SET responses = ? WHERE link = ?';
        db.execute(updateQuery, [JSON.stringify(responses), link], (updateErr) => {
            if (updateErr) return res.status(500).send(updateErr);
            res.send('Response submitted');
        });
    });
});

// Start the server
const PORT = 3000;
app.listen(PORT,'0.0.0.0', () => console.log(`Server running on http://0.0.0.0:${PORT}`));
