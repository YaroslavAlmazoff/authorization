const User = require("../models/User");
const TemporaryCode = require("../models/TemporaryCode");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");

class AuthService {
  async getUser(data) {
    if (data.id) return await User.findById(data.id);
    else if (data.email) return await User.findOne({ email: data.email });
  }

  async createUser(email, password) {
    return await User.create({ email, password });
  }

  async hashPassword(password) {
    return await bcrypt.hash(password, 12);
  }

  async comparePasswords(user, password) {
    return await bcrypt.compare(password, user.password);
  }

  async saveTemporaryCode() {
    let code = 0;
    while (code < 10000) {
      code = Math.floor(Math.random() * 100000);
    }
    const temporaryCode = await TemporaryCode.create({ code });
    return temporaryCode;
  }

  async removeTemporaryCode(id) {
    await TemporaryCode.findByIdAndDelete(id);
  }

  async checkCode(code, id) {
    const temporaryCode = await TemporaryCode.findById(id);
    return { match: temporaryCode.code == code };
  }

  async createRefreshToken(user, token) {
    user.refreshToken = token;
    return await user.save();
  }

  generateTokens(data) {
    const accessToken = jwt.sign(data, config.get("ACCESS_SECRET"), {
      expiresIn: "1h",
    });
    const refreshToken = jwt.sign(data, config.get("REFRESH_SECRET"), {
      expiresIn: "30d",
    });
    return {
      accessToken,
      refreshToken,
    };
  }

  verifyAccessToken(token) {
    return jwt.verify(token, config.get("ACCESS_SECRET"));
  }
  verifyRefreshToken(token) {
    return jwt.verify(token, config.get("REFRESH_SECRET"));
  }
}

module.exports = new AuthService();
