const nodemailer = require("nodemailer");
const config = require("config");

class MailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.get("MAIL_HOST"),
      port: config.get("MAIL_PORT"),
      secure: false,
      auth: {
        user: config.get("MAIL_AUTH_USER"),
        pass: config.get("MAIL_AUTH_PASSWORD"),
      },
    });
  }
  async sendMail(email, code) {
    await this.transporter.sendMail({
      from: config.get("MAIL_AUTH_USER"),
      to: email,
      subject: "Подтверждение авторизации",
      text: "",
      html: `
                    <div><h1>Ваш код подтверждения ${code}</h1></div>
                `,
    });
  }
}

module.exports = new MailService();
