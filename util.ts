// provided by https://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex

export function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}
