(function() {
  var JsonRenderer, User;

  User = require("../models/user");

  JsonRenderer = require("../lib/json_renderer");

  module.exports = function(app) {
    app.get("/signup", function(req, res) {
      return res.render("auth/signup");
    });
    app.get("/login", function(req, res) {
      return res.render("auth/login");
    });
    app.get("/send-password", function(req, res) {
      var errors, success;
      if (req.query.error) {
        errors = [req.query.error];
      }
      success = req.query.success;
      return res.render("auth/send_password", {
        title: "Send Password - Coinnext.com",
        errors: errors,
        success: success
      });
    });
    app.post("/send-password", function(req, res) {
      var email;
      email = req.body.email;
      if (email) {
        return User.findOne({
          email: email
        }).exec(function(err, user) {
          if (user) {
            return user.generateToken(function() {
              return user.sendPasswordLink(function() {
                res.writeHead(303, {
                  "Location": "/send-password?success=true"
                });
                return res.end();
              });
            });
          } else {
            res.writeHead(303, {
              "Location": "/send-password?error=wrong-user"
            });
            return res.end();
          }
        });
      } else {
        res.writeHead(303, {
          "Location": "/send-password"
        });
        return res.end();
      }
    });
    app.get("/change-password/:token", function(req, res) {
      var errors, token;
      token = req.params.token;
      if (req.query.error) {
        errors = [req.query.error];
      }
      return res.render("auth/change_password", {
        title: "Change Password - Coinnext.com",
        token: token,
        errors: errors
      });
    });
    app.post("/change-password", function(req, res) {
      var password, token;
      token = req.body.token;
      password = req.body.password;
      return User.findByToken(token, function(err, user) {
        if (user) {
          user.password = User.hashPassword(password);
          return user.save(function(err, u) {
            if (err) {
              console.error(err);
            }
            res.writeHead(303, {
              "Location": "/login"
            });
            return res.end();
          });
        } else {
          res.writeHead(303, {
            "Location": "/change-password/" + token + "?error=wrong-token"
          });
          return res.end();
        }
      });
    });
    return app.post("/set-new-password", function(req, res) {
      var newPassword, password;
      password = req.body.password;
      newPassword = req.body.new_password;
      if (req.user) {
        if (User.hashPassword(password) !== req.user.password) {
          return JsonRenderer.error("The old password is incorrect.", res);
        }
        req.user.password = User.hashPassword(newPassword);
        return req.user.save(function(err, u) {
          if (err) {
            console.error(err);
          }
          return res.json({
            message: "The password was successfully changed."
          });
        });
      } else {
        return JsonRenderer.error("Please auth.", res);
      }
    });
  };

}).call(this);
