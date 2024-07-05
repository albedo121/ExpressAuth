const nodemailer = require('nodemailer')
        
const mailer = async (options) => {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    })

//Crafting the message
const message = {
    from:'nodemailer@testapp.com',  //Sender address
    to: options.email,  //Receiver address
    subject: options.subject, //Subject line
    text: options.message //Plain body text
}

//Send the mail
await transporter.sendMail(message)

}

module.exports = mailer;