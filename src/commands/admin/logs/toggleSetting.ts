export default async function toggleSetting(
  settings: any,
  path: string,
  status: boolean
): Promise<string> {
  let obj = settings
  const parts = path.split('.')
  const lastPart = parts.pop()
  
  for (const part of parts) {
    if (!obj[part]) obj[part] = {}
    obj = obj[part]
  }
  
  if (lastPart) {
    obj[lastPart] = status
  }
  
  await settings.save()
  return `${path.split('.').pop()?.replace('_', ' ')} logging has been ${status ? 'enabled' : 'disabled'}!`
}
