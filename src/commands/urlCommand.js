import { validateURL } from '../utils/validators.js';
import { RateLimiter } from '../utils/rateLimiter.js';

const rateLimiter = new RateLimiter();

export async function urlCommand(interaction, urlManager, pingScheduler) {
  const commandName = interaction.commandName;
  const user = interaction.user;
  const isOwner = user.id === process.env.OWNER_ID;

  switch (commandName) {
    case 'add':
      await handleAdd(interaction, user, urlManager, isOwner);
      break;
    case 'remove':
      await handleRemove(interaction, user, urlManager, isOwner);
      break;
    case 'status':
      await handleStatus(interaction, user, urlManager, pingScheduler);
      break;
  }
}

async function handleAdd(interaction, user, urlManager, isOwner) {
  if (!isOwner && !rateLimiter.canModify(user.id)) {
    const timeLeft = rateLimiter.getTimeUntilReset(user.id);
    return interaction.reply({
      content: `Please wait ${Math.ceil(timeLeft / 1000)} seconds before modifying your URL again.`,
      ephemeral: true
    });
  }

  const url = interaction.options.getString('url').trim();

  const validation = validateURL(url);
  if (!validation.valid) {
    return interaction.reply({
      content: `Invalid URL: ${validation.error}`,
      ephemeral: true
    });
  }

  if (!isOwner) {
    const existingUser = urlManager.findUserByURL(url);
    if (existingUser && existingUser !== user.id) {
      return interaction.reply({
        content: 'This URL is already being monitored by another user.',
        ephemeral: true
      });
    }

    if (urlManager.getUserURLCount(user.id) >= 1) {
      return interaction.reply({
        content: 'You can only add 1 URL. Remove your existing URL first or contact the bot owner.',
        ephemeral: true
      });
    }
  }

  urlManager.addURL(user.id, url);
  
  if (!isOwner) {
    rateLimiter.recordModification(user.id);
  }

  const userURLs = urlManager.getUserURLs(user.id);
  await interaction.reply({
    content: `URL added successfully! You now have ${userURLs.length} URL(s) being monitored:\n${url}`,
    ephemeral: true
  });

  console.log(`[INFO] User ${user.tag} (${user.id}) added URL: ${url}`);
}

async function handleRemove(interaction, user, urlManager, isOwner) {
  const userURLs = urlManager.getUserURLs(user.id);
  
  if (userURLs.length === 0) {
    return interaction.reply({
      content: 'You don\'t have any URLs registered.',
      ephemeral: true
    });
  }

  if (!isOwner && !rateLimiter.canModify(user.id)) {
    const timeLeft = rateLimiter.getTimeUntilReset(user.id);
    return interaction.reply({
      content: `Please wait ${Math.ceil(timeLeft / 1000)} seconds before modifying your URL again.`,
      ephemeral: true
    });
  }

  const url = interaction.options.getString('url');
  
  if (url) {
    const removed = urlManager.removeSpecificURL(user.id, url);
    if (!removed) {
      return interaction.reply({
        content: 'URL not found in your list.',
        ephemeral: true
      });
    }
    
    if (!isOwner) {
      rateLimiter.recordModification(user.id);
    }
    
    await interaction.reply({
      content: `URL removed:\n${url}`,
      ephemeral: true
    });
    
    console.log(`[INFO] User ${user.tag} (${user.id}) removed URL: ${url}`);
  } else {
    urlManager.removeAllUserURLs(user.id);
    
    if (!isOwner) {
      rateLimiter.recordModification(user.id);
    }
    
    await interaction.reply({
      content: `All your URLs (${userURLs.length}) have been removed.`,
      ephemeral: true
    });
    
    console.log(`[INFO] User ${user.tag} (${user.id}) removed all URLs`);
  }
}

async function handleStatus(interaction, user, urlManager, pingScheduler) {
  const userURLs = urlManager.getUserURLs(user.id);
  
  if (userURLs.length === 0) {
    return interaction.reply({
      content: 'You don\'t have any URLs registered. Use `/add` to add one.',
      ephemeral: true
    });
  }

  let statusMsg = `URL Status (${userURLs.length} URL${userURLs.length > 1 ? 's' : ''})\n${'='.repeat(40)}\n\n`;

  for (const url of userURLs) {
    const stats = pingScheduler.getStats(user.id, url);
    statusMsg += `URL: ${url}\n`;
    
    if (stats) {
      statusMsg += `Last Success: ${stats.lastSuccess ? new Date(stats.lastSuccess).toLocaleString() : 'Never'}\n`;
      statusMsg += `Last Failure: ${stats.lastFailure ? new Date(stats.lastFailure).toLocaleString() : 'Never'}\n`;
      statusMsg += `Total Pings: ${stats.totalPings}\n`;
      statusMsg += `Success: ${stats.successCount} | Failed: ${stats.failureCount}\n`;
      
      if (stats.totalPings > 0) {
        const successRate = ((stats.successCount / stats.totalPings) * 100).toFixed(1);
        statusMsg += `Success Rate: ${successRate}%\n`;
      }
    } else {
      statusMsg += 'No pings yet\n';
    }
    statusMsg += '\n';
  }

  await interaction.reply({
    content: statusMsg,
    ephemeral: true
  });
}
