import { en, type MessageKey } from './en.ts'

// One locale for now; a second one is another file with the same keys.
const messages: Record<MessageKey, string> = en

/** Look up a UI string and fill in {placeholders}: t('stats.level', { level: 3 }). */
export function t(key: MessageKey, vars: Record<string, string | number> = {}): string {
  return messages[key].replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  )
}

const pluralRules = new Intl.PluralRules('en')

/** Keys that come in plural forms: 'profile.days' for 'profile.days.one' + 'profile.days.other'. */
type PluralKey = {
  [K in MessageKey]: K extends `${infer Base}.other` ? Base : never
}[MessageKey]

/**
 * Like t(), but picks the right plural form for `count` ("1 day", "2 days").
 * Intl.PluralRules knows each language's rules, so a second locale only needs its own forms.
 */
export function tn(key: PluralKey, count: number, vars: Record<string, string | number> = {}) {
  const form = `${key}.${pluralRules.select(count)}`
  return t((form in messages ? form : `${key}.other`) as MessageKey, vars)
}
