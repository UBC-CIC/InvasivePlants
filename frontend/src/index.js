import React from 'react';
import { createRoot } from 'react-dom/client';
import { applyMiddleware, createStore } from "redux";
import thunk from "redux-thunk";
import { Provider } from "react-redux";
import { Amplify } from 'aws-amplify'
import awsExports from "./aws-exports";
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import reducers from "./Reducers";
import 'semantic-ui-css/semantic.min.css';

Amplify.configure(awsExports);

const store = createStore(
  reducers, applyMiddleware(thunk)
);


createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <App />
  </Provider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

