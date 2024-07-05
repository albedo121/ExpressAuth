//IMPORT ALL PACKAGES HERE------------------------------
const express = require('express')
const router = express.Router()

//IMPORT ALL MIDDLEWARES HERE------------------------------
const {isLoggedIn, isRole} = require('../middlewares/userMiddleware')

//IMPORT ALL ROUTE CONTROLLERS HERE------------------------------
const {signup,
       login,
       logout,
       forgotPassword,
       resetPassword,
       getLoggedInUserDetails,
       passwordUpdate,
       userUpdate,
       adminGetAllUsers,
       adminGetSingleUser,
       adminUpdateUser,
       adminDeleteUser,
       adminGetRoleUser
      } = require('../controllers/userController')

//IMPORT ALL PAGE RENDER CONTROLLER HERE------------------------------
const {userDashboardPage,
       updateUserPage,
       forgotPasswordPage,
       resetPasswordPage,
       updatePasswordPage,
       adminDashboardPage,
       adminGetSingleUserPage,
       adminUpdateUserPage,
       adminDeleteUserPage,
       adminGetRoleUserPage
      } = require('../controllers/pageController')



//DEFINE CONTROLLER ROUTES BELOW------------------------------

//User Paths-
router.route("/user/signup").post(signup)
router.route("/user/login").post(login)
router.route("/user/logout").get(isLoggedIn, logout)
router.route("/user/forgotpassword").post(forgotPassword)
router.route("/user/password/reset/:token").post(resetPassword)
router.route("/user/profile").get(isLoggedIn, getLoggedInUserDetails)
router.route("/user/password/update").post(isLoggedIn, passwordUpdate)

//Admin Paths-
router.route("/admin/user/allusers").get(isLoggedIn, isRole('admin'), adminGetAllUsers)
router.route("/admin/user/getdetails").post(isLoggedIn, isRole('admin'), adminGetSingleUser)
router.route("/admin/user/update/").post(isLoggedIn, isRole('admin'), adminUpdateUser)
router.route("/admin/user/delete/").post(isLoggedIn, isRole('admin'), adminDeleteUser)
router.route("/admin/user/role").post(isLoggedIn, isRole('admin'), adminGetRoleUser)




//DEFINE PAGE RENDER PAGES ROUTES BELOW------------------------------
router.route("/user/dashboard").get(isLoggedIn, userDashboardPage)
router.route("/user/forgotpassword").get(forgotPasswordPage)
router.route("/user/password/reset/:token").get(resetPasswordPage)
router.route("/user/password/update").get(isLoggedIn, updatePasswordPage)
router.route("/user/update").get(isLoggedIn, updateUserPage)
router.route("/user/update").post(isLoggedIn,userUpdate)

router.route("/admin/dashboard").get(isLoggedIn, isRole('admin'), adminDashboardPage)
router.route("/admin/user/details").get(isLoggedIn, isRole('admin'),adminGetSingleUserPage)
router.route("/admin/user/update").get(isLoggedIn, isRole('admin'),adminUpdateUserPage)
router.route("/admin/user/delete").get(isLoggedIn, isRole('admin'), adminDeleteUserPage)
router.route("/admin/user/role").get(isLoggedIn, isRole('admin'), adminGetRoleUserPage)











//EXPORT MODULE-------------------------------
module.exports = router;