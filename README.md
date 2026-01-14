
## Project Structure

```
uptime-bot/
├── package.json
├── .env
├── .env.example
├── README.md
├── data/
│   └── urls.json
└── src/
    ├── index.js
    ├── commands/
    │   ├── index.js
    │   ├── urlCommand.js
    │   └── ownerCommand.js
    ├── managers/
    │   └── urlManager.js
    ├── services/
    │   └── pingScheduler.js
    └── utils/
        ├── validators.js
        ├── rateLimiter.js
        └── registerCommands.js
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```env
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_client_id_here
OWNER_ID=your_discord_user_id_here
```

3. Run the bot:
```bash
npm start
```

## Commands
check yourself