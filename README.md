# Float Capital Strategy

### Funding Rate VS Token Price

`npm install`
`npm test FundingVsPrice.test.js`

A way of determining if a long or short token from the https://float.capital protocol is profitable across a given number of system state updates for a given market. This strategy is used by a [bot](https://prevail.gitbook.io/float-capital-bot) written for the protocol.

Example: For the 3TH market, was the short token profitable for the last three system state updates?