import express from 'express';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());

// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, '../')));

let db;

(async () => {
  db = await open({
    filename: './casamento.db',
    driver: sqlite3.Database
  });
  await db.exec(`CREATE TABLE IF NOT EXISTS etapas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL
  );`);
  await db.exec(`CREATE TABLE IF NOT EXISTS itens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    etapa_id INTEGER,
    nome TEXT NOT NULL,
    valor REAL,
    FOREIGN KEY(etapa_id) REFERENCES etapas(id) ON DELETE CASCADE
  );`);
})();

// Rotas Etapas
app.get('/etapas', async (req, res) => {
  const etapas = await db.all('SELECT * FROM etapas');
  for (const etapa of etapas) {
    etapa.itens = await db.all('SELECT * FROM itens WHERE etapa_id = ?', etapa.id);
  }
  res.json(etapas);
});

app.post('/etapas', async (req, res) => {
  const { nome } = req.body;
  const result = await db.run('INSERT INTO etapas (nome) VALUES (?)', nome);
  res.json({ id: result.lastID, nome, itens: [] });
});

app.delete('/etapas/:id', async (req, res) => {
  await db.run('DELETE FROM etapas WHERE id = ?', req.params.id);
  res.json({ ok: true });
});

// Rotas Itens
app.post('/etapas/:etapaId/itens', async (req, res) => {
  const { nome, valor } = req.body;
  const result = await db.run('INSERT INTO itens (etapa_id, nome, valor) VALUES (?, ?, ?)', req.params.etapaId, nome, valor);
  res.json({ id: result.lastID, nome, valor });
});

app.delete('/itens/:id', async (req, res) => {
  await db.run('DELETE FROM itens WHERE id = ?', req.params.id);
  res.json({ ok: true });
});

// Rota para transferir item entre etapas
app.put('/itens/:id', async (req, res) => {
  const { etapa_id } = req.body;
  await db.run('UPDATE itens SET etapa_id = ? WHERE id = ?', etapa_id, req.params.id);
  res.json({ ok: true });
});

// Rota de login simples
app.post('/login', (req, res) => {
  const { user, pass } = req.body;
  if (user === 'casamento' && pass === '1234') {
    res.json({ ok: true });
  } else {
    res.status(401).json({ ok: false, message: 'Usuário ou senha incorretos' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
