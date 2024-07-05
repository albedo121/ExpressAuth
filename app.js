//IMPORT ALL PACKAGES HERE------------------------------
const express = require('express')
const app = express()
var path = require('path')
const cookieParser = require('cookie-parser')
const fileUpload = require('express-fileupload')


//APP SETUP------------------------------
app.set('view engine','ejs')
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(cookieParser())
app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/"
}))

//SWAGGER SETUP-------------------------------
const swaggerUi = require('swagger-ui-express');
const fs = require("fs")
const YAML = require('yaml')

const file  = fs.readFileSync('./swagger.yaml', 'utf8')
const swaggerDocument = YAML.parse(file)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));


//IMPORT ALL ROUTES HERE-------------------------------
const home = require('./routes/homeRoute')
const user = require('./routes/userRoute')



//ROUTER MIDDLEWALRE-------------------------------
app.use("/api/v1",home)
app.use("/api/v1",user)


//EXPORT MODULE-------------------------------
module.exports = app;