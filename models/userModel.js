//IMPORT ALL PACKAGES HERE------------------------------
const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')

/*---------------------------------------------------------------------*/

//CREATING THE USER SCHEMA------------------------------
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter a name.'],
        maxlength: [50, 'Name should be under 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Please enter email.'],
        validate: [validator.isEmail, 'Please enter correct email format'],
        unique: true
    },
    contact: {
        type: String,
        required: [true, 'Please enter contact info.'],
        validate: [validator.isMobilePhone, 'Please enter valid contact number.'],
        unique: true
    },
    password: {
        type: String,
        required: [true, 'Please enter password.'],
        minlength: [6, 'Password should be atleast 6 characters.'],
        select: false
    },
    role: {
        type: String,
        default: 'user'
    },
    photo: {
        id: {
            type: String,
            default: 'Auth/users/akp1l6exknb4jgu5wpsv'
        },
        secure_url: {
            type: String,
            default: 'https://res.cloudinary.com/dselmyiuf/image/upload/v1719412554/Auth/users/akp1l6exknb4jgu5wpsv.jpg'
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    forgotPasswordToken: String,
    forgotPasswordTokenExpiry: String
})
/*---------------------------------------------------------------------*/

//CREATE THE METHODS BELOW------------------------------

//HASH PASSWORD BEFORE SAVING IN DB USING PRE HOOK
userSchema.pre('save', async function(next){
    if(!this.isModified('password'))   //If password field is not modified then dont encrypt.
        return next()                  //We do this because we dont want to encrypt password everytime we retrive something else from DB.
    else
    this.password = await bcrypt.hash(this.password,10)  //Otherwise hash the password.
    })

//VALIDATING USER LOGIN BY COMPARING PASSWORD SENT BY USER FROM DB
userSchema.methods.isValidatedPassword = async function (userSentPassword){
    return await bcrypt.compare(userSentPassword, this.password)
}

//CREATING JSON WEB TOKEN
userSchema.methods.getJwtToken = function (){
    return jwt.sign({id: this._id}, process.env.JWT_SECRET, {expiresIn: process.env.JWT_EXPIRY})
}

//CREATING FORGOT PASSWORD TOKEN
userSchema.methods.getForgotPasswordToken = function(){
    //Generate a long random string
    const forgotToken = crypto.randomBytes(20).toString('hex')

    //Hashing the token and saving it in DB later
    this.forgotPasswordToken = crypto.createHash('sha256').update(forgotToken).digest('hex')

    //Setting token expiry time to 30 mins
    this.forgotPasswordTokenExpiry = Date.now() + 30 * 60 * 1000;

    return forgotToken
}

//EXPORT MODULE-
module.exports = mongoose.model('User',userSchema)