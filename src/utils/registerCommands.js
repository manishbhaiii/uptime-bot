import { REST, Routes, SlashCommandBuilder } from 'discord.js';

export async function registerCommands() {
  const commands = [
    new SlashCommandBuilder()
      .setName('add')
      .setDescription('Add a URL to monitor')
      .addStringOption(opt =>
        opt
          .setName('url')
          .setDescription('The HTTP/HTTPS URL to monitor')
          .setRequired(true)
      ),

    new SlashCommandBuilder()
      .setName('remove')
      .setDescription('Remove a monitored URL')
      .addStringOption(opt =>
        opt
          .setName('url')
          .setDescription('Specific URL to remove (leave empty to remove all)')
          .setRequired(false)
      ),

    new SlashCommandBuilder()
      .setName('status')
      .setDescription('Check URL ping statistics'),

    new SlashCommandBuilder()
      .setName('list')
      .setDescription('View all monitored URLs (Owner only)'),

    new SlashCommandBuilder()
      .setName('force-remove')
      .setDescription('Force remove URLs for any user (Owner only)')
      .addStringOption(opt =>
        opt
          .setName('user_id')
          .setDescription('Discord User ID')
          .setRequired(true)
      )
      .addStringOption(opt =>
        opt
          .setName('url')
          .setDescription('Specific URL to remove (leave empty to remove all)')
          .setRequired(false)
      )
  ].map(cmd => cmd.toJSON());

  try {
    const rest = new REST().setToken(process.env.DISCORD_TOKEN);
    
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );
    
    console.log('[INFO] Slash commands registered successfully');
  } catch (error) {
    console.error('[ERROR] Failed to register commands:', error);
  }
}
