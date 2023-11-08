/*
import { BrowserRouter, Routes, Route, Switch } from "react-router-dom";

import { PlantNet } from './pages/pl@ntNet';
import Dashboard from './pages/dashboard';
import DownloadWebscrap from "./pages/downloadWebscrap";

function App() {
  console.log("app");
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/test" element={<PlantNet />} />
        <Route path="/download" element={<DownloadWebscrap />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
*/

// ###########################################################
// /*
import './App.css';
import { BrowserRouter } from "react-router-dom";

import { StylesProvider, ThemeProvider } from '@material-ui/core/styles';
import Login from "./Components/Authentication/Login_material";
import PageContainer from "./Views/PageContainer/PageContainer";
import { Hub } from "aws-amplify";
import React, { useState, useEffect } from "react";
import { connect } from "react-redux";
import { updateLoginState } from "./Actions/loginActions";
import theme from "./themes";
import { Amplify } from 'aws-amplify'
import awsmobile from "./aws-exports";

Amplify.configure(awsmobile);

function App(props) {
  const { loginState, updateLoginState } = props;
  const [currentLoginState, updateCurrentLoginState] = useState(loginState);

  useEffect(() => {
    console.log("currentLoginState in useEffect:", currentLoginState);
    setAuthListener();
  }, []);

  useEffect(() => {
    console.log("Login state updated:", loginState);
    updateCurrentLoginState(loginState);
  }, [loginState]);


  async function setAuthListener() {
    console.log("Setting up auth listener");
    Hub.listen('auth', (data) => {
      console.log("Auth event:", data.payload.event);
      switch (data.payload.event) {
        case "signOut":
          console.log("User signed out");
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

              <Login logo={"custom"} type={"image"} themeColor={"standard"} animateTitle={true}
                title={"Invasive Plants"} darkMode={true}
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
// */