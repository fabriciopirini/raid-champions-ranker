/* cSpell:disable */
import { JSDOM } from "jsdom";

import { AuthKey } from "./config.js";
import { convertToSlug, httpGet, StarsSectionEnum, countStars } from "./utils.js";

const fetch_owned_champions = async () => {
  return await httpGet({
    "hostname": "raidoptimiser.hellhades.com",
    "path": "/api/Account",
    "credentials": "include",
    "headers": {
      "Accept": "application/json",
      "Authorization": `Bearer ${AuthKey}`,
    }
  })
}

const get_champion_stars = async ({ heroName }) => {
  const regexp = /([★✰]+)/g

  const req = await httpGet({
    "hostname": "ayumilove.net",
    "path": `/raid-shadow-legends-${convertToSlug({ 'text': heroName })}-skill-mastery-equip-guide/`,
  })

  const { document } = (new JSDOM(req)).window

  const starsSectionText = document.querySelector('.entry-content > table:nth-child(2) > tbody:nth-child(1) > tr:nth-child(1) > td:nth-child(3)').textContent
  // console.log(starsSectionText.match(regexp));
  const grindingStars = countStars(starsSectionText.match(regexp)[StarsSectionEnum.Campaign - 1])
  const dungeonStars = countStars(starsSectionText.match(regexp)[StarsSectionEnum.MinotaursLabyrinth - 1])
  const arenaStars = countStars(starsSectionText.match(regexp)[StarsSectionEnum.ArenaOffense - 1])

  return {
    'campaign_stars': grindingStars,
    'dungeon_stars': dungeonStars,
    'arena_stars': arenaStars,
  }
}

const rank_champions = async ({ ownedHeroes, minCampaignStars = 0 }) => {
  const grade = { 'S': [], 'A': [], 'B': [], 'C': [], 'F': [] }

  const req = await httpGet({
    "hostname": "ayumilove.net",
    "path": '/raid-shadow-legends-list-of-champions-by-ranking/',
  })

  const { document } = (new JSDOM(req)).window;

  const heroes_links = document.querySelectorAll('div.entry-content > ul > li > a[href]')

  for (const elem of heroes_links) {
    const heroName = elem.textContent.split(' |')[0]

    if (ownedHeroes.includes(heroName)) {
      const rank = elem.parentNode.parentNode.previousSibling.textContent[0]
      const champion_stars = await get_champion_stars({ 'heroName': heroName })

      if (champion_stars.campaign_stars >= minCampaignStars) {
        grade[rank].push({ 'champion': heroName, ...champion_stars })
      }

    }
  }

  return grade
}

fetch_owned_champions()
  .then(e => JSON.parse(e)['heroTypes'])
  .then(heroes => heroes.map(hero => hero['name']['defaultValue']))
  .then(e => rank_champions({ 'ownedHeroes': e, 'minCampaignStars': 4 }))
  .then(e => {
    for (const key in e) {
      if (e[key].length) {
        console.log(`Rank ${key}`)
        console.table(e[key])
      }
    }
  })
  .catch(console.error)


/*

Old implementation, browser dependent:

In browser:

https://ayumilove.net/raid-shadow-legends-list-of-champions-by-ranking/

heroes = $$('div.entry-content > ul > li > a[href]')
heroesNames = heroes.map(hero => hero.textContent.split(' |')[0])
grade = {'S': [], 'A': [], 'B': [], 'C': [], 'F': []}
ownedHeroes = [
  'Kael',           'Satyr',          'Jotun',           'Jarang',
  'Warpriest',      'Graybeard',      'Rocktooth',       'Brute',
  'Spirithost',     'Militia',        'Jaeger',          'Hardscale',
  'Dhampir',        'Intercessor',    'Warboy',          'Cultist',
  'Redeemer',       'Ultimate Galek', 'Sister Militant', 'Heiress',
  'Commander',      'Oldbeard',       'Sergeant',        'Novitiate',
  'Pilgrim',        'Troglodyte',     'Archer',          'Sniper',
  'Knecht',         'Warmaiden',      'Incubus',         'Elfguard',
  'Heartpiercer',   'Outlaw Monk',    'Sorceress',       'Death Hound',
  'Saurus',         'Axeman',         'Skellag',         'Preacher',
  'Skinner',        'Judge',          'Ranger',          'Yeoman',
  'Kael',           'Satyr',          'Jotun',           'Jarang',
  'Warpriest',      'Graybeard',      'Rocktooth',       'Brute',
  'Spirithost',     'Militia',        'Jaeger',          'Hardscale',
  'Dhampir',        'Intercessor',    'Cultist',         'Redeemer',
  'Ultimate Galek', 'Heiress',        'Commander',       'Oldbeard',
  'Sergeant',       'Pilgrim',        'Archer',          'Sniper',
  'Warmaiden',      'Incubus',        'Elfguard',        'Heartpiercer',
  'Outlaw Monk',    'Sorceress',      'Saurus',          'Skellag',
  'Skinner',        'Judge'
]
heroes.forEach(hero => {
    heroName = hero.textContent.split(' |')[0]
  if (ownedHeroes.includes(heroName)) {
    grade[hero.parentNode.parentNode.previousSibling.textContent[0]].push(heroName)
  }
})
console.log(grade)
*/