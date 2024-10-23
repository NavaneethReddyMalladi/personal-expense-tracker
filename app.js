const express = require('express');
const db = require('./dababase');
const app = express();
const port = 3000;

app.use(express.json());

const getCurrentDate = () => new Date().toISOString().slice(0, 10);

app.get('/', (req, res) => {
    res.send('Welcome to the Personal Expense Tracker API');
});

app.post('/transaction', (req, res) => {
    const { type, category_id, amount, description } = req.body;
    const date = getCurrentDate();

    db.run(`INSERT INTO transactions (type, category_id, amount, date, description)
            VALUES (?, ?, ?, ?, ?)`,
        [type, category_id, amount, date, description],
        function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ id: this.lastID });
        }
    );
});

app.get('/transactios', (req, res) => {
    db.all(`SELECT * FROM transactions`, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ transactions: rows });
    });
});

app.get('/transactions/:id', (req, res) => {
    const { id } = req.params;
    db.get(`SELECT * FROM transactions WHERE id = ?`, [id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        res.json(row);
    });
});


app.put('/transactions/:id', (req, res) => {
    const { id } = req.params;
    const { type, category_id, amount, description } = req.body;
    const date = getCurrentDate();

    db.run(`UPDATE transactions SET type = ?, category_id = ?, amount = ?, date = ?, description = ?
            WHERE id = ?`,
        [type, category_id, amount, date, description, id],
        function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Transaction not found' });
            }
            res.json({ message: 'Transaction updated' });
        }
    );
});

app.delete('/transaction/:id', (req, res) => {
    const { id } = req.params;
    db.run(`DELETE FROM transactions WHERE id = ?`, [id], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        res.json({ message: 'Transaction deleted' });
    });
});

app.get('/summary', (req, res) => {
    db.all(`SELECT type, SUM(amount) as total FROM transactions GROUP BY type`, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        const summary = {
            totalIncome: 0,
            totalExpenses: 0,
            balance: 0
        };

        rows.forEach(row => {
            if (row.type === 'income') {
                summary.totalIncome = row.total;
            } else if (row.type === 'expense') {
                summary.totalExpenses = row.total;
            }
        });

        summary.balance = summary.totalIncome - summary.totalExpenses;
        res.json(summary);
    });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
