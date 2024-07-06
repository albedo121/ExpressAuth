//IMPORT ALL PACKAGES BELOW-------------------------------
const User = require('../models/userModel')
const fileUpload = require('express-fileupload')
const cloudinary = require('cloudinary').v2
const cookieToken = require('../utils/cookieToken')
const mailer = require('../utils/mailer')
const crypto = require('crypto')


//DEFINE ALL CONTROLLERS METHODS BELOW-------------------------------

//Signup controller-
exports.signup = async (req,res) => {
    try {
        //Get info from req.body
        const {name, email, contact, password} = req.body

        //For image handling. For publicid and secure url we are assigning default values if no image is provided by user.
        let result;
        let public_id = process.env.DEFAULT_PUBLIC_ID
        let secure_url = process.env.DEFAULT_SECURE_URL

        //Check if mandatory fields are entered
        if(!name || !email || !password || !contact)
            res.status(400).send('All fields are mandatory.')

        //Check if user already exists based on email or contact
        const user = await User.findOne({ $or: [{ email }, { contact }] })

        //If user found in DB then return error msg
        if(user)
            res.status(400).send('User Already exists')

        //If contact number not 10 digits
        else if(contact.length!=10)
            res.status(400).send('Contact number should be 10 digits')

        //If password is less than 6 characters
        else if(password.length<6)
            res.status(400).send('Password should be atleast 6 digits')
        
        //If user not found then create an entry
        else 
        {
            //Upload image to cloudinary
            if(req.files){
                let file = req.files.photo;
                result = await cloudinary.uploader.upload(file.tempFilePath, {
                    folder: 'Auth/users',
                    width: 150,
                    crop: 'scale'
                }) 

                //Set the publicid and secureurl
                public_id = result.public_id;
                secure_url = result.secure_url;
            } 

            //Push data to DB
            const user = await User.create({
                name,
                email,
                password,
                contact,
                photo: {
                    id: public_id,
                    secure_url: secure_url
                } 
            })

            user.password = undefined;
            cookieToken(user,res);
        }

    } catch (error) {
        console.log(error)
        res.status(500).render(error_500)
    }
}

//Login controller-
exports.login = async (req,res) => {
    try {
        //Get email and password from req.body
        const {email,password} = req.body

        //If email and password not provided
        if(!email || !password)
            res.status(400).send('Please enter email and password.')

        //If email and password present then proceed
        else
        {
            //Find user from DB based on email
            const user = await User.findOne({email}).select("+password")

            //If user not found
            if(!user)
                res.status(400).send('Invalid credentials or user does not exists.')

             //If user found
            else
            {
               //Check is passowrd correct or not
               const checkPassword = await user.isValidatedPassword(password)
            
               //If password is incorrect
               if(!checkPassword)
                 res.status(400).send('Invalid credentials or user does not exists.')

               //If password correct then send cookie token to user
               else
                 cookieToken(user,res)

            }

        }

        



    } catch (error) {
        console.log(error)
        res.status(500).render('error_500')
    }
}

//Logout controller-
exports.logout = (req,res) => {
    try {
        //Send expiry cookie
         res.cookie('token',null,{
        expires: new Date(Date.now()),
        httpOnly: true
        })

        //send success status
        res.status(200).redirect('/')

    } catch (error) {
        console.log(error)
        res.status(500).render('error_500')
    }
}

//Forgot password controller-
exports.forgotPassword = async (req,res) => {
    try {
        //Get email from req body
        const {email} = req.body

        //Find user based on email provided
        const user = await User.findOne({email})

        //If user found
        if(user)
         {
            //Get forgot token from user model
            const forgotToken = user.getForgotPasswordToken()

            //Save the token in DB
            await user.save({validateBeforeSave: false})

            //Crafting forgot password url
            const forgotUrl = `${req.protocol}://${req.get("host")}/api/v1/user/password/reset/${forgotToken}`

            //Crafting message for user
            const message = `Click the following url to reset password. The link will be active for 30 minutes only. \n\n ${forgotUrl}`

            //Send email to user using mailer util
            try {
                await mailer({
                    email: user.email,
                    subject: "Auth app - Password reset mail",
                    message
                })

                res.status(200).json({
                    success: true,
                    message: 'Email sent with instructions for password reset if the user exists',
                    note: 'You wont receive any email in your mail inbox as this is just a demo application and it uses free version of mailtrap. Please contact admin for password reset :)'
                })
                
            } catch (error) {
                console.log(error)

                user.forgotPasswordExpiry = undefined;
                user.forgotPasswordToken = undefined;
                await user.save({validateBeforeSave:false})

                res.status(500).send('An error occurred while sending password reset email.')
            }

         }

        else if(!user)
            res.status(200).json({
                message: 'Email sent with instructions for password reset if the user exists',
                note: 'You wont receive any email in your mail inbox as this is just a demo application and it uses free version of mailtrap. Please contact admin for password reset :)'
            })
            


    } catch (error) {
        console.log(error)
        res.status(500).render('error_500')
    }
}

