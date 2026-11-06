require("dotenv").config();
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const {PrismaClient} = require("@prisma/client");
const {PrismaSessionStore} = require("@quixo3/prisma-session-store");
const path = require("path");
const PORT = process.env.Port || 3000;
const prisma = new PrismaClient();
const app = express();

//1-configuracion basica de ejs y formularios
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, "public")));

//2-Configuracion de Sesiones con Prisma (la clave de este paso!)
app.use(
    session({
        cookie: {maxAge: 7 * 24 * 60 * 60 * 1000}, //7 dias
        secret: process.env.SESSION_SECRET || "un_secreto_muy_seguro",
        resave: false,
        saveUninitialized: false,
        store: new PrismaSessionStore(prisma, {
            checkPeriod: 2 * 60 * 1000, //revisa sesiones expiradas cada 2 minutos.
            dbRecordIdIsSessionId: true,
            dbRecordIdFunction: undefined,
        }),
    })
);
//3-Iniacializar Passport
app.use(passport.initialize());
app.use(passport.session());
//4-Configurar Passport (LocalStrategy, serializeUser, deserializeUser)
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");

passport.use(
    new LocalStrategy(async (username, password, done)=>{
        try{
            //1-buscamos el usuario por username
            const user = await prisma.user.findUnique({
                where: {username: username}
            });
            if(!user){
                return done (null, false, {message: "Usuario no encontrado"});
            }
            //2-Comparamos la contraseña con bcrypt
            const match = await bcrypt.compare(password, user.password);
            if (!match){
                return done(null, false, {message: "Contraseña incorrecta"});
            }
            //3-Si todo esta bien, pasamos el usuario
            return done (null, user);
        }
        catch (err){
            return done(err);
        }
    })
)
//Serializacion (guarda solo ID en la sesion)
passport.serializeUser((user, done)=>{
    done(null, user.id);
});
//Deserializacion (busca el usuario por ID en cada request)
passport.deserializeUser(async(id,done)=>{
    try{
        const user = await prisma.user.findUnique({
            where: {id: id}
        });
        done(null, user);
    }
    catch(err){
        done(err);
    }
});
//Importar rutas
const authRoutes = require("./routes/auth");
app.use("/", authRoutes);

const folderRoutes = require("./routes/folders");
app.use("/folders", folderRoutes);

app.get("/", (req, res)=>{
    if (req.isAuthenticated()) return res.redirect("/folders");
    res.render("index", {user: null, folders: []});
});

app.listen(PORT, ()=>{
    console.log(`Servidor en http://localhost:${PORT}`);
});