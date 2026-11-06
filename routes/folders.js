const express = require("express");
const router = express.Router();
const folderController = require("../controllers/folderController");
const upload = require("../middleware/upload");
const fileController = require("../controllers/fileController");

//Middleware para proteger estas rutas (solo logueados)
const isAuth = (req, res, next)=>{
    if (req.isAuthenticated()) return next();
    res.redirect("/login");
};

router.get("/", isAuth, folderController.getFolders);
router.get("/new", isAuth, folderController.getNewFolderForm);
router.get("/:folderId/upload", isAuth, (req, res)=>{
    res.render("upload-file", {folderId: req.params.folderId});
});
router.get("/:id", isAuth, folderController.getFolderDetails);

// Ruta POST para subir archivos
router.post('/:folderId/upload', isAuth, (req, res, next) => {
    // Ejecutamos Multer, pero capturamos si tira un error de tamaño
    upload.single('file')(req, res, (err) => {
        if (err) {
            // Si el error es por tamaño (Multer usa el código LIMIT_FILE_SIZE)
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).send('Error: El archivo supera el límite de 5MB.');
            }
            // Si es otro error (ej: tipo de archivo no permitido)
            return res.status(400).send(`Error al subir: ${err.message}`);
        }
        // Si no hay error, pasamos al controlador
        next();
    });
}, fileController.uploadFile);
router.post("/", isAuth, folderController.createFolder);
router.post("/:id/delete", isAuth, folderController.deleteFolder);
router.post("/:folderId/files/:fileId/delete", isAuth, fileController.deleteFile);

module.exports = router;