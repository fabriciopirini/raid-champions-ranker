import https from "https";

export const convertToSlug = ({ text }) => {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-')
}

export const httpGet = async (options) => {
  let body = ''
  return new Promise((resolve, reject) => {
    https.get(options,
      res => {
        res.on('data', chunk => body += chunk)
        res.on('end', () => resolve(body))
      }
    ).on('error', reject)
  })
}

export const countStars = (text) => {
  return text.split('★').length - 1
}

export const GameMode = Object.freeze({
  'Campaign': 1,
  'ArenaDefense': 2,
  'ArenaOffense': 3,
  'ClanBoss': 4,
  'FactionWars': 5,
  'MinotaursLabyrinth': 6,
  'SpidersDen': 7,
  'FireKnightsCastle': 8,
  'DragonsLair': 9,
  'IceGolemsPeak': 10,
  'VoidKeep': 11,
  'ForceKeep': 12,
  'SpiritKeep': 13,
  'MagicKeep': 14,
  'MagmaDragon': 15,
  'NetherSpider': 16,
  'FrostSpider': 17,
  'ScarabKing': 18,
})