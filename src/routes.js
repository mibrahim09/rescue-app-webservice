var router = require('express').Router();
// var indexRouter = require("../routes/index");

router.use("/api/registeration", require("./routes/registeration"));

module.exports = router;