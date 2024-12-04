import React, { useEffect, useState } from 'react';
import AuthPage from './Components/AuthPage';
import { Route,Routes,useNavigate,Navigate } from 'react-router-dom';
import ChatPage from './Components/ChatPage';
import UpdateProfile from './Components/UpdateProfile';
import { getEmailFromToken } from './Util/JwtDecode';
import toast from 'react-hot-toast';
import ResetPassword from './Components/ResetPassword';

const App = () => {
  const BackendUrl = import.meta.env.VITE_BASE_URL;
  const infoEmail = getEmailFromToken();
  const init = infoEmail ? infoEmail :'';
  const [emailId, setemailId] = useState(init);
  const navigate = useNavigate();
  const logOutHandler = async() => {
    try {
      const response = await fetch(`${BackendUrl}/api/v1/updateSocket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({emailId:emailId, socketId:'None'})
      });

      const data = await response.json();
      if(data.success){
        localStorage.removeItem('token');
        localStorage.removeItem(`${emailId}`);
        navigate('/auth');
        setemailId('');
        toast.success('LogOut Successfully')
      }
      else{
        toast.error("Problem in logOut");
      }

    } catch (error) {
      toast.error("Problem in logOut");
    }
    
  }
  useEffect(() => {
    const response = getEmailFromToken();
    setemailId(response);
  }, [])
  
  return (
      
    <Routes>

      <Route 
        path="/auth" 
        element={
          emailId ? <Navigate to={`/chat/${emailId}`} replace /> : <AuthPage setemailId={setemailId} />
        } 
      />

      <Route 
        path="/chat/:emailId" 
        element={
          emailId ? <ChatPage emailIdCurr={emailId} logOutHandler={logOutHandler}/> : <Navigate to={'/auth'} replace /> 
        } 
      />

      <Route 
        path="/:emailId/updateDetails" 
        element={
          emailId ? <UpdateProfile emailIdCurr={emailId}/> : <Navigate to={'/auth'} replace /> 
        } 
      />

      <Route 
        path="/resetPassWord/:type"
        element={<ResetPassword/>}
      />

      <Route path="*" element={  emailId ? <Navigate to={`/chat/${emailId}`} replace /> : <Navigate to={'/auth'} replace /> } />

    </Routes>
  );
};

export default App;
