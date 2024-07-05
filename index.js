//IMPORT ALL PACKAGES HERE------------------------------
const app = require('./app')
const mongoose = require('mongoose')
require('dotenv').config()
const cloudinary = require('cloudinary')

//------------------------------

//CONNECT TO DB
mongoose.connect(process.env.DB_URL)
.then(console.log('DATABASE CONNECTED SUCCESSFULLY...'))
.catch(error => {
    console.log('DATABASE CONNECTION FAILED...')
    console.log(error);
    process.exit(1);
})

//CONNECT TO CLOUDINARY
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET
})

//SERVER LISTEN
const port = process.env.PORT || 3000;
app.listen(port, console.log(`SERVER STARTED ...`))
