'use strict'
const test = require('ava')
// importamos el wrap que hemos hecho en index js para
// importar la calse de db
const Db = require('../')
const uuid = require('uuid-base62')
// const r = require('rethinkdb')
const r = require('rethinkdb')
const fixtures = require('./fixtures')
const utils = require('../lib/utils')

// test.before('setup database', async t => {
//   await db.connect()
//   t.true(db.connected, 'should be connected')
// })
//
// test.after('disconnect databese', async t => {
//   await db.disconnect()
//   t.false(db.connected, 'should be disconneted')
// })
//
// test.after.always('cleanup database', async t => {
//   let conn = await r.connect({})
//   await r.dbDrop(dbName).run(conn)
// })

test.beforeEach('setup database', async t => {
  const dbName = `platzigram_${uuid.v4()}`
  const db = new Db({ db: dbName })
  await db.connect()
  t.context.db = db
  t.context.dbName = dbName
  t.true(db.connected, 'should be connected')
})

test.afterEach.always('cleanup database', async t => {
  let db = t.context.db
  let dbName = t.context.dbName

  await db.disconnect()
  t.false(db.connected, 'should be disconnect')

  let conn = await r.connect({})
  await r.dbDrop(dbName).run(conn)
})

test('save image', async t => {
  let db = t.context.db

  t.is(typeof db.saveImage, 'function', 'save image is a function')

  let image = fixtures.getImage()

  let created = await db.saveImage(image)
  t.is(created.description, image.description)
  t.is(created.url, image.url)
  t.is(created.likes, image.likes)
  t.is(created.liked, image.liked)
  t.deepEqual(created.tags, [ 'awesome', 'tags', 'platzi' ])
  t.is(created.userId, image.userId)
  t.is(typeof created.id, 'string')
  t.is(created.publicId, uuid.encode(created.id))
  t.truthy(created.createdAt)
})

test('like image', async t => {
  let db = t.context.db

  t.is(typeof db.likeImage, 'function', 'like Images is a function')

  let image = fixtures.getImage()
  let created = await db.saveImage(image)
  let result = await db.likeImage(created.publicId)

  t.true(result.liked)
  t.is(result.likes, image.likes + 1)
})

test('Get Image', async t => {
  let db = t.context.db

  t.is(typeof db.getImage, 'function', 'getImage is a function')

  let image = fixtures.getImage()
  let created = await db.saveImage(image)
  let result = await db.getImage(created.publicId)

  t.deepEqual(created, result)

  t.throws(db.getImage('foo'), /not found/)
})

test('list all images', async t => {
  let db = t.context.db

  let images = fixtures.getImages(5)
  // con la siguiente sentencia nos vamos a crear un array de promesas que posteriormente
  // las resolvemos todas mediante promise.all
  let saveImages = images.map(img => db.saveImage(img))
  let created = await Promise.all(saveImages)
  let result = await db.getImages()

  t.is(created.lenght, result.lenght)
})

test('encrypt password', t => {
  let password = 'foo123'
  let encrypted = '02b353bf5358995bc7d193ed1ce9c2eaec2b694b21d2f96232c9d6a0832121d1'

  let result = utils.encrypt(password)
  t.is(result, encrypted)
})

test('get user', async t => {
  let db = t.context.db

  t.is(typeof db.getUser, 'function', 'getUser is a function')

  let user = fixtures.getUser()
  let created = await db.saveUser(user)
  let result = await db.getUser(user.username)

  t.deepEqual(created, result)

  t.throws(db.getUser('foo'), /not found/)
})

test('authenticate user', async t => {
  let db = t.context.db
  t.is(typeof db.authenticate, 'function', 'authenticate is a function')

  let user = fixtures.getUser()
  let plainPassword = user.password
  await db.saveUser(user)

  let success = await db.authenticate(user.username, plainPassword)
  t.true(success)

  let fail = await db.authenticate(user.username, 'fooo')
  t.false(fail)

  let failure = await db.authenticate('foo', 'bar')
  t.false(failure)
})

test('list images by tag', async t => {
  let db = t.context.db
  t.is(typeof db.getImagesByTag, 'function', 'get ImagesBytag is a function')

  let images = fixtures.getImages(10)
  let tag = '#filterit'
  let random = Math.round(Math.random() * images.length)

  let saveImages = []
  for (let i = 0; i < images.length; i++) {
    if (i < random) {
      images[i].description = tag
    }

    saveImages.push(db.saveImage(images[i]))
  }

  await Promise.all(saveImages)

  let result = await db.getImagesByTag(tag)
  t.is(result.length, random)
})

test('list images by users', async t => {
  let db = t.context.db

  t.is(typeof db.getImagesByUser, 'function', 'get ImagesByUser is a function')

  let images = fixtures.getImages(1000)
  let userId = uuid.uuid()
  let random = Math.round(Math.random() * images.length)
  console.log(`random vale ${random}`)
  let saveImages = []
  console.log(`images.lenght ${images.length}`)
  for (let i = 0; i < images.length; i++) {
    if (i < random) {
      images[i].userId = userId
    }
    console.log(`images ${i}  es: ${images[i]}`)
    saveImages.push(db.saveImage(images[i]))
  }

  await Promise.all(saveImages)

  let result = await db.getImagesByUser(userId)
  t.is(result.length, random)
})
