const cookieToken = (user,res) =>{
    user.password = undefined;
    user.photo.id = undefined;
    const token = user.getJwtToken()
            const options = {
                expires: new Date(Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 *1000),
                httpOnly: true
            }
            // res.status(200).cookie("token",token,options).json({
            //     success: true,
            //     token,
            //     user
            // })
            res.status(200).cookie("token",token,options).redirect('/api/v1/user/dashboard')

}

module.exports = cookieToken;