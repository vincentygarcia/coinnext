(function() {
  var AuthStats, JsonRenderer, User, Wallet;

  User = GLOBAL.db.User;

  Wallet = GLOBAL.db.Wallet;

  AuthStats = GLOBAL.db.AuthStats;

  JsonRenderer = require('../lib/json_renderer');

  module.exports = function(app) {
    var login;
    app.post("/user", function(req, res) {
      var data;
      data = {
        email: req.body.email,
        password: req.body.password
      };
      return User.createNewUser(data, function(err, newUser) {
        if (err) {
          return JsonRenderer.error(err, res);
        }
        newUser.generateToken(function() {
          newUser.sendEmailVerificationLink();
          return Wallet.findOrCreateUserWalletByCurrency(newUser.id, "BTC");
        });
        return res.json(JsonRenderer.user(newUser));
      });
    });
    app.post("/login", function(req, res, next) {
      return login(req, res, next);
    });
    app.put("/login", function(req, res, next) {
      return login(req, res, next);
    });
    app.get("/user/:id?", function(req, res) {
      if (!req.user) {
        return JsonRenderer.error(null, res);
      }
      return res.json(JsonRenderer.user(req.user));
    });
    app.get("/logout", function(req, res) {
      req.logout();
      if (req.accepts("html")) {
        return res.redirect("/");
      }
      return res.json({});
    });
    app.get("/generate_gauth", function(req, res) {
      if (!req.user) {
        return JsonRenderer.error(null, res);
      }
      return req.user.generateGAuthData(function() {
        return res.json(JsonRenderer.user(req.user));
      });
    });
    return login = function(req, res, next) {
      return passport.authenticate("local", function(err, user, info) {
        if (err) {
          return JsonRenderer.error(err, res, 401);
        }
        if (!user) {
          return JsonRenderer.error("Invalid credentials", res, 401);
        }
        return req.logIn(user, function(err) {
          if (err) {
            return JsonRenderer.error("Invalid credentials", res, 401);
          }
          if (user.gauth_data && !user.isValidGAuthPass(req.body.gauth_pass)) {
            req.logout();
            return JsonRenderer.error("Invalid Google Authenticator code", res, 401);
          }
          res.json(JsonRenderer.user(req.user));
          return AuthStats.log({
            ip: req.ip,
            user: req.user
          });
        });
      })(req, res, next);
    };
  };

}).call(this);
