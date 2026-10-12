import { en, type MessageKey } from './en'

// One locale for now; a second one is another file with the same keys.
const messages: Record<MessageKey, string> = en

/** Look up a UI string and fill in {placeholders}: t('stats.level', { level: 3 }). */
export function t(key: MessageKey, vars: Record<string, string | number> = {}): string {
  return messages[key].replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  )
}
