export default async function toggleAll(
  status: boolean,
  settings: any
): Promise<string> {
  settings.logs.enabled = status
  settings.logs.member.message_edit = status
  settings.logs.member.message_delete = status
  settings.logs.member.role_changes = status
  settings.logs.channel.create = status
  settings.logs.channel.edit = status
  settings.logs.channel.delete = status
  settings.logs.role.create = status
  settings.logs.role.edit = status
  settings.logs.role.delete = status
  settings.automod.anti_ghostping = status
  await settings.save()
  return `All logging has been ${status ? 'enabled' : 'disabled'}!`
}
