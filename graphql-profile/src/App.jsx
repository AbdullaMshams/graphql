import { Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />}/>
      {/* <Route path="/" element={<LoginPage />}/> */}
      <Route path="/" element={<ProfilePage />}/>
    </Routes>
  );
}

export default App;
