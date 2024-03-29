const nodemailer =  require('nodemailer');
const pug =  require('pug');
const { htmlToText } = require('html-to-text');

module.exports = class Email{
    constructor(user, url){
        this.to = user.email;
        this.firstName = user.name.split(' ')[0];
        this.url = url;
        this.from = `Nik <${process.env.EMAIL_FROM}>`;
    }

    newTransport(){
        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD
            }
        });
    }
    async send(template, subject){
        const html = pug.renderFile(`${__dirname}/../render/${template}.pug`,{
            firstName: this.firstName,
            url: this.url,
            subject
            }
        );

        const mailOptions = {
            from: this.from,
            to: this.to,
            subject,
            html,
            text: htmlToText(html)
        };

        await this.newTransport().sendMail(mailOptions);
    }


    async sendPasswordReset(){
        await this.send('email', 'Your password reset token valid for 10mins');
    }
}