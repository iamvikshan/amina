import { MinaEmbed } from '@structures/embeds/MinaEmbed'

export async function updateSetupStatus(settings: any): Promise<void> {
  settings.server.setup_completed =
    settings.server.updates_channel &&
    settings.server.staff_roles &&
    settings.server.staff_roles.length > 0
}

export function createSetupEmbed(settings: any) {
  const embed = MinaEmbed.primary()
    .setTitle("mina's setup status")
    .setDescription("heya! let's check out your setup progress!")
    .addFields(
      {
        name: 'updates channel',
        value: settings.server.updates_channel
          ? `set to <#${settings.server.updates_channel}>`
          : 'not set yet\nuse `/settings updateschannel` to set it up!',
      },
      {
        name: 'staff roles',
        value:
          settings.server.staff_roles && settings.server.staff_roles.length > 0
            ? `${settings.server.staff_roles.map((id: string) => `<@&${id}>`).join(', ')}`
            : 'no staff roles set\nuse `/settings staffadd` to add a staff role!',
      }
    )

  if (settings.server.setup_completed) {
    embed.setFooter({ text: "yay! your setup is complete! you're amazing!" })
  } else {
    embed.setFooter({
      text: "almost there! complete the setup to unlock all of mina's awesome features!",
    })
  }

  return embed
}

export default 0
