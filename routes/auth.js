const express = require("express");
const router = express.Router(); //aca creamos el mini servidor
const bcrypt = require("bcrypt");
const passport = require("passport");
const {PrismaClient} = require("@prisma/client");
const prisma = new PrismaClient();

//Ruta Get: Mostrar formulario login
router.get("/login", (req, res)=>{
    res.render("login");
});

//Ruta Post: Procesar el login con Passport
router.post("/login", passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
}));

//Ruta Get: Mostrar formulario de registro
router.get("/sign-up", (req, res)=>{
    res.render("sign-up");
});

//Ruta Post: Procesar el registro
router.post("/sign-up", async (req, res)=>{
    try{
        const {username, password} = req.body;
        //encriptar contraseña
        const hashedPassword = await bcrypt.hash(password, 10);
        //Guardar en base de datos con Prisma
        await prisma.user.create({
            data:{
                username: username,
                password: hashedPassword
            }
        });
        res.redirect("/login"); //si pasa, va al login
    }
    catch(err){
        console.error(err);
        res.redirect("/sign-up"); //si hay error (ej: usuario repetido), vuelve al registro
    }
});
//Ruta Get: Cerrar Sesion
router.get("/logout", (req, res, next)=>{
    req.logout((err)=>{
        if (err){return next(err);}
        res.redirect("/");
    });
});
module.exports = router;