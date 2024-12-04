import React, { useState } from 'react'
import { TextField, Button, Box, IconButton } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useLocation } from "react-router-dom";
import { useSnackbar } from 'notistack'; 

const ResetPassword = () => {
    const BackendUrl = import.meta.env.VITE_BASE_URL;
    const {type} = useParams();
    let token='';
    const { enqueueSnackbar } = useSnackbar();
    if(type==='Newpass'){
        const location = useLocation();
        const queryParams = new URLSearchParams(location.search);
        token = queryParams.get("token");
        if (!token) {
            enqueueSnackbar("Invalid or missing token", { variant: "error" });
        }
    }
    const [emailId, setEmailid] = useState('');
    const navigate = useNavigate();
    const [pass, setPass] = useState('');
    const [cnfPass, setCnfPass] = useState('');
    const [visibilityPass, setVisibityPass] = useState(false);
    const [visibilityCnfPass, setVisibityCnfPass] = useState(false);

    const resetPassWordHandler = async(e) => {
        e.preventDefault();

        try {
            const response = await fetch(`${BackendUrl}/api/v1/resetPassword`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    emailId:emailId
                }),
              });
          
              // Parse the response as JSON
              const data = await response.json();

            if(data.success){
            toast.success(`${data.message}`);
            navigate("/auth");
            }
            else{
                toast.error(`${data.message}`)
            }

            
        } catch (error) {
            toast.error(`${error}`);
        }
        setEmailid('');
        
    }

    const resetPassWordDBHandler = async (e) => {
        e.preventDefault();
        if(cnfPass !== pass){
            toast.error("Two Password Field password are different");
            return;
        }
        const minLengthPattern = /.{8,}/;
        const uppercasePattern = /[A-Z]/;
        const numberPattern = /[0-9]/;
        const specialCharPattern = /[!@#$%^&*(),.?":{}|<>]/;

        // Check if the password meets all criteria
        if (!minLengthPattern.test(pass)) {
            enqueueSnackbar('Password must be at least 8 characters long', { variant: 'error' });
            return;
        }
        if (!uppercasePattern.test(pass)) {
            enqueueSnackbar('Password must contain at least one uppercase letter.', { variant: 'error' });
            return;
        }
        if (!numberPattern.test(pass)) {
            enqueueSnackbar('Password must contain at least one number.', { variant: 'error' });
            return;
        }
        if (!specialCharPattern.test(pass)) {
            enqueueSnackbar('Password must contain at least one special character.', { variant: 'error' });
            return;
        }
        try {
            const response = await fetch(`${BackendUrl}/api/v1/resetPasswordDB`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token:token,
                    password:cnfPass
                }),
            });
          
            // Parse the response as JSON
            const data = await response.json();
            if(data.success){
                toast.success(`${data.message}`);
                navigate("/auth");
            }
            else{
                toast.error(`${data.message}`);
            }
        } catch (error) {
            toast.error(`${error}`);
        }
        setPass('');
        setCnfPass('');
    }

  return (
    <div className='h-screen w-screen flex justify-center items-center font-Nunito bg-white'>
        {
            type==='Link' && 
            <form onSubmit={resetPassWordHandler} className="flex flex-col gap-5 justify-center items-center p-8 bg-slate-100 rounded-xl w-96 shadow-2xl shadow-black ">
                <TextField
                    type='email'
                    label="Email ID"
                    required
                    variant="outlined"
                    value={emailId}
                    onChange={(e) => setEmailid(e.target.value)}
                    fullWidth
                />
                <Button
                    variant="contained"
                    color="info"
                    type='submit'
                    className="mt-4 w-full font-Nunito"
                >
                Reset PassWord
                </Button>
            </form>
        }
        {
            type==='Newpass' &&
            <form onSubmit={resetPassWordDBHandler} className="flex flex-col gap-5 justify-center items-center p-8 bg-slate-100 rounded-xl w-96 shadow-2xl shadow-black ">
                <Box display="flex" alignItems="center" position="relative" width="100%">
                    <TextField
                        label="Password"
                        id="password"
                        variant="outlined"
                        required
                        type={visibilityPass ? "text" : "password"}
                        value={pass}
                        onChange={(e) => setPass(e.target.value)}
                        fullWidth
                    />
                    <IconButton
                        onClick={()=> setVisibityPass(!visibilityPass)}
                        style={{
                        position: "absolute",
                        right: 10,
                        top: "50%",
                        transform: "translateY(-50%)",
                        }}
                    >
                        {visibilityPass ? <VisibilityIcon /> : <VisibilityOffIcon />}
                    </IconButton>
                </Box>

                <Box display="flex" alignItems="center" position="relative" width="100%">
                    <TextField
                        label="Confirm Password"
                        id='newPass'
                        required
                        variant="outlined"
                        type= {visibilityCnfPass ? 'text' : 'password'}
                        value={cnfPass}
                        onChange={(e) => setCnfPass(e.target.value)}
                        helperText='Password must be at least 8 characters long and include 1 uppercase letter, 1 number, and 1 special character '
                        fullWidth
                    />
                    <IconButton
                        onClick={()=> setVisibityCnfPass(!visibilityCnfPass)}
                        style={{
                        position: "absolute",
                        right: 10,
                        top: "25%",
                        transform: "translateY(-50%)",
                        }}
                    >
                        {visibilityCnfPass ? <VisibilityIcon /> : <VisibilityOffIcon />}
                    </IconButton>
                </Box>
                <Button
                    variant="contained"
                    color="info"
                    type='submit'
                    className="mt-4 w-full font-Nunito"
                >
                Reset PassWord
                </Button>
            </form>
        }
        
    </div>
  )
}

export default ResetPassword
