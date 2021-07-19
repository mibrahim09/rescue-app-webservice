var router = require('express').Router();
// var indexRouter = require("../routes/index");

router.use("/api/registeration", require("./routes/registeration"));
router.use("/api/customer", require("./routes/customer"));
router.use("/api/winchDriver", require("./routes/winchDriver"));
router.use("/api/mechanic", require("./routes/mechanic"));
router.use("/api/mechanicCenter", require("./routes/mechanicCenter"));

router.use("/api/info", require("./routes/info"));

router.use("/api/requestwinch", require("./routes/request.winch"));
router.use("/api/driverMatching",require("./routes/driverMatching"));
router.use("/api/requestmechanic", require("./routes/request.mechanic"));
router.use("/api/Mechanic", require("./routes/MechanicRequest"));

module.exports = router;