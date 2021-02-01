var router = require('express').Router();
// var indexRouter = require("../routes/index");

router.use("/api/registeration", require("./routes/registeration"));
router.use("/api/customer", require("./routes/customer"));
router.use("/api/winchDriver", require("./routes/winchDriver"));

module.exports = router;