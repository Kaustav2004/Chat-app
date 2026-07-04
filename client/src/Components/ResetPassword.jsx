import React, { useState } from 'react'
import { TextField, Button, Box, IconButton, Typography } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useLocation } from "react-router-dom";
import { useSnackbar } from 'notistack';
import { Mail, Lock, ArrowLeft, Key, ShieldCheck, X, Check } from 'lucide-react';

const ResetPassword = () => {
    const BackendUrl = import.meta.env.VITE_BASE_URL;
    const {type} = useParams();
    let token='';
    const { enqueueSnackbar } = useSnackbar();
    const navigate = useNavigate();
    if(type==='Newpass'){
        const location = useLocation();
        const queryParams = new URLSearchParams(location.search);
        token = queryParams.get("token");
        if (!token) {
            navigate("/");
        }
    }
    const [emailId, setEmailid] = useState('');
    const [pass, setPass] = useState('');
    const [cnfPass, setCnfPass] = useState('');
    const [visibilityPass, setVisibityPass] = useState(false);
    const [visibilityCnfPass, setVisibityCnfPass] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const resetPassWordHandler = async(e) => {
        e.preventDefault();
        setIsLoading(true);
        const toastId = toast.loading("Sending reset link...");

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

            toast.dismiss(toastId);
            if(data.success){
            toast.success(`${data.message}`);
            navigate("/auth");
            }
            else{
                toast.error(`${data.message}`)
            }

            
        } catch (error) {
            toast.dismiss(toastId);
            toast.error(`${error}`);
        } finally {
            setIsLoading(false);
        }
        setEmailid('');
        
    }

      const PasswordRequirement = ({ met, text }) => (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <div style={{
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            backgroundColor: met ? 'rgba(34, 197, 94, 0.15)' : 'rgba(100, 116, 139, 0.1)',
            border: met ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(100, 116, 139, 0.2)',
            flexShrink: 0,
          }}>
            {met ? (
              <Check size={10} style={{ color: '#22C55E' }} />
            ) : (
              <X size={10} style={{ color: '#64748B' }} />
            )}
          </div>
          <span style={{ 
            fontSize: '11px',
            transition: 'all 0.3s',
            color: met ? '#22C55E' : '#64748B',
            fontWeight: met ? 500 : 400,
          }}>
            {text}
          </span>
        </div>
      );

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
        
        setIsLoading(true);
        const toastId = toast.loading("Resetting password...");
        
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
            toast.dismiss(toastId);
            
            if(data.success){
                toast.success(`${data.message}`);
                navigate("/auth");
            }
            else{
                toast.error(`${data.message}`);
            }
        } catch (error) {
            toast.dismiss(toastId);
            toast.error(`${error}`);
        } finally {
            setIsLoading(false);
        }
        setPass('');
        setCnfPass('');
    }

    const inputStyle = {
        width: '100%',
        '& .MuiOutlinedInput-root': {
            backgroundColor: 'rgba(30, 41, 59, 0.4)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '12px',
            color: '#F8FAFC',
            fontSize: '14px',
            fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
            '& fieldset': {
                borderColor: 'rgba(51, 65, 85, 0.4)',
                borderWidth: '1px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            },
            '&:hover fieldset': {
                borderColor: 'rgba(99, 102, 241, 0.4)',
            },
            '&.Mui-focused fieldset': {
                borderColor: '#6366F1',
                borderWidth: '1px',
                boxShadow: '0 0 0 4px rgba(99, 102, 241, 0.1), inset 0 1px 0 rgba(99, 102, 241, 0.1)',
            },
        },
        '& .MuiInputLabel-root': {
            color: '#94A3B8',
            fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
            fontSize: '14px',
            '&.Mui-focused': {
                color: '#818CF8',
            },
        },
        '& .MuiOutlinedInput-input': {
            '&::placeholder': {
                color: '#64748B',
                opacity: 0.7,
            },
        },
        '& .MuiFormHelperText-root': {
            color: '#94A3B8',
            fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
            fontSize: '11px',
            marginTop: '8px',
        },
    };

  return (
    <div style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #0F172A 0%, #111827 50%, #1E293B 100%)',
        padding: '20px',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
    }}>
        {/* Liquid glass background effects */}
        <div style={{
            position: 'absolute',
            top: '-20%',
            left: '-10%',
            width: '600px',
            height: '600px',
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, rgba(99, 102, 241, 0.02) 50%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(60px)',
            animation: 'backgroundOrb1 15s ease-in-out infinite',
        }} />
        <div style={{
            position: 'absolute',
            bottom: '-30%',
            right: '-15%',
            width: '500px',
            height: '500px',
            background: 'radial-gradient(circle, rgba(129, 140, 248, 0.06) 0%, rgba(129, 140, 248, 0.01) 50%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(60px)',
            animation: 'backgroundOrb2 18s ease-in-out infinite',
        }} />
        <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.04) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(50px)',
            animation: 'backgroundOrb3 12s ease-in-out infinite',
        }} />

        {/* Glass grid overlay */}
        <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
                linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
            opacity: 0.3,
        }} />

        {/* Card Container */}
        <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: '440px',
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            border: '1px solid rgba(51, 65, 85, 0.3)',
            borderRadius: '28px',
            padding: '44px',
            boxShadow: '0 30px 80px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(51, 65, 85, 0.3), 0 0 120px rgba(99, 102, 241, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
            animation: 'cardEntry 0.6s cubic-bezier(0.22, 1, 0.36, 1) both',
        }}>
            {/* Glass shine effect */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '1px',
                background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
                zIndex: 3,
            }} />

            {type==='Link' && 
                <form onSubmit={resetPassWordHandler} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '28px',
                    alignItems: 'center',
                }}>
                    <div style={{ textAlign: 'center', width: '100%' }}>
                        <button
                            type="button"
                            onClick={() => navigate('/auth')}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: 'none',
                                border: 'none',
                                color: '#94A3B8',
                                fontSize: '13px',
                                cursor: 'pointer',
                                marginBottom: '28px',
                                padding: '8px 16px',
                                borderRadius: '10px',
                                transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.color = '#F8FAFC';
                                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.color = '#94A3B8';
                                e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                        >
                            <ArrowLeft size={16} />
                            Back to Sign In
                        </button>
                        
                        <Typography style={{
                            fontSize: '24px',
                            fontWeight: 700,
                            color: '#F8FAFC',
                            marginBottom: '10px',
                            fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
                        }}>
                            Forgot Password?
                        </Typography>
                        <Typography style={{
                            fontSize: '14px',
                            color: '#94A3B8',
                            lineHeight: '1.6',
                            fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
                        }}>
                            Enter your email and we'll send you a reset link
                        </Typography>
                    </div>

                    <Box sx={{ position: 'relative', width: '100%' }}>
                        <TextField
                        type='email'
                        label="Email ID"
                        required
                        variant="outlined"
                        value={emailId}
                        onChange={(e) => setEmailid(e.target.value)}
                        fullWidth
                        InputProps={{
                            startAdornment: (
                                <Mail size={16} style={{ 
                                    color: '#94A3B8', 
                                    marginRight: '8px',
                                    marginLeft: '4px',
                                }} />
                            ),
                        }}
                        sx={{
                            ...inputStyle,
                            '& .MuiOutlinedInput-root': {
                                ...inputStyle['& .MuiOutlinedInput-root'],
                                '& input:-webkit-autofill': {
                                    WebkitBoxShadow: '0 0 0 100px rgba(15, 23, 42, 0.5) inset !important',
                                    WebkitTextFillColor: '#F8FAFC !important',
                                    caretColor: '#F8FAFC !important',
                                    borderRadius: '12px',
                                    transition: 'background-color 5000s ease-in-out 0s',
                                },
                                '& input:-webkit-autofill:hover': {
                                    WebkitBoxShadow: '0 0 0 100px rgba(15, 23, 42, 0.5) inset !important',
                                },
                                '& input:-webkit-autofill:focus': {
                                    WebkitBoxShadow: '0 0 0 100px rgba(15, 23, 42, 0.5) inset !important',
                                },
                            },
                        }}
                    />
                    </Box>

                    <button
                        type='submit'
                        disabled={isLoading}
                        style={{
                            width: '100%',
                            height: '48px',
                            background: 'linear-gradient(135deg, #6366F1, #818CF8)',
                            border: 'none',
                            borderRadius: '12px',
                            color: '#F8FAFC',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            boxShadow: '0 8px 25px rgba(99, 102, 241, 0.35)',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            position: 'relative',
                            overflow: 'hidden',
                            fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
                            opacity: isLoading ? 0.7 : 1,
                        }}
                        onMouseEnter={(e) => {
                            if (!isLoading) {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 12px 30px rgba(99, 102, 241, 0.5)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 8px 25px rgba(99, 102, 241, 0.35)';
                        }}
                    >
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
                            transform: 'translateX(-100%)',
                            transition: 'transform 0.5s',
                        }} className="button-shimmer" />
                        Send Reset Link
                    </button>
                </form>
            }
            
            {type==='Newpass' &&
                <form onSubmit={resetPassWordDBHandler} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '24px',
                    alignItems: 'center',
                }}>
                    <div style={{ textAlign: 'center', width: '100%' }}>
                        <Typography style={{
                            fontSize: '24px',
                            fontWeight: 700,
                            color: '#F8FAFC',
                            marginBottom: '10px',
                            fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
                        }}>
                            Set New Password
                        </Typography>
                        <Typography style={{
                            fontSize: '14px',
                            color: '#94A3B8',
                            lineHeight: '1.6',
                            fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
                        }}>
                            Create a strong password for your account
                        </Typography>
                    </div>

                    <Box sx={{ position: 'relative', width: '100%' }}>
                        <TextField
                            label="Password"
                            id="password"
                            variant="outlined"
                            required
                            type={visibilityPass ? "text" : "password"}
                            value={pass}
                            onChange={(e) => setPass(e.target.value)}
                            fullWidth
                            InputProps={{
                            startAdornment: (
                                    <Lock size={16} style={{ 
                                        color: '#94A3B8', 
                                        marginRight: '8px',
                                        marginLeft: '4px',
                                    }} />
                                ),
                            }}
                        sx={{
                            ...inputStyle,
                            '& .MuiOutlinedInput-root': {
                                ...inputStyle['& .MuiOutlinedInput-root'],
                                '& input:-webkit-autofill': {
                                    WebkitBoxShadow: '0 0 0 100px rgba(15, 23, 42, 0.5) inset !important',
                                    WebkitTextFillColor: '#F8FAFC !important',
                                    caretColor: '#F8FAFC !important',
                                    borderRadius: '12px',
                                    transition: 'background-color 5000s ease-in-out 0s',
                                },
                                '& input:-webkit-autofill:hover': {
                                    WebkitBoxShadow: '0 0 0 100px rgba(15, 23, 42, 0.5) inset !important',
                                },
                                '& input:-webkit-autofill:focus': {
                                    WebkitBoxShadow: '0 0 0 100px rgba(15, 23, 42, 0.5) inset !important',
                                },
                            },
                        }}
                        />
                        <IconButton
                            onClick={()=> setVisibityPass(!visibilityPass)}
                            style={{
                                position: "absolute",
                                right: 10,
                                top: "50%",
                                transform: "translateY(-50%)",
                                color: '#94A3B8',
                                zIndex: 1,
                                transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.color = '#818CF8';
                                e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.15)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.color = '#94A3B8';
                                e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                        >
                            {visibilityPass ? <VisibilityIcon /> : <VisibilityOffIcon />}
                        </IconButton>
                    </Box>

                    <Box sx={{ position: 'relative', width: '100%' }}>
                        <TextField
                            label="Confirm Password"
                            id='newPass'
                            required
                            variant="outlined"
                            type={visibilityCnfPass ? 'text' : 'password'}
                            value={cnfPass}
                            onChange={(e) => setCnfPass(e.target.value)}
                            fullWidth
                            InputProps={{
                            startAdornment: (
                                    <Lock size={16} style={{ 
                                        color: '#94A3B8', 
                                        marginRight: '8px',
                                        marginLeft: '4px',
                                    }} />
                                ),
                            }}
                        sx={{
                            ...inputStyle,
                            '& .MuiOutlinedInput-root': {
                                ...inputStyle['& .MuiOutlinedInput-root'],
                                '& input:-webkit-autofill': {
                                    WebkitBoxShadow: '0 0 0 100px rgba(15, 23, 42, 0.5) inset !important',
                                    WebkitTextFillColor: '#F8FAFC !important',
                                    caretColor: '#F8FAFC !important',
                                    borderRadius: '12px',
                                    transition: 'background-color 5000s ease-in-out 0s',
                                },
                                '& input:-webkit-autofill:hover': {
                                    WebkitBoxShadow: '0 0 0 100px rgba(15, 23, 42, 0.5) inset !important',
                                },
                                '& input:-webkit-autofill:focus': {
                                    WebkitBoxShadow: '0 0 0 100px rgba(15, 23, 42, 0.5) inset !important',
                                },
                            },
                        }}
                        />
                        <IconButton
                            onClick={()=> setVisibityCnfPass(!visibilityCnfPass)}
                            style={{
                                position: "absolute",
                                right: 10,
                                top: "25%",
                                transform: "translateY(-50%)",
                                color: '#94A3B8',
                                zIndex: 1,
                                transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.color = '#818CF8';
                                e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.15)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.color = '#94A3B8';
                                e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                        >
                            {visibilityCnfPass ? <VisibilityIcon /> : <VisibilityOffIcon />}
                        </IconButton>
                    </Box>

                    {pass && (
                        <div style={{
                        padding: '10px 14px',
                        borderRadius: '12px',
                        backgroundColor: 'rgba(30, 41, 59, 0.3)',
                        border: '1px solid rgba(51, 65, 85, 0.2)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '5px',
                        transition: 'all 0.3s',
                        backdropFilter: 'blur(10px)',
                        width: '100%'
                        }}>
                        <PasswordRequirement met={pass.length >= 8} text="At least 8 characters" />
                        <PasswordRequirement met={/[A-Z]/.test(pass)} text="One uppercase letter" />
                        <PasswordRequirement met={/[0-9]/.test(pass)} text="One number" />
                        <PasswordRequirement met={/[!@#$%^&*(),.?":{}|<>]/.test(pass)} text="One special character" />
                        </div>
                    )}

                    <button
                        type='submit'
                        disabled={isLoading}
                        style={{
                            width: '100%',
                            height: '48px',
                            background: 'linear-gradient(135deg, #6366F1, #818CF8)',
                            border: 'none',
                            borderRadius: '12px',
                            color: '#F8FAFC',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            boxShadow: '0 8px 25px rgba(99, 102, 241, 0.35)',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            position: 'relative',
                            overflow: 'hidden',
                            fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
                            opacity: isLoading ? 0.7 : 1,
                            marginTop: '4px',
                        }}
                        onMouseEnter={(e) => {
                            if (!isLoading) {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 12px 30px rgba(99, 102, 241, 0.5)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 8px 25px rgba(99, 102, 241, 0.35)';
                        }}
                    >
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
                            transform: 'translateX(-100%)',
                            transition: 'transform 0.5s',
                        }} className="button-shimmer" />
                        Reset Password
                    </button>
                </form>
            }
        </div>

        {/* Animations */}
        <style>{`
            @keyframes backgroundOrb1 {
                0%, 100% { transform: translate(0, 0) scale(1); }
                33% { transform: translate(100px, -50px) scale(1.2); }
                66% { transform: translate(-50px, 50px) scale(0.8); }
            }
            
            @keyframes backgroundOrb2 {
                0%, 100% { transform: translate(0, 0) scale(1); }
                50% { transform: translate(-80px, -40px) scale(1.3); }
            }
            
            @keyframes backgroundOrb3 {
                0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
                50% { transform: translate(-50%, -50%) scale(1.5); opacity: 0.8; }
            }
            
            @keyframes cardEntry {
                from {
                    opacity: 0;
                    transform: translateY(30px) scale(0.95);
                }
                to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }
            
            @keyframes logoPulse {
                0%, 100% { box-shadow: 0 12px 30px rgba(99, 102, 241, 0.4), 0 0 0 0 rgba(99, 102, 241, 0.4); }
                50% { box-shadow: 0 12px 30px rgba(99, 102, 241, 0.4), 0 0 0 15px rgba(99, 102, 241, 0); }
            }
            
            .button-shimmer:hover {
                transform: translateX(100%) !important;
            }
        `}</style>
    </div>
  )
}

export default ResetPassword