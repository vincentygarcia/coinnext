environment = process.env.NODE_ENV or 'development'
GLOBAL.appConfig = require "./configs/config"
GLOBAL.db = require './models/index'

option "-e", "--email [EMAIL]", "User email"
option "-p", "--pass [PASS]", "User pass"
option "-w", "--wallet [ID]", "Wallet ID"
option "-u", "--user [ID]", "User ID"

task "db:create_tables", "Create all tables", ()->
  GLOBAL.db.sequelize.sync().complete ()->

task "db:create_tables_force", "Drop and create all tables", ()->
  return console.log "Not in production!"  if environment is "production"
  GLOBAL.db.sequelize.query("DROP TABLE SequelizeMeta").complete ()->
    GLOBAL.db.sequelize.sync({force: true}).complete ()->

task "db:seed_market_stats", "Seed default market stats", ()->
  MarketStats = GLOBAL.db.MarketStats
  marketStats = require './models/seeds/market_stats'
  for stats in marketStats
    MarketStats.create(stats).complete ()->

task "db:seed_trade_stats", "Seed default trade stats", ()->
  return console.log "Not in production!"  if environment is "production"
  TradeStats = GLOBAL.db.TradeStats
  tradeStats = require './models/seeds/trade_stats'
  now = Date.now()
  halfHour = 1800000
  oneDay = 86400000
  endTime =  now - now % halfHour
  startTime = endTime - oneDay
  startTimes =
    LTC_BTC: startTime
    PPC_BTC: startTime
    DOGE_BTC: startTime
  for stat in tradeStats
    stat.start_time = startTimes[stat.type]
    stat.end_time = stat.start_time + halfHour
    startTimes[stat.type] = stat.end_time
  GLOBAL.db.sequelize.query("TRUNCATE TABLE #{TradeStats.tableName}").complete ()->
    TradeStats.bulkCreate(tradeStats).success ()->
      TradeStats.findAll().success (result)->
        console.log JSON.stringify result

task "db:migrate", "Run pending database migrations", ()->
  migrator = GLOBAL.db.sequelize.getMigrator
    path:        "#{process.cwd()}/models/migrations"
    filesFilter: /\.coffee$/
    coffee: true
  migrator.migrate().success ()->
    console.log "Database migrations finished."

task "db:migrate_undo", "Undo database migrations", ()->
  migrator = GLOBAL.db.sequelize.getMigrator
    path:        "#{process.cwd()}/models/migrations"
    filesFilter: /\.coffee$/
    coffee: true
  migrator.migrate({method: "down"}).success ()->
    console.log "Database migrations reverted."

task "admin:generate_user", "Add new admin user -e -p", (opts)->
  data =
    email: opts.email
    password: opts.pass
  GLOBAL.db.AdminUser.createNewUser data, (err, newUser)->
    return console.error err  if err
    newUser.generateGAuthData (data, newUser)->
      console.log data.google_auth_qr
      console.log newUser.gauth_key

task "fraud:check_wallet", "Check wallet for fraud", (opts)->
  FraudHelper = require "./lib/fraud_helper"
  FraudHelper.checkWalletBalance opts.wallet, (err, result)->
    return console.error err  if err
    console.log result

task "fraud:check_user_wallets", "Check user wallets for fraud", (opts)->
  FraudHelper = require "./lib/fraud_helper"
  async = require "async"
  checkWalletBalance = (wallet, cb)->
    FraudHelper.checkWalletBalance wallet.id, (err, result)->
      return console.error err  if err
      cb err,
        wallet_id: wallet.id
        result: result
  GLOBAL.db.Wallet.findAll({where: {user_id: opts.user}}).complete (err, wallets)->
    async.mapSeries wallets, checkWalletBalance, (err, results)->
      console.log results
