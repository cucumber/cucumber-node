import assert from 'node:assert'
import { Given, When, Then } from '@cucumber/node'

Given('the customer has {int} cents', (t, money) => {
  t.world.money = money
})

Given('there are chocolate bars in stock', t => {
  t.world.stock = ['Mars']
})

Given('there are no chocolate bars in stock', t => {
  t.world.stock = []
})

When('the customer tries to buy a {int} cent chocolate bar', (t, price) => {
  if(t.world.money >= price) {
    t.world.chocolate = t.world.stock.pop()
  }
})

Then('the sale should not happen', t => {
  assert.strictEqual(t.world.chocolate, undefined)
})

Then('the sale should happen', t => {
  assert.ok(t.world.chocolate)
})
