'use strict'

import {readFileSync} from 'fs'
import {request} from 'graphql-request'

const GRAPHQL_ENDPOINT = 'https://api.thegraph.com/subgraphs/name/float-capital/dev-graph-two'
const SECS_IN_A_YEAR = 31557600
const BASIS_POINTS = 1000000000000000000 // 1e18

export class FundingVsPrice {
  async getPricesAndMultiplier(longSideIsUnderfunded, lastUpdateIndex) {
    const longOrShort = longSideIsUnderfunded ? 'short' : 'long'

    // get query
    const pricesAndMultiplier = readFileSync('./pricesUsingIdAndMultiplierUsingIndex.gql', 'utf8')

    // used as filter for prices query
    // order of update indexes matters; should be descending from lastest update index to earliest
    const marketIds = []

    // for each system state update
    for (let i = 0; i < this.numberSystemStateUpdates; i++) {
      const index = lastUpdateIndex - i
      marketIds.push(`${this.marketIndexAsString}-${longOrShort}-${index}`)
    }
    console.log('marketIds', marketIds, '\n')

    const variables = {
      marketIds,
      marketIndexAsString: this.marketIndexAsString
    }
    console.log('graphql request...\n')
    // get the token price for the systemStates and funding rate multiplier using market index
    const result = await request(GRAPHQL_ENDPOINT, pricesAndMultiplier, variables)

    return result
  }

  calcFundingAmountForOneToken(pricesAndMultiplier) {
    const {prices, syntheticMarkets} = pricesAndMultiplier

    let totalTimestampDiffInSecs = 0
    let totalAmountForAllFundingPeriods = 0

    // funding period = period between two consecutive price updates (system states)
    const numberOfFundingPeriods = prices.length - 1

    console.log('calcFundingAmountForOneToken\n')
    for (let i = 0; i < numberOfFundingPeriods; i++) {
      const {id, price, timeUpdated} = prices[i]

      console.log('i', i)
      console.log('id', id)
      console.log('price', price)

      const fundingRateMultiplier_e18 = syntheticMarkets[0].fundingRateMultiplier_e18
      const multiplier = fundingRateMultiplier_e18 / BASIS_POINTS
      console.log('multiplier', multiplier)

      const endingTimestamp = timeUpdated
      const nextTimestamp = prices[i+1].timeUpdated
      const startingTimestamp = nextTimestamp
      const timestampDiffInSecs = endingTimestamp - startingTimestamp
      totalTimestampDiffInSecs += timestampDiffInSecs
      console.log('timestampDiffInSecs', timestampDiffInSecs)

      const timestampDiffInMins = Math.floor(timestampDiffInSecs / 60)
      const secondsRemaining = timestampDiffInSecs % 60
      console.log('funding period length', timestampDiffInMins, 'mins', secondsRemaining, 'secs',)

      const dividend = (price * multiplier * timestampDiffInSecs)

      const fundingAmount = (dividend / SECS_IN_A_YEAR) / BASIS_POINTS
      console.log('fundingAmount', fundingAmount)

      totalAmountForAllFundingPeriods += fundingAmount

      console.log((i === numberOfFundingPeriods - 1) ? '' : '---')
    }

    const totalTimestampDiffInMins = Math.floor(totalTimestampDiffInSecs / 60)
    const totalSecondsRemaining = totalTimestampDiffInSecs % 60
    console.log('total funding period length', totalTimestampDiffInMins, 'mins', totalSecondsRemaining, 'secs',)
    console.log('totalAmountForAllFundingPeriods', totalAmountForAllFundingPeriods)
    console.log('^^^\n')

    return totalAmountForAllFundingPeriods
  }

  calcTokenProfitOrLoss(prices) {
    let totalTokenProfitOrLossForAllFundingPeriods = 0

    // funding period = period between two consecutive prices
    const numberOfFundingPeriods = prices.length - 1

    console.log('calcTokenProfitOrLoss\n')
    for (let i = 0; i < numberOfFundingPeriods; i++) {
      console.log('i', i)

      // get data from current price
      const {id, price} = prices[i]

      console.log('currentId', id)
      const currentPrice = price / BASIS_POINTS
      console.log('currentPrice', currentPrice)

      // get data from previous price
      const previousPriceResult = prices[i+1]

      console.log('previousId', previousPriceResult.id)
      const previousPrice = previousPriceResult.price / BASIS_POINTS
      console.log('previousPrice', previousPrice)

      const tokenPriceDiff = currentPrice - previousPrice
      console.log('tokenPriceDiff', tokenPriceDiff)

      totalTokenProfitOrLossForAllFundingPeriods += tokenPriceDiff

      console.log((i === numberOfFundingPeriods - 1) ? '' : '---')
    }

    console.log('totalTokenProfitOrLossForAllFundingPeriods', totalTokenProfitOrLossForAllFundingPeriods)
    console.log('^^^\n')

    return totalTokenProfitOrLossForAllFundingPeriods
  }

  async main(longSideIsUnderfunded, lastUpdateIndex) {
    try {
      let overSideWasNetProfitable

      // get "over" token prices and funding rate multiplier from the graph
      const pricesAndMultiplier = await this.getPricesAndMultiplier(longSideIsUnderfunded, lastUpdateIndex)

      // if the number of price results is equal to the number of system state updates
      if (pricesAndMultiplier.prices.length === this.numberSystemStateUpdates) {
        // calc the funding amounts for the funding periods (system states)
        const totalAmountForAllFundingPeriods = this.calcFundingAmountForOneToken(pricesAndMultiplier)

        // calc the "over" token profit or loss for the systemStates
        const totalTokenProfitOrLossForAllFundingPeriods = this.calcTokenProfitOrLoss(pricesAndMultiplier.prices)

        // comparison logic
        overSideWasNetProfitable = (totalTokenProfitOrLossForAllFundingPeriods > totalAmountForAllFundingPeriods)
      } else {
        console.log('** NOT ENOUGH PRICE DATA **\n')
        overSideWasNetProfitable = false
      }

      return overSideWasNetProfitable
    } catch (error) {
      console.error(error)
    }
  }
}