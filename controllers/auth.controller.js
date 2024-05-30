const { validationResult } = require("express-validator");
const AuthService = require("../services/auth.service");
const MailService = require("../services/mail.service");

class AuthController {
  errorTypes = {
    wrongPassword: "Неверный пароль. Попробуйте снова",
    incorrectEmail: "Некорректный адрес электронной почты",
    weakPassword: "Длина пароля должна составлять не менее 6 символов",
    passwordNotEntered: "Введите пароль",
    confirmationError: "Не удалось подтвердить. Попробуйте еще раз",
    wrongCode: "Неверный код",
    error: "Не удалось совершить операцию. Попробуйте еще раз",
  };
  messageTypes = {
    successRegistration: "Успешная регистрация!",
    successLogin: "Успешный вход в систему!",
    mailHasBeenSent: "На вашу почту был отправлен код подтверждения",
    successEmailConfirmation: "Вы успешно подтвердили свой email",
  };
  refreshTokenCookie = "refreshToken";

  async registration(req, res) {
    const errors = validationResult(req);
    const { email, password } = req.body;

    if (!errors.isEmpty()) {
      return res.json({ errors: errors.array() });
    }

    let user = await AuthService.createUser(
      email,
      await AuthService.hashPassword(password)
    );
    const { accessToken, refreshToken } = AuthService.generateTokens({
      id: user._id,
    });
    user = await AuthService.createRefreshToken(user, refreshToken);

    res
      .cookie(this.refreshTokenCookie, refreshToken, {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: false,
      })
      .json({
        user,
        message: this.messageTypes.successRegistration,
        accessToken,
        refreshToken,
      });
  }

  async login(req, res) {
    const errors = validationResult(req);
    const { email, password } = req.body;

    let user = await AuthService.getUser({ email });

    if (!AuthService.comparePasswords(user, password)) {
      errors.array().push(this.errorTypes.wrongPassword);
    }
    if (!errors.isEmpty()) {
      return res.json({ errors: errors.array() });
    }

    const { accessToken, refreshToken } = AuthService.generateTokens({
      id: user._id,
    });

    user = await AuthService.createRefreshToken(user, refreshToken);

    res
      .cookie(this.refreshTokenCookie, refreshToken, {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: false,
      })
      .json({
        user,
        message: this.messageTypes.successLogin,
        accessToken,
        refreshToken,
      });
  }

  async refresh(req, res) {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return res.json({ verified: false });
    }
    const verified = AuthService.verifyRefreshToken(refreshToken);
    if (!verified) {
      return res.json({ verified: false });
    }

    let user = await AuthService.getUser({ id: verified.id });

    const tokens = AuthService.generateTokens({ id: user._id });

    user = await AuthService.createRefreshToken(user, tokens.refreshToken);

    res
      .cookie(this.refreshTokenCookie, tokens.refreshToken, {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: false,
      })
      .json({
        user,
        message: this.messageTypes.successLogin,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        verified: true,
      });
  }

  async exists(req, res) {
    const user = await AuthService.getUser({ email: req.params.value });
    res.json({ exists: !!user });
  }

  async checkConfirmation(req, res) {
    const { code, id } = req.params;
    const { match } = await AuthService.checkCode(code, id);
    await AuthService.removeTemporaryCode(id);

    if (!match) return res.json({ match, errors: [this.errorTypes.wrongCode] });
    res.json({ match });
  }

  async checkPassword(req, res) {
    const errors = validationResult(req);
    const { email, password } = req.body;
    const match = await AuthService.comparePasswords(
      await AuthService.getUser({ email }),
      password
    );
    const errorsArray = errors.array();

    if (!match) {
      errorsArray.push(this.errorTypes.wrongPassword);
    }

    if (errorsArray.length) {
      return res.json({ errors: errorsArray });
    }
    res.json({ match });
  }

  async send(req, res) {
    const { email } = req.params;
    const { code, _id } = await AuthService.saveTemporaryCode();
    await MailService.sendMail(email, code);
    res.json({ message: this.messageTypes.mailHasBeenSent, id: _id });
  }
}

module.exports = new AuthController();
