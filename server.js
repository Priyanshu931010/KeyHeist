const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Serve static files from current directory
app.use(express.static(path.join(__dirname)));

// --- DATABASE CONNECTION ---
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',       // CHECK THIS: Your MySQL username
    password: 'sahoo@9310109618', // CHECK THIS: Your MySQL password
    database: 'keyheist_db'
});

db.connect(err => {
    if (err) console.error(' [CRITICAL] Database Connection Failed:', err);
    else console.log(' [SYSTEM] Connected to KeyHeist Vault.');
});

// --- API ENDPOINTS ---

// 1. DASHBOARD LOAD (The "My Assets" Page) - NEW!
// This fetches all tags belonging to a specific user
app.get('/api/my-assets', (req, res) => {
    // In a real app, this email comes from the Login Session.
    // For now, we hardcode it or pass it as a query param.
    const userEmail = req.query.email || 'admin@keyvault.sys'; 

    const sql = `
        SELECT k.*, 
               (SELECT JSON_ARRAYAGG(JSON_OBJECT('finder_msg', m.finder_msg, 'finder_contact', m.finder_contact)) 
                FROM messages m 
                WHERE m.qr_id = k.qr_id) as messages
        FROM keychains k 
        WHERE k.owner_email = ?`;

    db.query(sql, [userEmail], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// 2. CHECK TAG STATUS (For keyheist.html)
app.get('/api/check-tag/:id', (req, res) => {
    const sql = 'SELECT is_registered, tag_name FROM keychains WHERE qr_id = ?';
    db.query(sql, [req.params.id], (err, result) => {
        if (err || result.length === 0) return res.json({ status: 'INVALID' });
        res.json({ 
            status: result[0].is_registered ? 'REGISTERED' : 'UNREGISTERED',
            tagName: result[0].tag_name 
        });
    });
});

// 3. REGISTER TAG
app.post('/api/register', (req, res) => {
    const { qr_id, email, pin, name } = req.body;
    const sql = 'UPDATE keychains SET owner_email = ?, security_pin = ?, tag_name = ?, is_registered = TRUE WHERE qr_id = ?';
    db.query(sql, [email, pin, name, qr_id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Error registering tag' });
        res.json({ success: true });
    });
});

// 4. ALERT OWNER (Save Message) - UPDATED!
app.post('/api/alert-owner', (req, res) => {
    const { qr_id, finder_msg, finder_contact } = req.body;

    // First, mark the item as MISSING if it isn't already
    db.query('UPDATE keychains SET status = "MISSING" WHERE qr_id = ?', [qr_id]);

    // Second, save the message
    const sql = 'INSERT INTO messages (qr_id, finder_msg, finder_contact) VALUES (?, ?, ?)';
    db.query(sql, [qr_id, finder_msg, finder_contact], (err, result) => {
        if (err) return res.status(500).json({ error: 'Error saving message' });
        
        console.log(` [ALERT] New message for ${qr_id}: ${finder_msg}`);
        res.json({ success: true });
    });
});

app.listen(3000, () => {
    console.log(' [SYSTEM] KeyHeist Server running on port 3000');
});