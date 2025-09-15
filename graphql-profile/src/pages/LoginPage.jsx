import React, {useState} from "react";
import './LoginPage.css';
import { useNavigate } from "react-router-dom";


const LoginPage = () => {
  const [loading, setLoading] = useState(false);
const [errorMessage, setErrorMessage] = useState('');
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    // console.log("username:", usernameOrEmail);
    setErrorMessage('');
    setLoading(true);
    
    if (!usernameOrEmail.trim() || !password) {
      setErrorMessage("Please enter username/email and password.");
      setLoading(false);
      return;
    }
    
    
    try {
  const encoded = btoa(`${usernameOrEmail}:${password}`)
  const res = await fetch("https://learn.reboot01.com/api/auth/signin", {
    method: "POST",
    headers: {"Authorization": `Basic ${encoded}`}
  });

  if (!res.ok) {
    const errBody = await res.json().catch(()=>null);
      throw new Error(errBody?.error || `Login failed (${res.status})`);
  }
  
  const data = await res.json();

  const token = data?.jwt || data?.token || data;
  if (!token) { throw new Error("No token returned from server")}

  localStorage.setItem('jwt', token)
  setPassword('');
  setErrorMessage('');

} catch (error) {
  setErrorMessage(error.Message || "Network error");
} finally{
  navigate("/profile");
setLoading(false);
}

  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2>Login</h2>
        <input type="text" placeholder="Username or Email" value={usernameOrEmail} onChange={(e) => setUsernameOrEmail(e.target.value)}/>
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {errorMessage && <p className="error">{errorMessage}</p>}
<button type="submit" disabled={loading}>
  {loading ? "Signing in..." : "Sign In"}
</button>

      </form>
    </div>
  );
};

export default LoginPage;

