import { urlCommand } from './urlCommand.js';
import { ownerCommand } from './ownerCommand.js';

export async function handleCommand(interaction, urlManager, pingScheduler) {
  const { commandName } = interaction;
  
  switch (commandName) {
    case 'add':
    case 'remove':
    case 'status':
      await urlCommand(interaction, urlManager, pingScheduler);
      break;
    case 'list':
    case 'force-remove':
      await ownerCommand(interaction, urlManager, pingScheduler);
      break;
    default:
      await interaction.reply({
        content: 'Unknown command.',
        ephemeral: true
      });
  }
}
