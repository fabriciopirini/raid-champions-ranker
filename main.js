/* cSpell:disable */
import { JSDOM } from "jsdom";

import { AuthKey, minStars, filterBy } from "./config.js";
import { convertToSlug, httpGet, GameMode, countStars } from "./utils.js";

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
  const grindingStars = countStars(starsSectionText.match(regexp)[GameMode.Campaign - 1])
  const dungeonStars = countStars(starsSectionText.match(regexp)[GameMode.MinotaursLabyrinth - 1])
  const arenaOffenseStars = countStars(starsSectionText.match(regexp)[GameMode.ArenaOffense - 1])
  const clanBossStars = countStars(starsSectionText.match(regexp)[GameMode.ClanBoss - 1])

  return {
    'campaign_stars': grindingStars,
    'dungeon_stars': dungeonStars,
    'arena_offense_stars': arenaOffenseStars,
    'clan_boss_stars': clanBossStars,
  }
}

const rank_champions = async ({ ownedHeroes, minStars = 0, filterBy = 'campaign_stars' }) => {
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

      if (champion_stars[filterBy] >= minStars) {
        grade[rank].push({ 'champion': heroName, ...champion_stars })
      }

    }
  }

  return grade
}

fetch_owned_champions()
  .then(resp => JSON.parse(resp)['heroTypes'])
  .then(heroes => heroes.map(hero => hero['name']['defaultValue']))
  .then(heroNames => rank_champions({ 'ownedHeroes': heroNames, 'minStars': minStars, 'filterBy': filterBy }))
  .then(rankedHeroes => {
    for (const key in rankedHeroes) {
      if (rankedHeroes[key].length) {
        console.log(`Rank ${key}`)
        console.table(rankedHeroes[key])
      }
    }
  })
  .catch(console.error)
