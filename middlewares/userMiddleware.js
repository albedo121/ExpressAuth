//IMPORT ALL PACKAGES BELOW-------------------------------
const User = require('../models/userModel')
const jwt = require('jsonwebtoken')


//DEFINE ALL MIDDLEWARES BELOW-------------------------------

//Is logged in middleware-
exports.isLoggedIn = async (req,res,next) => {
    try {
        //Get token from cookie
        const token = req.cookies.token

        //If no token was found
        if(!token)
            res.status(400).send('Please log in to continue.')

        //If token was found
        else
        {
            //Verify the token
            const decoded = jwt.verify(token,process.env.JWT_SECRET)

            //Find user by the token
            req.user = await User.findById(decoded.id)

            next()
        }
    } catch (error) {
        console.log(error)
        res.status(500).render('error_500')
    }
}

//Role middleware
exports.isRole = (...roles) => {
    return(req,res,next) => {
        if(!roles.includes(req.user.role))
        return res.status(401).render('error_401')
        next()
    }
}