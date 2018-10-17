const rp = require('request-promise')
const cheerio = require('cheerio')

const pageSize = 50
const baseURL = 'https://wikisol62.pasdecalais.fr'

const startPageURL = baseURL + '/jcms/j_6/accueil?text=CCAS&opSearch=true&types=com.jalios.jcms.Content&typesOff=generated.Article&typesOff=generated.SmallNews&typesOff=com.jalios.jcms.FileDocument&typesOff=generated.Location&typesOff=generated.CalendarEvent&typesOff=generated.Faq&typesOff=generated.Glossary&typesOff=generated.Interview&typesOff=generated.EventResource&typesOff=generated.MeetingRoom&typesOff=generated.WebPage&textSearch=true&jsp=front%2Fquery%2Fquery.jsp'
  + '&start=0'
  + '&pageSize=' + pageSize
  + '&pagerAll=false&sort=relevance&reverse=false'

function loadAllPages(pageURL, pages = []) {
  return new Promise((resolve, reject) => {
    rp({
      uri: pageURL,
      json: false
    })
      .then(html => {

        const $ = cheerio.load(html)
        const nextPageEl = $('.pagination li.pgNext > a')

        let hasNext = nextPageEl.length > 0 ? true : false

        const page = {
          html,
          hasNext,
          nextPageURL: baseURL + '/' + nextPageEl.attr('href')
        }

        resolve(page)
      })
      .catch(e => reject(e))
  })
  .then(page => {

    pages.push(page)

    return page.hasNext ? loadAllPages(page.nextPageURL, pages) : Promise.resolve(pages)
  })
}

function processAddress(streetAddress, locality) {

  const matches = locality.match(/([0-9]+) (.+)/)

  const codePostal = matches[1]
  const commune = matches[2]

  return {
    codePostal,
    commune,
    lignes: [ streetAddress ],
    type: 'physique'
  }
}

function processOpeningHours(text) {

  const patterns = [
    // Le lundi de 9 h à 12 h et de 13 h 30 à 17 h 30
    /le (?<fromDay>\w+) de (?<opensAM>[0-9Hh ]+) à (?<closesAM>[0-9Hh ]+)/gi,
    // Le lundi de 9 h à 12 h et de 13 h 30 à 17 h 30
    /le (?<fromDay>\w+) de (?<opensAM>[0-9Hh ]+) à (?<closesAM>[0-9Hh ]+) et de (?<opensPM>[0-9Hh ]+) à (?<closesPM>[0-9Hh ]+)/gi,
    // Du lundi au jeudi de 8h30 à 12h et de 13h30 à 17h30
    /du (?<fromDay>\w+) au (?<toDay>\w+) de (?<opensAM>[0-9Hh ]+) à (?<closesAM>[0-9Hh ]+) et de (?<opensPM>[0-9Hh ]+) à (?<closesPM>[0-9Hh ]+)/gi,
  ]

  const horaires = []

  patterns.forEach(pattern => {

    var matches = pattern.exec(text)

    if (matches) {

      let {
        fromDay,
        toDay,
        opensAM,
        closesAM,
        opensPM,
        closesPM,
      } = matches.groups

      let heures = []

      let horaire = {
        de: fromDay,
        a: toDay ? toDay : fromDay
      }

      if (opensAM && closesAM) {
        heures.push({
          de: opensAM,
          a: closesAM,
        })
      }

      if (opensPM && closesPM) {
        heures.push({
          de: opensPM,
          a: closesPM,
        })
      }

      horaire = {
        ...horaire,
        heures: heures
      }

      horaires.push(horaire)
    }

  })

  return horaires
}

process.stdout.write(`Loading pages…\n`)

loadAllPages(startPageURL)
  .then(pages => {

    process.stdout.write(`\t✓ ${pages.length} pages loaded!\n`)

    const itemURLs = []
    pages.forEach(page => {
      const $ = cheerio.load(page.html)
      $('.app-cards-horizontal-wrapper .card .card-title > a').each((i, el) => {
        itemURLs.push($(el).attr('href'))
      })
    })

    return itemURLs
  })
  .then(itemURLs => {
    itemURLs.forEach(itemURL => {
      rp({
        uri: `${baseURL}/${itemURL}`,
        json: false
      })
      .then(html => {

        const $ = cheerio.load(html)

        const titreficheStructureEl = $('.titreficheStructure')

        if (titreficheStructureEl.length === 0) {
          return
        }

        const name = $(titreficheStructureEl).find('.publication-title').text().trim()
        const streetAddress = $('.rueAdressePhysique .field-data').text().trim()
        const locality = $('.communeAdressePostale .field-data').text().trim()
        const telephone = $('.telephoneStructure .field-data').text().trim()
        const openingHours = $('.horairesAccueilPhysiqueDuPublic .field-data').text().trim()

        // console.log({
        //   name,
        //   streetAddress,
        //   locality,
        //   telephone,
        //   openingHours,
        //   addresses: [ processAddress(streetAddress, locality) ],
        //   horaires: processOpeningHours(openingHours),
        // })

        console.log(openingHours)
        console.log(JSON.stringify(processOpeningHours(openingHours)))

        console.log('---')
        console.log('')

      })
    })
  })
