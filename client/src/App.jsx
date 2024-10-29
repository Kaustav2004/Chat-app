import React, { useEffect, useState } from 'react';
import AuthPage from './Components/AuthPage';
import { Route,Routes,useNavigate } from 'react-router-dom';
import ChatPage from './Components/ChatPage';
import UpdateProfile from './Components/updateProfile';

const App = () => {
  const [userId, setUserId] = useState("");
  const [socket, setSocket] = useState(null);

  // useEffect(() => {
    
  //   const newSocket = io("http://localhost:3000");

  //   // Log connection status and set userId
  //   newSocket.on('connect', () => {
  //     setUserId(newSocket.id);
  //     console.log('Connected to the server with id:', newSocket.id);
  //   });

  //   newSocket.on('disconnect', () => {
  //     console.log('Disconnected from the server');
  //   });

  //   newSocket.on('connect_error', (err) => {
  //     console.error('Connection Error:', err);
  //   });

  //   // Set socket in state
  //   setSocket(newSocket);

  //   return () => {
  //     newSocket.disconnect();
  //   };
  // }, []);

  return (
    <div>
      
      <Routes>
        <Route path='/auth' element={<AuthPage/>}/>
        <Route path="/chat/:emailId" element={<ChatPage/> }/>
        <Route path="/:emailId/updateDetails" element={<UpdateProfile/>} />
        <Route path="*" element={<div>NO PAGE</div>} />
      </Routes>


    </div>
  );
};

export default App;
