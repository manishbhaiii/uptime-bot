export async function ownerCommand(interaction, urlManager, pingScheduler) {
  const user = interaction.user;
  
  if (user.id !== process.env.OWNER_ID) {
    return interaction.reply({
      content: 'This command is only available to the bot owner.',
      ephemeral: true
    });
  }

  const commandName = interaction.commandName;

  switch (commandName) {
    case 'list':
      await handleList(interaction, urlManager, pingScheduler);
      break;
    case 'force-remove':
      await handleOwnerRemove(interaction, urlManager);
      break;
  }
}

async function handleList(interaction, urlManager, pingScheduler) {
  const allURLs = urlManager.getAllURLs();
  
  if (allURLs.length === 0) {
    return interaction.reply({
      content: 'No URLs are currently being monitored.',
      ephemeral: true
    });
  }

  let message = `All Monitored URLs (${allURLs.length} total)\n${'='.repeat(50)}\n\n`;

  const userGroups = {};
  for (const [userId, urls] of allURLs) {
    userGroups[userId] = urls;
  }

  for (const [userId, urls] of Object.entries(userGroups)) {
    message += `User ID: ${userId} (${urls.length} URL${urls.length > 1 ? 's' : ''})\n`;
    
    for (const url of urls) {
      const stats = pingScheduler.getStats(userId, url);
      message += `  - ${url}\n`;
      
      if (stats && stats.totalPings > 0) {
        const successRate = ((stats.successCount / stats.totalPings) * 100).toFixed(1);
        message += `    Pings: ${stats.totalPings} | Success: ${successRate}%\n`;
      }
    }
    message += '\n';
  }

  if (message.length > 2000) {
    const chunks = message.match(/[\s\S]{1,1900}/g) || [];
    await interaction.reply({ content: chunks[0], ephemeral: true });
    
    for (let i = 1; i < chunks.length; i++) {
      await interaction.followUp({ content: chunks[i], ephemeral: true });
    }
  } else {
    await interaction.reply({ content: message, ephemeral: true });
  }
}

async function handleOwnerRemove(interaction, urlManager) {
  const targetUserId = interaction.options.getString('user_id');
  const url = interaction.options.getString('url');

  if (!urlManager.hasURL(targetUserId)) {
    return interaction.reply({
      content: `User ${targetUserId} has no URLs registered.`,
      ephemeral: true
    });
  }

  if (url) {
    const removed = urlManager.removeSpecificURL(targetUserId, url);
    if (!removed) {
      return interaction.reply({
        content: `URL not found for user ${targetUserId}.`,
        ephemeral: true
      });
    }
    
    await interaction.reply({
      content: `Removed URL for user ${targetUserId}:\n${url}`,
      ephemeral: true
    });
    
    console.log(`[INFO] Owner removed URL for user ${targetUserId}: ${url}`);
  } else {
    const count = urlManager.getUserURLCount(targetUserId);
    urlManager.removeAllUserURLs(targetUserId);
    
    await interaction.reply({
      content: `Removed all URLs (${count}) for user ${targetUserId}.`,
      ephemeral: true
    });
    
    console.log(`[INFO] Owner removed all URLs for user ${targetUserId}`);
  }
}
