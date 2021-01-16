var router = require('express').Router();
// var indexRouter = require("../routes/index");

router.use("/api/registeration", require("./routes/registeration"));
router.use("/api/customer", require("./routes/customer"));

module.exports = router;