//Reset password controller-
exports.resetPassword = async (req,res) => {
    try {
        //Get token from req.params
        const token = req.params.token

        //Hashing the token
        const hashToken = crypto.createHash("sha256").update(token).digest("hex")

        //Find user based on the above hashed token
        const user = await User.findOne({
            forgotPasswordToken: hashToken,
            forgotPasswordTokenExpiry: {$gt: Date.now()}
        })

        //If user does not exist
        if(!user)
            res.status(400).send('Token is invalid or expired.')

        //If user exists
        else
        {
            //Check if new password and confirm password is same
            if(req.body.newPassword !== req.body.confirmPassword)
                res.status(400).send('Password and Confirm password is not the same.')

            else if(req.body.newPassword.length<6)
                res.status(400).send('New password should be atleast 6 characters long.')

            else
            {
                //Assign new password
                user.password = req.body.newPassword

                //Expire the token
                user.forgotPasswordToken = undefined
                user.forgotPasswordTokenExpiry = undefined

                //Update DB with new password
                await user.save()

                //Send a cookie response
                cookieToken(user,res)
            }
                
        } 
    } catch (error) {
        console.log(error)
        res.status(500).render('error_500')
    }
}

//Get logged in user details-
exports.getLoggedInUserDetails = async (req,res) => {
    try {
        //Find user by id
        const user = await User.findById(req.user.id) //Getting id from isLogin middleware

        res.status(200).json({
            success: true,
            user
        })
    } catch (error) {
        console.log(error)
        res.status(500).render('error_500')
    }
}

//Password update-
exports.passwordUpdate = async (req,res) => {
    try {
        //Get userid from isLoggedIn middleware
        const userId = req.user.id

        //Find user based on user id
        const user = await User.findById(userId).select("+password")

        //Verify if current password entered is correct
        const verifyCurrentPassword = await user.isValidatedPassword(req.body.currentPassword)

        //If current password is not correct
        if(!verifyCurrentPassword)
            res.status(400).send('Current password entered is incorrect.')

        //If current password is correct
        else
        {
            //If new password and confirm are not the same
            if(req.body.newPassword !== req.body.confirmPassword)
                res.status(400).send('New password and confirm password do not match.')

            else if(req.body.newPassword.length<6)
                res.status(400).send('New password should be atleast 6 characters long')

            //If new password and confirm password are the same
            else
            {
              //Update new password and save it in DB
              user.password = req.body.newPassword
              await user.save()

              //Send a cookie token to FE
              cookieToken(user,res)
            }
        }

    } catch (error) {
        console.log(error)
        res.status(500).render('error_500')
    }
}

//Update email, phone or profile picture
exports.userUpdate = async (req,res) => {
    try {
        if(!req.body.email)
            req.body.email = undefined
        if(!req.body.contact)
            req.body.contact = undefined


                let result //For image upload handling
                let public_id = process.env.DEFAULT_PUBLIC_ID//For image upload handling
                let secure_url = process.env.DEFAULT_SECURE_URL//For image upload handling
                let newData //For email and contact handling

                //Check email or contact or photo present then update
                if(req.body.email || req.body.contact || req.files)
                {
                  //Find user based on id
                  const user = await User.findById(req.user.id)  //We get req.user.id from isLoggedIn middleware

                  //If user sent photo
                  if(req.files)
                    {
                        //If user not having default image public id and secure url, then delete image from cloudinary
                        if(user.photo.id !== process.env.DEFAULT_PUBLIC_ID && user.photo.secure_url !== process.env.DEFAULT_SECURE_URL)
                        await cloudinary.uploader.destroy(user.photo.id)

                        //Upload new photo to cloudinary
                        let file = req.files.photo;
                        result = await cloudinary.uploader.upload(file.tempFilePath, {
                        folder: 'Auth/users',
                        width: 150,
                        crop: 'scale'
                        }) 

                        //Assign the id and secure url
                        public_id = result.public_id
                        secure_url = result.secure_url;
                    }

                  
                  //Update newData object with new data
                  newData = {
                    email: req.body.email,
                    contact: req.body.contact,
                    photo: {
                        id: public_id,
                        secure_url: secure_url
                    }
                  }

                  //Push updated data to DB
                  try {
                    const updatedUser = await User.findByIdAndUpdate(req.user.id, newData, {new: true, runValidators: true})

                    res.status(200).json({
                    message: 'User Updated',
                    updatedUser
                    })
                  } catch (error) {
                    res.send('An error occurred while updating DB. Please check the data you entered.')
                  }

                }
                //If user did not enter anything
                else
                res.status(400).send('Please enter atleast one from email, contact or profile photo to update')
    
                

               

            
        } catch (error) {
        console.log(error)
        res.status(500).render('error_500')
        }
}

