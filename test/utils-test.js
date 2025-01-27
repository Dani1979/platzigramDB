'use strict'

const test = require('ava')

const utils = require('../lib/utils')

test('Extracting hashtags from text', t => {
  let tags = utils.extractTags('a #picture with tagas #AwEsOmE #Platzi #AVA and #100 ##yes')
  t.deepEqual(tags, [
    'picture',
    'awesome',
    'platzi',
    'ava',
    '100',
    'yes'
  ])

  tags = utils.extractTags('a picturo with no tags')
  t.deepEqual(tags, [])

  tags = utils.extractTags()
  t.deepEqual(tags, [])

  tags = utils.extractTags(null)
  t.deepEqual(tags, [])
})
