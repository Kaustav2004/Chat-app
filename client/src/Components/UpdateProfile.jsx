import { Avatar, CircularProgress, TextField, IconButton, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Typography } from '@mui/material';
import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import CloseIcon from '@mui/icons-material/Close';
import { useSnackbar } from 'notistack';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { Camera, User, Mail, Lock, Key, Trash2, ArrowLeft, Check, ShieldCheck, AlertTriangle } from 'lucide-react';

const UpdateProfile = ({ emailIdCurr }) => {
    const BACKEND_URL = import.meta.env.VITE_BASE_URL;
    const { emailId } = useParams();
    const navigate = useNavigate();

    const [loading, setloading] = useState(false);
    const [userData, setuserData] = useState('');
    const { enqueueSnackbar } = useSnackbar();
    const [open, setOpen] = useState(false);
    const [loadDp, setloadDp] = useState(false);
    const [fullName, setFullName] = useState('');
    const [currPass, setCurrPass] = useState('');
    const [newPass, setNewPass] = useState('');
    const [visibilityCurr, setVisibityCurr] = useState(false);
    const [visibilityNew, setVisibityNew] = useState(false);

    const userDetails = async () => {
        setloading(true);
        try {
            const response = await fetch(`${BACKEND_URL}/api/v1/checkUser`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emailId: emailId })
            });

            const data = await response.json();

            if (data.success) {
                setuserData({
                    profilePic: data.response.profilePhoto,
                    fullName: data.response.fullName,
                    emailId: data.response.emailId
                })
                setFullName(data.response.fullName);
            } else {
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
            formData.append('type', 'Personal');
            formData.append('prevURL', userData.profilePic);

            try {
                const response = await fetch(`${BACKEND_URL}/api/v1/imageUpload`, {
                    method: 'POST',
                    body: formData,
                });

                const data = await response.json();

                setuserData((prevData) => ({
                    ...prevData,
                    profilePic: data.response
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
            const response = await fetch(`${BACKEND_URL}/api/v1/deleteAccount`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    emailId: emailId
                }),
            });

            const data = await response.json();
            if (data.success) {
                localStorage.removeItem(emailId);
                localStorage.removeItem('token');
                setOpen(false);
                enqueueSnackbar('Account deleted!', { variant: 'warning' });
                navigate('/auth');
            }
        } catch (error) {
            console.log(error);
        }
        setOpen(false);
    };

    const updateName = async () => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/v1/updateName`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    emailId: emailId,
                    fullName: fullName
                }),
            });

            const data = await response.json();

            if (data.success) {
                enqueueSnackbar('Name Updated', { variant: 'success' });
            }
            else {
                enqueueSnackbar('Try again', { variant: 'error' });
            }
        } catch (error) {
            console.log(error);
        }
    }

    const togglePasswordVisibilityCurr = () => {
        setVisibityCurr(!visibilityCurr);
    };

    const togglePasswordVisibilityNew = () => {
        setVisibityNew(!visibilityNew);
    };

    const updatePassword = async () => {
        const minLengthPattern = /.{8,}/;
        const uppercasePattern = /[A-Z]/;
        const numberPattern = /[0-9]/;
        const specialCharPattern = /[!@#$%^&*(),.?":{}|<>]/;

        if (!minLengthPattern.test(newPass)) {
            enqueueSnackbar('Password must be at least 8 characters long', { variant: 'error' });
            return;
        }
        if (!uppercasePattern.test(newPass)) {
            enqueueSnackbar('Password must contain at least one uppercase letter.', { variant: 'error' });
            return;
        }
        if (!numberPattern.test(newPass)) {
            enqueueSnackbar('Password must contain at least one number.', { variant: 'error' });
            return;
        }
        if (!specialCharPattern.test(newPass)) {
            enqueueSnackbar('Password must contain at least one special character.', { variant: 'error' });
            return;
        }
        try {
            const response = await fetch(`${BACKEND_URL}/api/v1/updatePassword`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    emailId: emailId,
                    prevPass: currPass,
                    newPass: newPass
                }),
            });

            const data = await response.json();

            if (data.success) {
                enqueueSnackbar('Password Updated', { variant: 'success' });
            }
            else {
                enqueueSnackbar(`${data.message}`, { variant: 'error' });
            }
        } catch (error) {
            console.log(error);
        }
    }

    useEffect(() => {
        if (emailId !== emailIdCurr) {
            navigate('/auth');
            return;
        }
        userDetails();
    }, [])

    // Display-only helpers for the live password checklist.
    // These mirror the rules enforced in updatePassword above but do not
    // change validation/submission behavior in any way.
    const passwordChecks = {
        length: /.{8,}/.test(newPass),
        upper: /[A-Z]/.test(newPass),
        number: /[0-9]/.test(newPass),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(newPass),
    };

    const inputStyle = {
        '& .MuiOutlinedInput-root': {
            backgroundColor: 'rgba(15, 21, 36, 0.55)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '12px',
            color: 'var(--aup-text)',
            fontSize: '14px',
            fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
            '& fieldset': {
                borderColor: 'var(--aup-border)',
                borderWidth: '1px',
                transition: 'all 0.3s',
            },
            '&:hover fieldset': {
                borderColor: 'rgba(167, 139, 250, 0.45)',
            },
            '&.Mui-focused fieldset': {
                borderColor: 'var(--aup-accent)',
                borderWidth: '1px',
            },
            '&.Mui-disabled': {
                backgroundColor: 'rgba(15, 21, 36, 0.3)',
                '& fieldset': {
                    borderColor: 'rgba(51, 65, 85, 0.25)',
                },
            },
            '& input.Mui-disabled': {
                WebkitTextFillColor: 'var(--aup-text-dim)',
                color: 'var(--aup-text-dim)',
            },
        },
        '& .MuiInputLabel-root': {
            color: 'var(--aup-text-dim)',
            fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
            fontSize: '14px',
            '&.Mui-focused': {
                color: 'var(--aup-accent-2)',
            },
            '&.Mui-disabled': {
                color: 'var(--aup-text-dimmer)',
            },
        },
        '& .MuiFormHelperText-root': {
            color: 'var(--aup-text-dim)',
            fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
            fontSize: '11px',
            marginTop: '8px',
        },
    };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');

                .aup-page {
                    --aup-bg1: #0A0F1D;
                    --aup-bg2: #111827;
                    --aup-bg3: #161F32;
                    --aup-surface: rgba(30, 41, 59, 0.32);
                    --aup-border: rgba(51, 65, 85, 0.35);
                    --aup-accent: #6366F1;
                    --aup-accent-2: #A78BFA;
                    --aup-text: #F8FAFC;
                    --aup-text-dim: #94A3B8;
                    --aup-text-dimmer: #64748B;
                    --aup-danger: #F87171;
                    --aup-danger-strong: #EF4444;
                    --aup-success: #34D399;

                    min-height: 100vh;
                    width: 100%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    background: linear-gradient(135deg, var(--aup-bg1) 0%, var(--aup-bg2) 50%, var(--aup-bg3) 100%);
                    padding: 24px;
                    position: relative;
                    overflow: hidden;
                    font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
                }
                @media (max-width: 640px) {
                    .aup-page { align-items: flex-start; padding: 14px; }
                }

                .aup-blob { position: absolute; border-radius: 50%; filter: blur(60px); pointer-events: none; }
                .aup-blob-1 {
                    top: -20%; left: -10%; width: 600px; height: 600px;
                    background: radial-gradient(circle, rgba(99, 102, 241, 0.10) 0%, rgba(99, 102, 241, 0.02) 50%, transparent 70%);
                }
                .aup-blob-2 {
                    bottom: -28%; right: -14%; width: 520px; height: 520px;
                    background: radial-gradient(circle, rgba(167, 139, 250, 0.09) 0%, rgba(167, 139, 250, 0.02) 50%, transparent 70%);
                }
                @media (max-width: 640px) {
                    .aup-blob-1 { width: 300px; height: 300px; }
                    .aup-blob-2 { width: 260px; height: 260px; }
                }

                .aup-loading { display: flex; justify-content: center; align-items: center; height: 100vh; }

                .aup-panel {
                    position: relative;
                    width: 100%;
                    max-width: 720px;
                    background: rgba(13, 19, 33, 0.62);
                    backdrop-filter: blur(40px);
                    -webkit-backdrop-filter: blur(40px);
                    border: 1px solid var(--aup-border);
                    border-radius: 28px;
                    padding: 40px;
                    box-shadow: 0 30px 80px rgba(0, 0, 0, 0.45), 0 0 120px rgba(99, 102, 241, 0.10), inset 0 1px 0 rgba(255, 255, 255, 0.05);
                }
                @media (max-width: 640px) {
                    .aup-panel { padding: 22px; border-radius: 20px; }
                }

                .aup-shine {
                    position: absolute; top: 0; left: 0; right: 0; height: 1px;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
                }

                .aup-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 32px; }
                .aup-header-left { display: flex; align-items: center; gap: 10px; }
                .aup-title {
                    font-family: 'Space Grotesk', 'Inter', sans-serif !important;
                    font-size: 24px !important;
                    font-weight: 600 !important;
                    color: var(--aup-text) !important;
                    letter-spacing: -0.01em;
                }
                @media (max-width: 640px) {
                    .aup-header { margin-bottom: 22px; }
                    .aup-title { font-size: 19px !important; }
                }

                .aup-content { display: flex; flex-direction: column; gap: 18px; }

                .aup-card {
                    padding: 26px;
                    background: var(--aup-surface);
                    border-radius: 18px;
                    border: 1px solid rgba(51, 65, 85, 0.22);
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                    opacity: 0;
                    animation: aup-fadeup 0.5s ease forwards;
                }
                .aup-card:nth-child(1) { animation-delay: 0.02s; }
                .aup-card:nth-child(2) { animation-delay: 0.09s; }
                .aup-card:nth-child(3) { animation-delay: 0.16s; }
                @media (max-width: 640px) {
                    .aup-card { padding: 18px; border-radius: 16px; }
                }
                @media (prefers-reduced-motion: reduce) {
                    .aup-card { animation: none; opacity: 1; }
                }

                @keyframes aup-fadeup {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .aup-eyebrow {
                    font-size: 12px;
                    font-weight: 600;
                    letter-spacing: 1.2px;
                    text-transform: uppercase;
                    color: var(--aup-accent-2);
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .aup-identity-grid {
                    display: grid;
                    grid-template-columns: auto 1fr;
                    align-items: center;
                    gap: 28px;
                }
                @media (max-width: 640px) {
                    .aup-identity-grid { grid-template-columns: 1fr; justify-items: center; text-align: center; gap: 18px; }
                }

                .aup-avatar-wrap { position: relative; width: 148px; height: 148px; flex-shrink: 0; }
                @media (max-width: 640px) {
                    .aup-avatar-wrap { width: 108px; height: 108px; }
                }

                .aup-ring {
                    position: absolute; inset: 0; border-radius: 50%;
                    background: conic-gradient(from 0deg, var(--aup-accent), var(--aup-accent-2), var(--aup-accent));
                    animation: aup-spin 9s linear infinite;
                }
                @media (prefers-reduced-motion: reduce) {
                    .aup-ring { animation: none; }
                }
                @keyframes aup-spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                .aup-avatar-inner {
                    position: absolute; inset: 7px; border-radius: 50%;
                    background: var(--aup-bg1);
                    display: flex; align-items: center; justify-content: center;
                    overflow: hidden;
                }

                .aup-avatar-badge {
                    position: absolute; bottom: 0px; right: 0px;
                    width: 38px; height: 38px; border-radius: 50%;
                    background: linear-gradient(135deg, var(--aup-accent), var(--aup-accent-2));
                    border: 3px solid var(--aup-bg1);
                    display: flex; align-items: center; justify-content: center;
                    color: #fff; cursor: pointer;
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                    box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);
                }
                .aup-avatar-badge:hover { transform: scale(1.08); }
                @media (max-width: 640px) {
                    .aup-avatar-badge { width: 32px; height: 32px; }
                }

                .aup-fields { display: flex; flex-direction: column; gap: 14px; width: 100%; }

                .aup-req-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: -2px; }
                .aup-req-chip {
                    display: flex; align-items: center; gap: 5px;
                    font-size: 11.5px; font-weight: 600;
                    padding: 6px 10px; border-radius: 999px;
                    background: rgba(51, 65, 85, 0.32);
                    color: var(--aup-text-dimmer);
                    border: 1px solid rgba(51, 65, 85, 0.4);
                    transition: all 0.25s ease;
                }
                .aup-req-chip.met {
                    background: rgba(52, 211, 153, 0.12);
                    border-color: rgba(52, 211, 153, 0.35);
                    color: var(--aup-success);
                }
                .aup-req-chip svg { opacity: 0.5; }
                .aup-req-chip.met svg { opacity: 1; }

                .aup-danger-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
                .aup-danger-row p { margin: 0; font-size: 13px; line-height: 1.5; color: var(--aup-text-dim); max-width: 360px; }
                @media (max-width: 560px) {
                    .aup-danger-row { flex-direction: column; align-items: stretch; }
                    .aup-danger-row button { width: 100%; }
                }

                .aup-btn-base {
                    font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
                    font-weight: 600;
                    cursor: pointer;
                    border: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    border-radius: 12px;
                    transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease, border-color 0.2s ease;
                }
                .aup-btn-base:focus-visible {
                    outline: 2px solid var(--aup-accent-2);
                    outline-offset: 2px;
                }
                .aup-btn { width: 100%; height: 46px; font-size: 14px; }
                .aup-btn-dialog { padding: 10px 20px; font-size: 13px; border-radius: 10px; }

                .aup-btn-primary {
                    background: linear-gradient(135deg, var(--aup-accent), var(--aup-accent-2));
                    color: var(--aup-text);
                    box-shadow: 0 4px 16px rgba(99, 102, 241, 0.32);
                }
                .aup-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 26px rgba(99, 102, 241, 0.45); }

               .aup-btn-danger {
                    background: linear-gradient(135deg, #EF4444, #DC2626);
                    border: 1px solid rgba(239, 68, 68, 0.5);
                    color: #FFFFFF;
                    box-shadow: 0 4px 14px rgba(239, 68, 68, 0.3);
                }
                .aup-btn-danger:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 24px rgba(239, 68, 68, 0.45);
                    border-color: rgba(239, 68, 68, 0.7);
                }

                .aup-btn-ghost {
                    background: rgba(148, 163, 184, 0.14);
                    border: 1px solid rgba(148, 163, 184, 0.4);
                    color: #E2E8F0;
                }
                .aup-btn-ghost:hover {
                    background: rgba(148, 163, 184, 0.24);
                    border-color: rgba(148, 163, 184, 0.6);
                    color: var(--aup-text);
                }
            `}</style>

            <div className="aup-page">
                <div className="aup-blob aup-blob-1" />
                <div className="aup-blob aup-blob-2" />

                {loading ? (
                    <div className="aup-loading">
                        <CircularProgress sx={{ color: 'var(--aup-accent)' }} />
                    </div>
                ) : (
                    <div className="aup-panel">
                        <div className="aup-shine" />

                        {/* Header */}
                        <div className="aup-header">
                            <div className="aup-header-left">
                                <IconButton
                                    aria-label="Go back"
                                    onClick={() => navigate(`/chat/${emailId}`)}
                                    sx={{
                                        color: 'var(--aup-text-dim)',
                                        padding: '8px',
                                        '&:hover': { color: 'var(--aup-text)', backgroundColor: 'rgba(255,255,255,0.05)' }
                                    }}
                                >
                                    <ArrowLeft size={20} />
                                </IconButton>
                                <Typography className="aup-title" component="h1">
                                    My Profile
                                </Typography>
                            </div>
                            <IconButton
                                aria-label="Close"
                                onClick={() => navigate(`/chat/${emailId}`)}
                                sx={{
                                    color: 'var(--aup-text-dim)',
                                    padding: '8px',
                                    '&:hover': { color: 'var(--aup-text)', backgroundColor: 'rgba(255,255,255,0.05)' }
                                }}
                            >
                                <CloseIcon />
                            </IconButton>
                        </div>

                        <div className="aup-content">
                            {/* Identity */}
                            <section className="aup-card">
                                <span className="aup-eyebrow"><User size={14} /> Identity</span>
                                <div className="aup-identity-grid">
                                    <div className="aup-avatar-wrap">
                                        <div className="aup-ring" />
                                        <div className="aup-avatar-inner">
                                            {loadDp ? (
                                                <CircularProgress size={30} sx={{ color: 'var(--aup-accent)' }} />
                                            ) : (
                                                <Avatar src={userData.profilePic} sx={{ width: '100%', height: '100%' }} />
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            className="aup-avatar-badge"
                                            onClick={() => document.getElementById('imageUpload').click()}
                                            aria-label="Change profile photo"
                                        >
                                            <Camera size={15} />
                                        </button>
                                        <input
                                            type="file"
                                            id="imageUpload"
                                            accept="image/*"
                                            style={{ display: 'none' }}
                                            onChange={handleImageChange}
                                        />
                                    </div>

                                    <div className="aup-fields">
                                        <TextField
                                            disabled
                                            label="Email Address"
                                            variant="outlined"
                                            value={userData.emailId}
                                            fullWidth
                                            InputProps={{
                                                startAdornment: <Mail size={16} style={{ color: '#94A3B8', marginRight: 8, flexShrink: 0 }} />,
                                            }}
                                            sx={inputStyle}
                                        />
                                        <TextField
                                            label="Full Name"
                                            variant="outlined"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            fullWidth
                                            helperText="This name will be visible to your contacts"
                                            InputProps={{
                                                startAdornment: <User size={16} style={{ color: '#94A3B8', marginRight: 8, flexShrink: 0 }} />,
                                            }}
                                            sx={inputStyle}
                                        />
                                        <button className="aup-btn-base aup-btn aup-btn-primary" onClick={updateName}>
                                            Update Details
                                        </button>
                                    </div>
                                </div>
                            </section>

                            {/* Security */}
                            <section className="aup-card">
                                <span className="aup-eyebrow"><ShieldCheck size={14} /> Security</span>

                                <TextField
                                    label="Current Password"
                                    variant="outlined"
                                    type={visibilityCurr ? 'text' : 'password'}
                                    value={currPass}
                                    onChange={(e) => setCurrPass(e.target.value)}
                                    fullWidth
                                    InputProps={{
                                        startAdornment: <Lock size={16} style={{ color: '#94A3B8', marginRight: 8, flexShrink: 0 }} />,
                                        endAdornment: (
                                            <IconButton
                                                aria-label={visibilityCurr ? 'Hide current password' : 'Show current password'}
                                                onClick={togglePasswordVisibilityCurr}
                                                sx={{ color: 'var(--aup-text-dim)', '&:hover': { color: 'var(--aup-accent-2)' } }}
                                            >
                                                {visibilityCurr ? <VisibilityIcon /> : <VisibilityOffIcon />}
                                            </IconButton>
                                        ),
                                    }}
                                    sx={inputStyle}
                                />

                                <TextField
                                    label="New Password"
                                    variant="outlined"
                                    type={visibilityNew ? 'text' : 'password'}
                                    value={newPass}
                                    onChange={(e) => setNewPass(e.target.value)}
                                    fullWidth
                                    InputProps={{
                                        startAdornment: <Key size={16} style={{ color: '#94A3B8', marginRight: 8, flexShrink: 0 }} />,
                                        endAdornment: (
                                            <IconButton
                                                aria-label={visibilityNew ? 'Hide new password' : 'Show new password'}
                                                onClick={togglePasswordVisibilityNew}
                                                sx={{ color: 'var(--aup-text-dim)', '&:hover': { color: 'var(--aup-accent-2)' } }}
                                            >
                                                {visibilityNew ? <VisibilityIcon /> : <VisibilityOffIcon />}
                                            </IconButton>
                                        ),
                                    }}
                                    sx={inputStyle}
                                />

                                <div className="aup-req-row">
                                    <span className={`aup-req-chip ${passwordChecks.length ? 'met' : ''}`}><Check size={12} /> 8+ characters</span>
                                    <span className={`aup-req-chip ${passwordChecks.upper ? 'met' : ''}`}><Check size={12} /> Uppercase</span>
                                    <span className={`aup-req-chip ${passwordChecks.number ? 'met' : ''}`}><Check size={12} /> Number</span>
                                    <span className={`aup-req-chip ${passwordChecks.special ? 'met' : ''}`}><Check size={12} /> Symbol</span>
                                </div>

                                <button className="aup-btn-base aup-btn aup-btn-primary" onClick={updatePassword}>
                                    Update Password
                                </button>
                            </section>

                            {/* Danger Zone */}
                            <section className="aup-card">
                                <span className="aup-eyebrow" style={{ color: 'var(--aup-danger)' }}><AlertTriangle size={14} /> Danger Zone</span>
                                <div className="aup-danger-row">
                                    <p>Permanently delete your account and all chats. This cannot be undone.</p>
                                    <button className="aup-btn-base aup-btn-dialog aup-btn-danger" onClick={() => setOpen(true)}>
                                        <Trash2 size={16} />
                                        Delete Account
                                    </button>
                                </div>
                            </section>
                        </div>

                        {/* Delete Dialog */}
                        <Dialog
                            open={open}
                            onClose={() => setOpen(false)}
                            PaperProps={{
                                style: {
                                    background: 'rgba(13, 19, 33, 0.97)',
                                    backdropFilter: 'blur(40px)',
                                    border: '1px solid rgba(51, 65, 85, 0.3)',
                                    borderRadius: '20px',
                                    boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5)',
                                    margin: '16px',
                                    maxWidth: '420px',
                                }
                            }}
                        >
                            <DialogTitle sx={{
                                color: 'var(--aup-text, #F8FAFC)',
                                fontFamily: "'Space Grotesk', 'Inter', sans-serif",
                                fontSize: '19px',
                                fontWeight: 600,
                            }}>
                                Delete Account Permanently?
                            </DialogTitle>
                            <DialogContent>
                                <DialogContentText sx={{
                                    color: '#94A3B8',
                                    fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
                                    fontSize: '14px',
                                }}>
                                    Your all chats will be deleted, nothing can be restored in future
                                </DialogContentText>
                            </DialogContent>
                            <DialogActions sx={{ padding: '16px 24px', gap: '8px' }}>
                                <button className="aup-btn-base aup-btn-dialog aup-btn-ghost" onClick={() => setOpen(false)}>
                                    Cancel
                                </button>
                                <button className="aup-btn-base aup-btn-dialog aup-btn-danger" onClick={handleDeleteAccount}>
                                    Delete
                                </button>
                            </DialogActions>
                        </Dialog>
                    </div>
                )}
            </div>
        </>
    )
}

export default UpdateProfile