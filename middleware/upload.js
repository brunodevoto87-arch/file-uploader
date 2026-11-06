const multer = require("multer");
const cloudinary = require("./cloudinary");
const {CloudinaryStorage} = require("multer-storage-cloudinary");

//1-Configuracion de Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "file-uploader",// carpeta en cloudinary
        allowed_formats: ["jpg", "jpeg", "png", "pdf"], //formatos permitidos
    },
});
//2- Filtro de archivos(validacion extra)
const fileFilter = (req, file, cb) =>{
    //Ejemplo de filtrado: solo aceptar imagenes y pdfs
    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (allowedTypes.includes(file.mimetype)){
        cb(null, true);
    }
    else{
        cb(new Error("Tipo de archivo no permitido"), false);
    }
};
//3- Multer con todo configurado
const upload = multer({
    storage: storage,
    limits: {fileSize: 5 * 1024 * 1024}, // limite de 5MB
    fileFilter: fileFilter
});

module.exports = upload;