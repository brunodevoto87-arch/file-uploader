const upload = require("../middleware/upload");
//Ruta para subir un archivo a una carpeta especifica
router.post("/folder/upload", isAuth, upload.single("file"), fileController.uploadFile);
