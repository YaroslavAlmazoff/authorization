const AuthController = require("../controllers/auth.controller");
const { check } = require("express-validator");

const router = require("express").Router();

router.post(
  "/registration",
  [
    check("email", AuthController.errorTypes.incorrectEmail).isEmail(),
    check("password", AuthController.errorTypes.weakPassword).isLength({
      min: 6,
    }),
  ],
  (req, res) => {
    try {
      AuthController.registration(req, res);
    } catch (e) {
      console.log(e);
      res.json({ error: AuthController.errorTypes.error });
    }
  }
);

router.post(
  "/login",
  [
    check("email", AuthController.errorTypes.incorrectEmail).isEmail(),
    check("password", AuthController.errorTypes.passwordNotEntered).exists(),
  ],
  (req, res) => {
    try {
      AuthController.login(req, res);
    } catch (e) {
      console.log(e);
      res.json({ error: AuthController.errorTypes.error });
    }
  }
);

router.get("/refresh", (req, res) => {
  try {
    AuthController.refresh(req, res);
  } catch (e) {
    console.log(e);
    res.json({ error: AuthController.errorTypes.error });
  }
});

router.get("/exists/:value", (req, res) => {
  try {
    AuthController.exists(req, res);
  } catch (e) {
    console.log(e);
    res.json({ error: AuthController.errorTypes.error });
  }
});

router.get("/send/:email", (req, res) => {
  try {
    AuthController.send(req, res);
  } catch (e) {
    console.log(e);
    res.json({ error: AuthController.errorTypes.error });
  }
});

router.get("/confirm/:code/:id", (req, res) => {
  try {
    AuthController.checkConfirmation(req, res);
  } catch (e) {
    console.log(e);
    res.json({ error: AuthController.errorTypes.error });
  }
});

router.post(
  "/check-password",
  [check("password", AuthController.errorTypes.passwordNotEntered).exists()],
  (req, res) => {
    try {
      AuthController.checkPassword(req, res);
    } catch (e) {
      console.log(e);
      res.json({ error: AuthController.errorTypes.error });
    }
  }
);

module.exports = router;
