(function() {
  var restify;

  restify = require("restify");

  module.exports = function(app) {
    return app.put("/complete_order/:order_id", function(req, res, next) {
      var orderId;
      orderId = req.params.order_id;
      return res.send({
        id: orderId,
        status: "complete"
      });
    });
  };

}).call(this);
