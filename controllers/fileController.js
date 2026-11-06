const {PrismaClient} = require("@prisma/client");
const prisma = new PrismaClient();
const fs = require("fs");
const path = require("path");

exports.uploadFile = async (req, res) =>{
    try{
        //1. Si multer no subio ningun archivo, cortamos aca
        if(!req.file){
            return res.status(400).send("No se subio ningun archivo.");
        }
        //2.Obtenemos el ID de la carpeta  de la URL
        const folderId = parseInt(req.params.folderId);
        //3.Verificamos que la carpeta exista y sea del usuario logueado
        const folder = await prisma.folder.findUnique({
            where: {id: folderId}
        });
        if (!folder || folder.userId !== req.user.id){
            return res.status(403).send("No tienes permisos para subir archivos a esta carpeta.");
        }
        //4. Guardamos los datos en la base de datos de Prisma
        console.log("DATOS DE CLOUDINARY:", req.file);
        await prisma.file.create({
            data:{
                name: req.file.originalname, //Nombre original del archivo
                size: req.file.size, //tamaño en bytes
                url: req.file.secure_url || req.file.path,//Usamos secure_url (que siempre trae el https://)
                folderId: folderId //A que carpeta pertenece
            }
        });
         //5. Redirigimos  a la vista de la carpeta 
        res.redirect(`/folders/${folderId}`)
    }
    catch(err){
        console.error(err);
        res.status(500).send("Error al subir el archivo");
    }
};

exports.deleteFile = async (req, res)=>{
    try{
        const fileId = parseInt(req.params.fileId);

        //1.- Buscamos el archivo en la base de datos
        const file = await prisma.file.findUnique({
            where: {id: fileId}
        });
        // Si no existe volvemos
        if (!file) return res.redirect("back");
        //2.- Verificamos que el archivo pertenezca a una carpeta de usuario Logueado
        //(Aca se podria usar una consulta de busqueda mas compleja con include..pero para simplificar buscamos la carpeta)
        const folder = await prisma.folder.findUnique({
            where: {id: file.folderId}
        });

        if (!folder || folder.userId !== req.user.id){
            return res.status(403).send("No tienes permiso para borrar este archivo");
        }

        //3.- Borramos el archivo fisico del disco (usando la URL para encontrar la ruta)
        const filePath = path.join(__dirname, "..", "public", file.url);

        //fs.unlink borra el archivo. Le pasamos un callback para atrapar errores.
        fs.unlink(filePath, (err)=>{
            if (err) console.error("Error al borrar el archivo fisico:", err);
            //Si falla el borrado fisico (ej: ya no esta), igual seguimos para borrar de la DB.
        });
        //4.-Borramos el registro de la base de datos con Prisma
        await prisma.file.delete({
            where: {id: fileId}
        });
        //5.-Redirigimos de vuelta a la carpeta
        res.redirect(`/folders/${file.folderId}`);
    }
    catch(err){
        console.error(err);
        res.redirect("back");
    }
}
