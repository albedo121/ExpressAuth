//IMPORT ALL PACKAGES BELOW-------------------------------
const User = require('../models/userModel')
const crypto = require('crypto')


//DEFINE ALL CONTROLLERS METHODS BELOW-------------------------------

//Home page - Login and registraion-
exports.home = (req,res) => {
     res.status(200).render('home')
}

//User dashboard page (login required)
exports.userDashboardPage = (req,res) => {
    res.status(200).render('userDashboard')
}

//Forgot password page (User login not required)-
exports.forgotPasswordPage = (req,res) => {
    res.status(200).render('forgotPassword')
}

//Reset password page (User login not required)-
exports.resetPasswordPage = async (req,res) => {
    try {
        //Grab token from params
        const token = req.params.token

        //Hashing the token
        const hashToken = crypto.createHash("sha256").update(token).digest("hex")

        //Find user based on the above hashed token
        const user = await User.findOne({
            forgotPasswordToken: hashToken,
            forgotPasswordTokenExpiry: {$gt: Date.now()}
        })

        if(user)
            res.status(200).render('resetPassword')
        else if(!user)
            res.status(404).render('error_404')

    } catch (error) {
        console.log(error)
        res.status(500).render('error_500')
    }
    
}

//Forgot password page (User login required)-
exports.updatePasswordPage = (req,res) => {
    res.status(200).render('updatePassword')
}

//User update details page (User login required)-
exports.updateUserPage = (req,res) => {
    res.status(200).render('userUpdate')
}

//-----------------------------------------

//Admin dashboard page-
exports.adminDashboardPage = (req,res) => {
    res.status(200).render('adminDashboard')
}

//Admin - Get single user
exports.adminGetSingleUserPage = (req,res) => {
    res.status(200).render('adminGetUser')
}

//Admin - Update user-
exports.adminUpdateUserPage = (req,res) => {
    res.status(200).render('adminUpdateUser')
}

//Admin - Delete user-
exports.adminDeleteUserPage = (req,res) => {
    res.status(200).render('adminDeleteUser')
}

//Admin - Get user based on role
exports.adminGetRoleUserPage = (req,res) => {
    res.status(200).render('adminGetRoleUser')
}
