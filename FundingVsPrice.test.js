'use strict'

import {assert, expect} from 'chai'
import {FundingVsPrice} from './FundingVsPrice.js'

describe('FundingVsPrice', () => {
  const fundingVsPrice = new FundingVsPrice()

  // TEST VALUES

  // 3TH market
  fundingVsPrice.marketIndexAsString = '2'

  // number of system state updates to use
  fundingVsPrice.numberSystemStateUpdates = 3

  // whether or not the long side of the market is underfunded
  const longSideIsUnderfunded = true

  // get the latestUpdateIndex by putting the market index into the marketUpdateIndex (#22) function at
  // https://polygonscan.com/address/0x168a5d1217AEcd258b03018d5bF1A1677A07b733#readProxyContract
  const lastUpdateIndex = 88587

  // TEST VALUES

  // let pricesAndMultiplier

  // it('getPricesAndMultiplier', async () => {
  //   pricesAndMultiplier = await fundingVsPrice.getPricesAndMultiplier(longSideIsUnderfunded, lastUpdateIndex)
  //   console.log('pricesAndMultiplier', pricesAndMultiplier)
  //   expect(pricesAndMultiplier).to.have.all.keys('prices', 'syntheticMarkets')
  //   console.log('pricesAndMultiplier.prices.length', pricesAndMultiplier.prices.length)
  //   assert(pricesAndMultiplier.prices.length === fundingVsPrice.numberSystemStateUpdates, 'pricesAndMultiplier.prices.length === fundingVsPrice.numberSystemStateUpdates')
  // })

  // it('calcFundingAmountForOneToken', () => {
  //   const totalAmountForAllFundingPeriods = fundingVsPrice.calcFundingAmountForOneToken(pricesAndMultiplier)
  //   expect(totalAmountForAllFundingPeriods).to.be.a('number')
  // })

  // it('calcTokenProfitOrLoss', () => {
  //   const totalTokenProfitOrLossForAllFundingPeriods = fundingVsPrice.calcTokenProfitOrLoss(pricesAndMultiplier.prices)
  //   expect(totalTokenProfitOrLossForAllFundingPeriods).to.be.a('number')
  // })

  it('main', async () => {
    const overSideWasNetProfitable = await fundingVsPrice.main(longSideIsUnderfunded, lastUpdateIndex)
    console.log('overSideWasNetProfitable', overSideWasNetProfitable)
    expect(overSideWasNetProfitable).to.be.a('boolean')
  })
})