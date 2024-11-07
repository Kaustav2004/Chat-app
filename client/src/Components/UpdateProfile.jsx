import { Avatar, CircularProgress, TextField, Button, IconButton, FormHelperText, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import CloseIcon from '@mui/icons-material/Close';
import { useSnackbar } from 'notistack'; 

const UpdateProfile = ({emailIdCurr}) => {
    const {emailId} = useParams();
    const navigate = useNavigate();
    
    const [loading, setloading] = useState(false);
    const [userData,setuserData] = useState('');
    const { enqueueSnackbar } = useSnackbar();
    const [open, setOpen] = useState(false);
    const [loadDp, setloadDp] = useState(false);
    const [fullName,setFullName] = useState('');

    const userDetails = async () => {
        setloading(true);
        try {
            const response = await fetch('http://localhost:3000/api/v1/checkUser', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emailId: emailId })
            });
    
            const data = await response.json();
    
            if(data.success){
                setuserData({
                    profilePic:data.response.profilePhoto,
                    fullName:data.response.fullName,
                    emailId:data.response.emailId
                })
                setFullName(data.response.fullName);
            } else{
                toast.error(`${data.message}`);
            }
    
        } catch (error) {
            toast.error(error);
        }
        setloading(false);
    }

    const handleImageChange = async (event) => {
        setloadDp(true);
        const file = event.target.files[0];
        if (file) {

            const formData = new FormData();
            formData.append('file', file);
            formData.append('emailId', emailId);
            formData.append('prevURL', userData.profilePic);

            // make backend call and recieve url will set on profilePic
            try {
                const response = await fetch('http://localhost:3000/api/v1/imageUpload', {
                    method: 'POST',
                    body: formData,
                });
        
                const data = await response.json();

                setuserData((prevData) => ({
                    ...prevData,
                    profilePic:data.response
                }));

                enqueueSnackbar('Profile picture updated!', { variant: 'success' });

            } catch (error) {
                console.log(error);
            }  

            setloadDp(false);
        }
    };

    const handleDeleteAccount = async () => {
        
        try {
            const response = await fetch('http://localhost:3000/api/v1/deleteAccount', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    emailId: emailId
                }),
            });
    
            const data = await response.json();
            if(data.success){
                localStorage.removeItem(emailId);
                setOpen(false);
                enqueueSnackbar('Account deleted!', { variant: 'warning' });
                navigate('/auth');
            }
        } catch (error) {
            console.log(error);
        }
        setOpen(false);
        
    };

    const updateName = async (req,res) => {
        try {
            const response = await fetch('http://localhost:3000/api/v1/updateName', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    emailId: emailId,
                    fullName : fullName
                }),
            });
    
            const data = await response.json();

            if(data.success){
                enqueueSnackbar('Name Updated', { variant: 'success' });
            }
        } catch (error) {
            console.log(error);
        }
    }
    
    useEffect(() => {
        if(emailId!==emailIdCurr){
            navigate('/auth');
            return;
        }
        userDetails();
    }, [])
    
  return (
    <div>
      {
        loading ? (
            <div className='flex justify-center items-center h-screen'>
                <CircularProgress/>
            </div>
        ):(
            <div className='h-screen w-screen flex justify-center items-center font-Nunito bg-white'>
            <div className="flex flex-col gap-5 justify-center items-start p-8  bg-slate-100 rounded-xl w-96 shadow-2xl shadow-black ">
                
                
                <div className='mb-4 relative'>
                    <IconButton className='absolute top-0 left-72 ' onClick={()=>{
                        navigate(`/chat/${emailId}`);
                    }}>
                        <CloseIcon/>
                    </IconButton>
                    <h1 className='font-RubikWetPaint text-4xl mb-7'>My Profile</h1>
                    <h3 className='font-Nunito text-xl mb-3'>Profile image</h3>
                    <div className='flex justify-center items-center gap-5'>
                        {
                            loadDp &&
                            <CircularProgress/>
                        }
                        <Avatar src={userData.profilePic} sx={{ width: 100, height: 100 }} />
                        <h3 className='cursor-pointer' onClick={() => document.getElementById('imageUpload').click()} >Upload</h3>
                    </div>
                    
                    <input
                        type="file"
                        id="imageUpload"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleImageChange}
                    />
                </div>

                <TextField
                    disabled
                    label="Email ID"
                    variant="outlined"
                    value={userData.emailId}
                    fullWidth
                />

                <TextField
                    label="Name"
                    id='userName'
                    variant="outlined"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    fullWidth
                    helperText='*This name will visible to your contacts'
                />

                <Button
                    variant="contained"
                    color="info"
                    className="mt-4 w-full font-Nunito"
                    onClick={updateName}
                >
                    Update Details
                </Button>

                <Dialog
                    open={open}
                    onClose={()=> setOpen(false)}
                    aria-labelledby="alert-dialog-title"
                    aria-describedby="alert-dialog-description"
                >
                    <DialogTitle id="alert-dialog-title">
                    {"Delete Account Permanently?"}
                    </DialogTitle>
                    <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                       Your all chats will be deleted, nothing can be restored in future
                    </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                    <Button onClick={()=> setOpen(false)} >Disagree</Button>
                    <Button onClick={handleDeleteAccount} color='error'>
                        Agree
                    </Button>
                    </DialogActions>
                </Dialog>

                <Button
                    variant="contained"
                    color="warning"
                    onClick={()=>{setOpen(true)}}
                    className="mt-4 w-full font-Nunito"
                >
                    Delete Account
                </Button>
            </div>
        </div>
        )
      }
    </div>
  )
}

export default UpdateProfile
