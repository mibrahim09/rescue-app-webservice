const jwt = require('jsonwebtoken');
const config = require('config');
const { MechanicCenter } = require('../models/mechanicCenters');

module.exports = async function (req, res, next) {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).send({ "error": "Access denied. No token provided."});
    try {
        const decoded = jwt.verify(token, config.get('jwtPrivateKey'));
        if (!decoded.verified) {
            return res.status(400).send({ "error": "Unverified Center"});
        }
        if (!decoded.user_type || (decoded.user_type != 'mechanic_centers'))
            return res.status(400).send({ "error": "Unknown usertype"});
        let mechanicCenter = await MechanicCenter.findOne({ _id: decoded._id });
        if (!mechanicCenter) return response.status(400).send({
            "error": "User doesn't exist."
        });

        req.mechanicCenter = decoded;
        next();
    }
    catch (ex) {
        res.status(400).send('Invalid Token.');
    }
}