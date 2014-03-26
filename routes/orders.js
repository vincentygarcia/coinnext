(function() {
  var JsonRenderer, MarketHelper, MarketStats, Order, Wallet;

  Order = GLOBAL.db.Order;

  Wallet = GLOBAL.db.Wallet;

  MarketStats = GLOBAL.db.MarketStats;

  MarketHelper = require("../lib/market_helper");

  JsonRenderer = require("../lib/json_renderer");

  module.exports = function(app) {
    var notValidOrderData;
    app.post("/orders", function(req, res) {
      var data, holdBalance, validationError;
      if (!req.user) {
        return JsonRenderer.error("You need to be logged in to place an order.", res);
      }
      if (!req.user.canTrade()) {
        return JsonRenderer.error("Sorry, but you can not trade. Did you verify your account?", res);
      }
      data = req.body;
      data.user_id = req.user.id;
      if (validationError = notValidOrderData(data)) {
        return JsonRenderer.error(validationError, res);
      }
      if (data.type === "limit" && data.action === "buy") {
        holdBalance = parseFloat(data.amount * data.unit_price);
      }
      return Wallet.findOrCreateUserWalletByCurrency(req.user.id, data.buy_currency, function(err, buyWallet) {
        if (err || !buyWallet) {
          return JsonRenderer.error("Wallet " + data.buy_currency + " does not exist.", res);
        }
        return Wallet.findOrCreateUserWalletByCurrency(req.user.id, data.sell_currency, function(err, wallet) {
          if (err || !wallet) {
            return JsonRenderer.error("Wallet " + data.sell_currency + " does not exist.", res);
          }
          return GLOBAL.db.sequelize.transaction(function(transaction) {
            return wallet.holdBalance(holdBalance, transaction, function(err, wallet) {
              if (err || !wallet) {
                return transaction.rollback().success(function() {
                  return JsonRenderer.error("Not enough " + data.sell_currency + " to open an order.", res);
                });
              }
              return Order.create(data, {
                transaction: transaction
              }).complete(function(err, newOrder) {
                if (err) {
                  return transaction.rollback().success(function() {
                    return JsonRenderer.error("Sorry, could not open an order...", res);
                  });
                }
                transaction.commit().success(function() {
                  return newOrder.publish(function(err, order) {
                    if (err) {
                      console.log("Could not publish newlly created order - " + err);
                    }
                    if (err) {
                      return res.json(JsonRenderer.order(newOrder));
                    }
                    return res.json(JsonRenderer.order(order));
                  });
                });
                return transaction.done(function(err) {
                  if (err) {
                    return JsonRenderer.error("Could not open an order. Please try again later.", res);
                  }
                });
              });
            });
          });
        });
      });
    });
    app.get("/orders", function(req, res) {
      return Order.findByOptions(req.query, function(err, orders) {
        if (err) {
          return JsonRenderer.error("Sorry, could not get open orders...", res);
        }
        return res.json(JsonRenderer.orders(orders));
      });
    });
    app.del("/orders/:id", function(req, res) {
      if (!req.user) {
        return JsonRenderer.error("You need to be logged in to delete an order.", res);
      }
      return Order.findByUserAndId(req.params.id, req.user.id, function(err, order) {
        if (err || !order) {
          return JsonRenderer.error("Sorry, could not delete orders...", res);
        }
        return order.cancel(function(err) {
          if (err) {
            console.log("Could not cancel order - " + err);
          }
          if (err) {
            return res.json(JsonRenderer.order(order));
          }
          return res.json({});
        });
      });
    });
    return notValidOrderData = function(orderData) {
      if (!Order.isValidTradeAmount(orderData.amount)) {
        return "Please submit a valid amount bigger than 0.";
      }
      if (orderData.type === "limit" && !Order.isValidTradeAmount(parseFloat(orderData.unit_price))) {
        return "Please submit a valid unit price amount.";
      }
      if (!MarketHelper.getOrderAction(orderData.action)) {
        return "Please submit a valid action.";
      }
      if (!MarketHelper.isValidCurrency(orderData.buy_currency)) {
        return "Please submit a valid buy currency.";
      }
      if (!MarketHelper.isValidCurrency(orderData.sell_currency)) {
        return "Please submit a valid sell currency.";
      }
      if (orderData.buy_currency === orderData.sell_currency) {
        return "Please submit different currencies.";
      }
      if (!MarketHelper.isValidMarket(orderData.action, orderData.buy_currency, orderData.sell_currency)) {
        return "Invalid market.";
      }
      return false;
    };
  };

}).call(this);
