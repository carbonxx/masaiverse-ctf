// app.js

const express = require('express');
const bodyParser = require('body-parser');
const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL);

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(express.static(__dirname));

const flags = {
  STAGE1: 'crypto_master',
  STAGE2: 'js_ninja',
  STAGE3: 'web_sleuth',
  STAGE4: 'css_hacker',
  STAGE5: 'api_master'
};

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.post('/checkFlag', (req, res) => {
  if (!req.body.flag) {
    return res.status(400).json({ success: false, message: 'No flag provided' });
  }

  const userFlag = req.body.flag.trim().toLowerCase();

  if (userFlag === flags.STAGE1.toLowerCase()) {
    res.json({ success: true, message: 'FLAG1' });
  } else if (userFlag === flags.STAGE2.toLowerCase()) {
    res.json({ success: true, message: 'FLAG2' });
  } else if (userFlag === flags.STAGE3.toLowerCase()) {
    res.json({ success: true, message: 'FLAG3' });
  } else if (userFlag === flags.STAGE4.toLowerCase()) {
    res.json({ success: true, message: 'FLAG4' });
  } else if (userFlag === flags.STAGE5.toLowerCase()) {
    res.json({ success: true, message: 'FLAG5' });
  } else {
    res.status(403).json({ success: false, message: 'INCORRECT' });
  }
});

app.get('/classified-intel', (req, res) => {
  res.setHeader('X-Secret-Flag', 'web_sleuth');
  res.status(403).send(`
    <html>
      <head>
        <title>403 Forbidden</title>
        <style>
          body { background-color: #111; color: #f00; font-family: monospace; text-align: center; padding-top: 50px; }
        </style>
      </head>
      <body>
        <h1>403 ERROR: ACCESS DENIED</h1>
        <p>You do not have the required clearance to view this directory.</p>
        <!-- The intelligence you seek is right in front of you. Oh, and here's a backup of the terminal override code: web_sleuth -->
        <!-- Admin note: The API testing token is "masai2026" -->
      </body>
    </html>
  `);
});

app.get('/ping', (req, res) => {
    if (req.query.token === 'masai2026') {
        res.json({ status: 'success', flag: 'api_master' });
    } else {
        res.status(401).json({ status: 'error', message: 'Missing or Invalid token query parameter' });
    }
});

app.get('/api/leaderboard', async (req, res) => {
    try {
        const data = await redis.get('masaiverse_leaderboard');
        const leaderboard = data ? JSON.parse(data) : [];
        res.json(leaderboard);
    } catch (error) {
        console.error("KV GET Error:", error);
        res.status(500).json([]);
    }
});

app.post('/api/leaderboard', async (req, res) => {
    try {
        const { name, timeMs, timeFormatted } = req.body;
        if (name && timeMs !== undefined) {
            const data = await redis.get('masaiverse_leaderboard');
            let leaderboard = data ? JSON.parse(data) : [];
            leaderboard.push({ name, timeMs, timeFormatted });
            leaderboard.sort((a,b) => a.timeMs - b.timeMs);
            await redis.set('masaiverse_leaderboard', JSON.stringify(leaderboard));
        }
        res.json({ success: true });
    } catch (error) {
        console.error("KV POST Error:", error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
});

app.get('/api/leaderboard/reset', async (req, res) => {
    const adminToken = process.env.ADMIN_TOKEN || 'masai2026-admin_reset';
    if (req.query.token === adminToken) {
        try {
            await redis.set('masaiverse_leaderboard', JSON.stringify([]));
            res.json({ success: true, message: 'Leaderboard manually reset.' });
        } catch (error) {
            console.error("KV Reset Error:", error);
            res.status(500).json({ success: false, message: 'Error resetting leaderboard.' });
        }
    } else {
        res.status(403).json({ success: false, message: 'Invalid admin token.' });
    }
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

module.exports = app;
