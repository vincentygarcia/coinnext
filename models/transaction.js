(function() {
  var MarketHelper;

  MarketHelper = require("../lib/market_helper");

  module.exports = function(sequelize, DataTypes) {
    var Transaction;
    Transaction = sequelize.define("Transaction", {
      user_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true
      },
      wallet_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true
      },
      currency: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        get: function() {
          return MarketHelper.getCurrencyLiteral(this.getDataValue("currency"));
        },
        set: function(currency) {
          return this.setDataValue("currency", MarketHelper.getCurrency(currency));
        }
      },
      account: {
        type: DataTypes.STRING(50)
      },
      fee: {
        type: DataTypes.BIGINT.UNSIGNED,
        get: function() {
          return MarketHelper.convertFromBigint(this.getDataValue("fee"));
        },
        set: function(fee) {
          return this.setDataValue("fee", MarketHelper.convertToBigint(fee));
        },
        comment: "FLOAT x 100000000"
      },
      address: {
        type: DataTypes.STRING(34),
        allowNull: false
      },
      amount: {
        type: DataTypes.BIGINT.UNSIGNED,
        defaultValue: 0,
        allowNull: false,
        get: function() {
          return MarketHelper.convertFromBigint(this.getDataValue("amount"));
        },
        set: function(amount) {
          return this.setDataValue("amount", MarketHelper.convertToBigint(amount));
        },
        comment: "FLOAT x 100000000"
      },
      category: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        comment: "send, receive",
        get: function() {
          return MarketHelper.getTransactionCategoryLiteral(this.getDataValue("category"));
        },
        set: function(category) {
          return this.setDataValue("category", MarketHelper.getTransactionCategory(category));
        }
      },
      txid: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: true
      },
      confirmations: {
        type: DataTypes.INTEGER.UNSIGNED,
        defaultValue: 0
      },
      balance_loaded: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      }
    }, {
      tableName: "transactions",
      classMethods: {
        findById: function(id, callback) {
          return Transaction.find(id).complete(callback);
        },
        addFromWallet: function(transactionData, currency, wallet, callback) {
          var data, details, key;
          if (callback == null) {
            callback = function() {};
          }
          details = transactionData.details[0] || {};
          data = {
            user_id: (wallet ? wallet.user_id : void 0),
            wallet_id: (wallet ? wallet.id : void 0),
            currency: currency,
            account: details.account,
            fee: details.fee,
            address: details.address,
            category: details.category,
            amount: transactionData.amount,
            txid: transactionData.txid,
            confirmations: transactionData.confirmations,
            created_at: new Date(transactionData.time * 1000)
          };
          for (key in data) {
            if (!data[key] && data[key] !== 0) {
              delete data[key];
            }
          }
          return Transaction.findOrCreate({
            txid: data.txid
          }, data).complete(function(err, transaction, created) {
            if (created) {
              return callback(err, transaction);
            }
            return transaction.updateAttributes(data).complete(callback);
          });
        },
        findPendingByUserAndWallet: function(userId, walletId, callback) {
          var query;
          query = {
            where: {
              user_id: userId,
              wallet_id: walletId,
              balance_loaded: false
            },
            order: [["created_at", "DESC"]]
          };
          return Transaction.findAll(query).complete(callback);
        },
        findProcessedByUserAndWallet: function(userId, walletId, callback) {
          var query;
          query = {
            where: {
              user_id: userId,
              wallet_id: walletId,
              balance_loaded: true
            },
            order: [["created_at", "DESC"]]
          };
          return Transaction.findAll(query).complete(callback);
        },
        findPendingByIds: function(ids, callback) {
          var query;
          if (ids.length === 0) {
            return callback(null, []);
          }
          query = {
            where: {
              txid: ids,
              balance_loaded: false
            },
            order: [["created_at", "DESC"]]
          };
          return Transaction.findAll(query).complete(callback);
        },
        findByTxid: function(txid, callback) {
          return Transaction.find({
            where: {
              txid: txid
            }
          }).complete(callback);
        },
        isValidFormat: function(category) {
          return !!MarketHelper.getTransactionCategory(category);
        },
        setUserById: function(txid, userId, callback) {
          return Transaction.update({
            user_id: userId
          }, {
            txid: txid
          }).complete(callback);
        },
        setUserAndWalletById: function(txId, userId, walletId, callback) {
          return Transaction.update({
            user_id: userId,
            wallet_id: walletId
          }, {
            txid: txId
          }).complete(callback);
        },
        markAsLoaded: function(id, mysqlTransaction, callback) {
          return Transaction.update({
            balance_loaded: true
          }, {
            id: id
          }, {
            transaction: mysqlTransaction
          }).complete(callback);
        }
      }
    });
    return Transaction;
  };

}).call(this);