//Admin routes from below-------------------------------

//Admin- Return all users
exports.adminGetAllUsers = async (req,res) => {
    try {
        //Fetch all users from DB-
        const users = await User.find()

        res.status(200).json({
            success: true,
            users
        })

    } catch (error) {
        console.log(error)
        res.status(400).render('error_500')
    }
}

//Admin- Get one user data
exports.adminGetSingleUser = async (req,res) => {
    try {
        //Get email from req body
        const {email,contact} = req.body

        //If email and contact number not provided
        if(!req.body.email && !req.body.contact)
            res.status(401).send("Please give email or contact number to find a user")

        //If email and contact number both provided
        else if(req.body.email && req.body.contact)
            res.status(401).send("Please provide only email or contact number to find a user") 

        //If only email or contact number provided
        else
        {
            //Find user by email
            const user = await User.findOne({ $or: [{ email }, { contact }] })

            //If user not found
            if(!user)
              res.status(400).send('User not found')

            //If user found
             else
             res.status(200).json({
             success: true,
             user
            })
        }

        

    } catch (error) {
        console.log(error)
        res.status(400).render('error_500')
    }
}

//Admin- Update email, phone or role of a user
exports.adminUpdateUser = async (req,res) => {
    try {
        //Assign fields undefined if not provided
        if(!req.body.email)
            req.body.email = undefined
        if(!req.body.contact)
            req.body.contact = undefined
        if(!req.body.role)
            req.body.role = undefined

        //If id provided
        if(req.body.id)
         {
                 //Find user based on id
                 const user = await User.findById(req.body.id)

                 //If user not found
                 if(!user)
                    res.status(404).send('User not found.')

                 //if user found
                 else
                  {
                     //Check for email, phone or role in req body
                     if(req.body.email || req.body.contact || req.body.role)
                      {
                       //Assign new info to a const
                       const newData = {
                       email: req.body.email,
                       contact: req.body.contact,
                       role: req.body.role
                       }

                       //Update DB with new data
                        try {
                        const user = await User.findByIdAndUpdate(req.body.id, newData, {new: true, runValidators: true})
                        res.status(200).json({
                        message: 'User Updated',
                        user
                        })
                        } catch (error) {
                        console.log(error)
                        res.status(400).send('An error occurred while updating DB. Please check the data you entered.')
                        }   
                      }

                      //If email, phone or role not found
                      else
                       res.status(400).send('Please provide atleast one field to update - Email, Contact number or Role.')
                  }

                 
         }
   
         //If id not provided
         else
         res.status(400).send('Please provide user ID.')

        } catch (error) {
        console.log(error)
        res.status(500).render('error_500')
        }
}

//Admin - Delete a user from DB
exports.adminDeleteUser = async (req,res) => {
    try {
        //If user ID not provided
        if(!req.body.id)
            res.status(400).send('Please provide user ID.')

        //If user ID provided
        else
        {
            //Find user in DB from id
             const user = await User.findById(req.body.id)

            //If user not found
            if(!user)
               res.status(400).send('User not found')

            //If user found
            else
            {
                 //If not having default public id and secure url, then delete image from cloudinary and user from DB
                 if(user.photo.id !== process.env.DEFAULT_PUBLIC_ID && user.photo.secure_url !== process.env.DEFAULT_SECURE_URL)
                     await cloudinary.uploader.destroy(user.photo.id)
           
                //Delete user from DB
                await user.deleteOne()

                //Send success message
                res.status(200).send('User has been deleted')
            }
        }

    } catch (error) {
        res.status(400).send('User not found.')
    }
}

//Admin - Get a user based on role in query params
exports.adminGetRoleUser = async (req,res) => {
    try {
        //Check if role provided
        if(!req.body.role)
            res.status(400).send('Please enter a role.')

        //If role provided
        else
        {
            //Find all users based on role
            const users = await User.find({role: req.body.role})

            //If no users found (empty array returned)
            if(users.length === 0)
            res.status(404).send(`No users found for ${req.body.role} role.`)

            //If user found
             else
             res.status(200).json({
             success: true,
             users
             })
        }
        
    } catch (error) {
        console.log(error)
        res.status(500).render('error_500')
    }
}
