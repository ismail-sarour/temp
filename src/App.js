import React from "react";
import AiChatWidget from "./AiChatWidget";
import { BrowserRouter, Route, Switch } from "react-router-dom";

const App = () => {
  return (
    <BrowserRouter>
      <Switch>// Existing routes</Switch>
      <AiChatWidget />
    </BrowserRouter>
  );
};

export default App;
