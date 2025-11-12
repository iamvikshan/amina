import { EmbedBuilder } from 'discord.js'
import { EMBED_COLORS } from '@src/config'

export async function updateSetupStatus(settings: any): Promise<void> {
  settings.server.setup_completed =
    settings.server.updates_channel &&
    settings.server.staff_roles &&
    settings.server.staff_roles.length > 0
}

export function createSetupEmbed(settings: any): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setTitle("Mina's Setup Status")
    .setDescription("Heya! Let's check out your setup progress!")
    .addFields(
      {
        name: 'Updates Channel',
        value: settings.server.updates_channel
          ? `✅ Set to <#${settings.server.updates_channel}>`
          : '❌ Not set yet\nUse `/settings updateschannel` to set it up!',
      },
      {
        name: 'Staff Roles',
        value:
          settings.server.staff_roles && settings.server.staff_roles.length > 0
            ? `✅ ${settings.server.staff_roles.map((id: string) => `<@&${id}>`).join(', ')}`
            : '❌ No staff roles set\nUse `/settings staffadd` to add a staff role!',
      }
    )

  if (settings.server.setup_completed) {
    embed.setFooter({ text: "Yay! Your setup is complete! You're amazing!" })
  } else {
    embed.setFooter({
      text: "Almost there! Complete the setup to unlock all of Mina's awesome features!",
    })
  }

  return embed
}

export default 0
