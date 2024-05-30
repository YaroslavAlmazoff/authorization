import { useEffect, useState } from "react";
import "./authorization.css";
import api from "../api/api";
import { notificationColors } from "../notifications/notificationTypes";
import Notification from "../notifications/Notification";
import Loader from "../loader/Loader";
import { validateInput } from "./validateInput";

const Authorization = () => {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [color, setColor] = useState(notificationColors.neutral);
  const [showMessage, setShowMessage] = useState(false);
  const [status, setStatus] = useState("Авторизация");
  const [email, setEmail] = useState("");
  const [id, setId] = useState("");
  const [registration, setRegistration] = useState(false);
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [mainFieldDisplay, setMainFieldDisplay] = useState(true);
  const [firstStageButtonDisplay, setFirstStageButtonDisplay] = useState(true);
  const [secondStageButtonDisplay, setSecondStageButtonDisplay] =
    useState(false);
  const [logoutButtonDisplay, setLogoutButtonDisplay] = useState(false);
  const [thirdStageButtonDisplay, setThirdStageButtonDisplay] = useState(false);
  const [emailConfirmationDisplay, setEmailConfirmationDisplay] =
    useState(false);
  const [passwordDisplay, setPasswordDisplay] = useState(false);
  const [code, setCode] = useState("");

  useEffect(() => {
    const refresh = async () => {
      if (localStorage.getItem("token")) {
        setLoading(true);
        const response = await api.get("refresh", { withCredentials: true });
        console.log(response);
        if (response.data.verified) {
          setMainFieldDisplay(false);
          setFirstStageButtonDisplay(false);
          setLogoutButtonDisplay(true);
          setStatus("Вы в системе");
          setLoading(false);
        }
      }
    };
    refresh();
  }, []);

  const firstStage = async () => {
    if (!email || !validateInput(email)) {
      setShowMessage(true);
      setMessage("Введите корректный email");
      setColor(notificationColors.error);
      setTimeout(() => setShowMessage(false), 3000);
      return;
    }
    setLoading(true);
    setFirstStageButtonDisplay(false);

    const existsResponse = await api.get(`exists/${email}`);
    setPasswordDisplay(true);
    setSecondStageButtonDisplay(true);
    if (!existsResponse.data.exists) {
      setRegistration(true);
    }
    setLoading(false);
  };

  const secondStage = async () => {
    if ((registration && password !== repeatPassword) || !password) return;
    setLoading(true);
    if (!registration) {
      const response = await api.post(`check-password`, {
        password,
        email,
      });
      const errors = response.data.errors;
      if (errors) {
        setShowMessage(true);
        setMessage(errors.join(". "));
        setColor(notificationColors.error);
        setLoading(false);
        setTimeout(() => setShowMessage(false), 5000);
        return;
      }
    }

    setMainFieldDisplay(false);
    setPasswordDisplay(false);
    const sendResponse = await api.get(`send/${email}`);
    setId(sendResponse.data.id);
    setEmailConfirmationDisplay(true);
    setThirdStageButtonDisplay(true);
    setLoading(false);
  };

  const thirdStage = async () => {
    if (!code) {
      setShowMessage(true);
      setMessage("Введите код");
      setColor(notificationColors.error);
      setTimeout(() => setShowMessage(false), 3000);
      return;
    }
    setLoading(true);
    setThirdStageButtonDisplay(false);
    setEmailConfirmationDisplay(false);
    const response = await api.get(`confirm/${code}/${id}`);
    const match = response.data.match;

    if (!match) {
      setShowMessage(true);
      setMessage(response.data.errors.join(". "));
      setColor(notificationColors.error);
      setLoading(false);
      setTimeout(() => {
        setShowMessage(false);
        window.location.reload();
      }, 5000);
      return;
    }

    if (!registration) {
      const loginResponse = await api.post(
        "login",
        { email, password },
        { withCredentials: true }
      );
      localStorage.setItem("token", loginResponse.data.accessToken);
      setMessage(loginResponse.data.message);
    } else {
      const registerResponse = await api.post(
        "registration",
        { email, password },
        { withCredentials: true }
      );
      localStorage.setItem("token", registerResponse.data.accessToken);
      setMessage(registerResponse.data.message);
    }

    setStatus("Вы в системе");
    setShowMessage(true);
    setMainFieldDisplay(false);
    setLogoutButtonDisplay(true);
    setColor(notificationColors.success);
    setLoading(false);
  };

  const logout = () => {
    localStorage.removeItem("token");
    window.location.reload();
  };

  return (
    <>
      <div className="form form-width">
        <p className="form-title">{status}</p>
        {logoutButtonDisplay && (
          <button onClick={logout} className="form-button">
            Выйти
          </button>
        )}
        {mainFieldDisplay && (
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-field"
            pattern="[0-9]{10}"
            type="email"
            placeholder="Введите email"
          />
        )}
        {firstStageButtonDisplay && (
          <button onClick={firstStage} className="form-button">
            Продолжить
          </button>
        )}
        {passwordDisplay && (
          <div className="full-width">
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-field"
              type="password"
              placeholder="Введите пароль"
            />
            {registration && (
              <input
                value={repeatPassword}
                onChange={(e) => setRepeatPassword(e.target.value)}
                className="form-field"
                type="password"
                placeholder="Повторите пароль"
              />
            )}
            {secondStageButtonDisplay && (
              <button onClick={secondStage} className="form-button">
                Далее
              </button>
            )}
          </div>
        )}
        {emailConfirmationDisplay && (
          <div>
            <p className="form-text">Введите код из письма</p>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="form-field"
              type="number"
              placeholder="Введите код"
            />
          </div>
        )}
        {thirdStageButtonDisplay && (
          <button onClick={thirdStage} className="form-button">
            Далее
          </button>
        )}
        {loading && <Loader />}
      </div>
      {showMessage && <Notification text={message} color={color} />}
    </>
  );
};

export default Authorization;
