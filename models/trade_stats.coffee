MarketHelper = require "../lib/market_helper"

module.exports = (sequelize, DataTypes) ->

  TradeStats = sequelize.define "TradeStats",
      type:
        type: DataTypes.INTEGER.UNSIGNED
        allowNull: false
        get: ()->
          MarketHelper.getMarketLiteral @getDataValue("type")
        set: (type)->
          @setDataValue "type", MarketHelper.getMarket(type)
      open_price:
        type: DataTypes.FLOAT.UNSIGNED
        defaultValue: 0
        allowNull: false
      close_price:
        type: DataTypes.FLOAT.UNSIGNED
        defaultValue: 0
        allowNull: false
      high_price:
        type: DataTypes.FLOAT.UNSIGNED
        defaultValue: 0
        allowNull: false
      low_price:
        type: DataTypes.FLOAT.UNSIGNED
        defaultValue: 0
        allowNull: false
      volume:
        type: DataTypes.FLOAT.UNSIGNED
        defaultValue: 0
        allowNull: false
      start_time:
        type: DataTypes.DATE
      end_time:
        type: DataTypes.DATE
    ,
      tableName: "trade_stats"
      classMethods:
        
        getLastStats: (type, callback = ()->)->
          type = MarketHelper.getMarket type
          halfHour = 1800000
          aDayAgo = Date.now() - 86400000 - halfHour
          query =
            where:
              type: type
              start_time:
                gt: aDayAgo
            order: [
              ["start_time", "ASC"]
            ]
          TradeStats.findAll(query).complete callback
         
  TradeStats