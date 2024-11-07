import React, { useEffect, useState } from 'react';
import AuthPage from './Components/AuthPage';
import { Route,Routes,useNavigate,Navigate } from 'react-router-dom';
import ChatPage from './Components/ChatPage';
import UpdateProfile from './Components/updateProfile';
import { getEmailFromToken } from './Util/JwtDecode';
import toast from 'react-hot-toast';

const App = () => {
  const infoEmail = getEmailFromToken();
  const init = infoEmail ? infoEmail :'';
  const [emailId, setemailId] = useState(init);
  const navigate = useNavigate();
  const logOutHandler = () => {
    localStorage.removeItem('token');
    navigate('/auth');
    setemailId('');
    toast.success('LogOut Successfully')
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

      <Route path="*" element={  emailId ? <Navigate to={`/chat/${emailId}`} replace /> : <Navigate to={'/auth'} replace /> } />

    </Routes>
  );
};

export default App;
