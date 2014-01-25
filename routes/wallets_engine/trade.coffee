restify = require "restify"
Order = require "../../models/order"

module.exports = (app)->

  app.post "/publish_order/:order_id", (req, res, next)->
    orderId = req.params.order_id
    console.log orderId
    Order.findById orderId, (err, order)->
      return next(new restify.ConflictError err)  if err
      marketType = "#{order.action}_#{order.type}".toUpperCase()
      orderCurrency = order["#{order.action}_currency"]
      engineData =
        eventType: "order"
        eventUserId: order.user_id
        data:
          orderId: orderId
          orderType: marketType #BUY_MARKET, SELL_MARKET, BUY_LIMIT, SELL_LIMIT
          orderAmount: order.amount
          orderCurrency: orderCurrency
          orderLimitPrice: order.unit_price
      sendToEngine engineData, (engineError, response)->
        if not engineError
          Order.update {_id: orderId}, {published: true}, (err, result)->
            if not err
              res.send
                id:        orderId
                published: true
            else
              return next(new restify.ConflictError err)
        else
          return next(new restify.ConflictError "Engine error - #{engineError}")

  app.put "/complete_order/:order_id/:status", (req, res, next)->
    orderId = req.params.order_id
    status = req.params.status
    Order.findById orderId, (err, order)->
      Order.update {_id: orderId}, {status: status}, (err, result)->
        # TODO: Remove on hold wallet money and increase the other currency wallet balance?
        if not err
          res.send
            id:     orderId
            status: status
        else
          return next(new restify.ConflictError err)


  sendToEngine = (data, callback)->
    # TODO: send data to engine and get the response
    engineError = null
    response = {}
    callback engineError, response
