import './App.css';
import { BrowserRouter } from "react-router-dom";
import { StylesProvider, ThemeProvider } from '@material-ui/core/styles';
import Login from "./components/Authentication/Login_material";
import PageContainer from "./Views/PageContainer/PageContainer";
import { Hub } from "aws-amplify";
import React, { useState, useEffect } from "react";
import { connect } from "react-redux";
import { updateLoginState } from "./Actions/loginActions";
import theme from "./themes";
import 'bootstrap/dist/css/bootstrap.min.css';

function App(props) {
  const { loginState, updateLoginState } = props;
  const [currentLoginState, updateCurrentLoginState] = useState(loginState);

  useEffect(() => {
    setAuthListener();
  }, []);

  useEffect(() => {
    updateCurrentLoginState(loginState);
  }, [loginState]);


  async function setAuthListener() {
    Hub.listen('auth', (data) => {
      switch (data.payload.event) {
        case "signOut":
          updateLoginState("signIn");
          break;
        default:
          break;
      }
    })
  }
  return (
    <StylesProvider injectFirst>
      <ThemeProvider theme={theme}>
        <div style={{ width: "100vw", height: "100vh" }}>
          {
            currentLoginState !== "signedIn" && (

              // /* Login component options:
              // *
              // * [logo: "custom", "none"]
              // * [type: "video", "image", "static"]
              // * [themeColor: "standard", "#012144" (color hex value in quotes) ]
              // *  Suggested alternative theme colors: #037dad, #5f8696, #495c4e, #4f2828, #ba8106, #965f94
              // * [animateTitle: true, false]
              // * [title: string]
              // * [darkMode (changes font/logo color): true, false]
              // * [disableSignUp: true, false]

              <Login logo={"none"} type={"image"} themeColor={"standard"} animateTitle={false}
                title={"Management System"} darkMode={true}
                disableSignUp={true}
              />
            )
          }
          {
            currentLoginState === "signedIn" && (
              <BrowserRouter>
                <PageContainer />
              </BrowserRouter>
            )
          }
        </div>
      </ThemeProvider>
    </StylesProvider>
  );
}

const mapStateToProps = (state) => {
  return {
    loginState: state.loginState.currentState,
  };
};

const mapDispatchToProps = {
  updateLoginState,
};

export default connect(mapStateToProps, mapDispatchToProps)(App);
