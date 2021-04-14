const multer  = require('multer');
const util = require("util");
//const upload = multer({dest : 'Mechanic_Images'});

const fileStorage = multer.diskStorage({
    destination : (req,file,cb) => {
        cb(null,'./images/MechanicImages');
    },
    filename : (req,file,cb) => {
        cb(null, new Date().toISOString().replace(/:/g, '-')  + '-' + file.originalname);
    }
});

const upload = multer({
    storage: fileStorage,
    limits:{
        fileSize : 10000000,
    },
    fileFilter(req,file,cb){
        if((!file.originalname.match(/\.(jpg|jpeg|png|JPG|JPEG|PNG)$/))) return cb(new Error("File Format Is Incorrect !"));
        cb(null,true)
    }
}).single("MechanicImage");

var uploadFilesMiddleware = util.promisify(upload);
module.exports = uploadFilesMiddleware;