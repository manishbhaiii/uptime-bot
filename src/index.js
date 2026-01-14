import { Client, GatewayIntentBits, Events } from 'discord.js';
import { config } from 'dotenv';
import { URLManager } from './managers/urlManager.js';
import { PingScheduler } from './services/pingScheduler.js';
import { registerCommands } from './utils/registerCommands.js';
import { handleCommand } from './commands/index.js';

config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

const urlManager = new URLManager();
const pingScheduler = new PingScheduler(urlManager);

client.once(Events.ClientReady, async (c) => {
  console.log(`[INFO] Logged in as ${c.user.tag}`);
  console.log(`[INFO] Monitoring ${urlManager.getURLCount()} URLs`);
  
  await registerCommands();
  
  pingScheduler.start();
  console.log('[INFO] Ping scheduler started (10-minute intervals)');
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  
  try {
    await handleCommand(interaction, urlManager, pingScheduler);
  } catch (error) {
    console.error('[ERROR] Command handler error:', error);
    const errorMsg = 'An error occurred while processing your request.';
    
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(errorMsg);
    } else {
      await interaction.reply({ content: errorMsg, ephemeral: true });
    }
  }
});

client.on(Events.GuildMemberRemove, async (member) => {
  const userId = member.user.id;
  
  if (urlManager.hasURL(userId)) {
    const url = urlManager.getURL(userId);
    urlManager.removeURL(userId);
    console.log(`[INFO] User ${member.user.tag} (${userId}) left server. Removed URL: ${url}`);
  }
});

process.on('unhandledRejection', (error) => {
  console.error('[ERROR] Unhandled promise rejection:', error);
});

client.on(Events.Error, (error) => {
  console.error('[ERROR] Discord client error:', error);
});

client.login(process.env.DISCORD_TOKEN);
