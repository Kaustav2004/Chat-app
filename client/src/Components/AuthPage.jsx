import React, { useState, useRef, useEffect } from 'react';
import { CircularProgress, Typography, Box } from '@mui/material';
import { 
  Mail, 
  Lock, 
  User, 
  AtSign,
  ArrowLeft,
  LogIn,
  UserPlus,
  ShieldCheck,
  Eye,
  EyeOff,
  Check,
  X,
  Sparkles,
  Zap,
  MessageSquare,
  Shield,
  Menu,
  X as CloseIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const AuthPage = ({ setemailId }) => {
  const BACKEND_URL = import.meta.env.VITE_BASE_URL;
  const [isLogin, setIsLogin] = useState(true);
  const [isOtpScreen, setIsOtpScreen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showCnfPassword, setShowCnfPassword] = useState(false);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({
    name: "",
    userName: "",
    email: "",
    password: "",
    cnfpassword: ""
  });
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);
  const [formOpacity, setFormOpacity] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileStatic, setShowMobileStatic] = useState(false);
  const otpRefs = [useRef(), useRef(), useRef(), useRef()];
  const navigate = useNavigate();

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleForm = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    
    if (isMobile) {
      // On mobile, just toggle with a fade effect
      setFormOpacity(0);
      setTimeout(() => {
        setIsLogin(!isLogin);
        setIsOtpScreen(false);
        setError("");
        setShowMobileStatic(false);
        setTimeout(() => {
          setFormOpacity(1);
          setIsAnimating(false);
        }, 200);
      }, 300);
    } else {
      // Desktop slide animation
      setFormOpacity(0);
      setTimeout(() => {
        setIsLogin(!isLogin);
        setIsOtpScreen(false);
        setError("");
        
        setTimeout(() => {
          setFormOpacity(1);
          setTimeout(() => {
            setIsAnimating(false);
          }, 450);
        }, 450);
      }, 300);
    }
  };

  // Rest of the handler functions remain the same
  const onChangeLoginHandler = (e) => {
    setLoginData((prevData) => ({
      ...prevData,
      [e.target.name]: e.target.value
    }));
  };

  const onChangeSignUpHandler = (e) => {
    setSignupData((prevData) => ({
      ...prevData,
      [e.target.name]: e.target.value
    }));
  };

  const handleOtpChange = (e, index) => {
    const newOtp = [...otp];
    if (e.target.value.length <= 1 && /^\d*$/.test(e.target.value)) {
      newOtp[index] = e.target.value;
      setOtp(newOtp);
      if (e.target.value && index < otp.length - 1) {
        otpRefs[index + 1].current.focus();
      }
    }
  };

  const handleOtpBackspace = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs[index - 1].current.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    const newOtp = [...otp];
    pastedData.split('').forEach((char, index) => {
      if (index < 4) newOtp[index] = char;
    });
    setOtp(newOtp);
    if (pastedData.length === 4) {
      otpRefs[3].current.focus();
    }
  };

  const loginSubmitHandler = async (e) => {
    e.preventDefault();
    const emailId = loginData.email;
    const toastId = toast.loading("Signing in...");
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/logIn`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailId: loginData.email,
          password: loginData.password,
        }),
      });

      toast.dismiss(toastId);
      
      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.message || 'Login failed');
        return;
      }

      const data = await response.json();

      if (data.success) {
        toast.success('Welcome back!');
        localStorage.setItem('token', data.token);
        setemailId(emailId);
        setTimeout(() => {
          navigate(`/chat/${emailId}`);
        }, 1000);
      } else {
        toast.error(data.message || 'Login failed');
      }
    } catch (err) {
      toast.dismiss(toastId);
      toast.error('Network error. Please try again.');
      console.error(err);
    }

    setLoginData({ email: "", password: "" });
  };

  const signupSubmitHandler = async (e) => {
    e.preventDefault();
    
    if (signupData.password !== signupData.cnfpassword) {
      setError("Passwords do not match");
      return;
    }
    
    const passwordChecks = {
      length: signupData.password.length >= 8,
      uppercase: /[A-Z]/.test(signupData.password),
      number: /[0-9]/.test(signupData.password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(signupData.password)
    };

    if (!Object.values(passwordChecks).every(Boolean)) {
      setError('Password does not meet all requirements');
      return;
    }
    
    setError("");
    setIsLoading(true);
    const toastId = toast.loading("Sending verification code...");
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: signupData.email,
        }),
      });

      toast.dismiss(toastId);
      const data = await response.json();

      if (data.success) {
        toast.success('Verification code sent!');
        sessionStorage.setItem('signupData', JSON.stringify(signupData));
        setIsOtpScreen(true);
      } else {
        toast.error(data.message || 'Failed to send OTP');
      }
    } catch (err) {
      toast.dismiss(toastId);
      toast.error('Network error. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }

    setSignupData({
      name: "",
      userName: "",
      email: "",
      password: "",
      cnfpassword: ""
    });
  };

  const otpSubmitHandler = async (e) => {
    e.preventDefault();
    const otpValue = otp.join("");
    
    if (otpValue.length !== 4) {
      setError("Please enter the complete 4-digit code");
      return;
    }
    
    setError("");
    const data1 = sessionStorage.getItem('signupData');
    const parsedData = JSON.parse(data1);
    
    if (!parsedData) {
      toast.error("Session expired. Please sign up again.");
      setIsOtpScreen(false);
      return;
    }
    
    const toastId = toast.loading("Creating your account...");
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/signUp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: parsedData.name,
          userName: parsedData.userName,
          emailId: parsedData.email,
          password: parsedData.password,
          cnfPassword: parsedData.cnfpassword,
          otp: otpValue
        }),
      });

      toast.dismiss(toastId);

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.message || 'Verification failed');
        return;
      }

      const data = await response.json();

      if (data.success) {
        toast.success('Account created successfully!');
        sessionStorage.removeItem('signupData');
        setIsOtpScreen(false);
        setIsLogin(true);
      } else {
        toast.error(data.message || 'Verification failed');
      }
    } catch (err) {
      toast.dismiss(toastId);
      toast.error('Network error. Please try again.');
      console.error(err);
    }
    
    setOtp(["", "", "", ""]);
  };

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

  const FeatureItem = ({ icon: Icon, title, description, delay }) => (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      padding: '12px 14px',
      borderRadius: '12px',
      background: 'rgba(255, 255, 255, 0.02)',
      border: '1px solid rgba(255, 255, 255, 0.04)',
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      animation: `featureSlideIn 0.5s ease ${delay}ms both`,
      cursor: 'default',
      backdropFilter: 'blur(10px)',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
      e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.2)';
      e.currentTarget.style.transform = 'translateX(4px)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.04)';
      e.currentTarget.style.transform = 'translateX(0)';
    }}
    >
      <div style={{
        width: '38px',
        height: '38px',
        borderRadius: '10px',
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(129, 140, 248, 0.15))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        transition: 'all 0.3s',
        border: '1px solid rgba(99, 102, 241, 0.15)',
      }}>
        <Icon size={18} style={{ color: '#818CF8' }} />
      </div>
      <div style={{ flex: 1 }}>
        <Typography style={{
          fontSize: '13px',
          fontWeight: 600,
          color: '#F8FAFC',
          marginBottom: '3px',
        }}>
          {title}
        </Typography>
        <Typography style={{
          fontSize: '11px',
          color: '#94A3B8',
          lineHeight: '1.5',
        }}>
          {description}
        </Typography>
      </div>
    </div>
  );

  const StaticPanel = ({ isLogin, isAnimating }) => (
    <div style={{
      padding: isMobile ? '32px 24px' : '48px 36px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      height: '100%',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Liquid glass orbs - adjusted for mobile */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        right: '-15%',
        width: isMobile ? '180px' : '250px',
        height: isMobile ? '180px' : '250px',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(129, 140, 248, 0.05) 50%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(30px)',
        animation: 'liquidOrb1 8s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-20%',
        left: '-20%',
        width: isMobile ? '200px' : '300px',
        height: isMobile ? '200px' : '300px',
        background: 'radial-gradient(circle, rgba(129, 140, 248, 0.1) 0%, rgba(99, 102, 241, 0.03) 50%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(40px)',
        animation: 'liquidOrb2 10s ease-in-out infinite',
      }} />
      
      {/* Glass overlay grid */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
        `,
        backgroundSize: isMobile ? '30px 30px' : '40px 40px',
        opacity: 0.5,
      }} />

      <div style={{ position: 'relative', zIndex: 1, opacity: isAnimating ? 0 : 1, }}>
        {/* Logo */}
        <Box sx={{ mb: isMobile ? 2 : 3 }}>
          <Typography
            sx={{
              fontFamily: "Black Ops One",
              fontWeight: 200,
              fontSize: isMobile ? "2rem" : "3rem",
              color: "#fff",
              letterSpacing: "-1px",
              lineHeight: 1,
            }}
          >
            Connekt
          </Typography>
        </Box>

        {/* Welcome Text */}
        <div style={{
          opacity: isAnimating ? 0 : 1,
          transform: isAnimating ? 'translateY(12px)' : 'translateY(0)',
          transition: isAnimating 
            ? 'opacity 0.25s ease, transform 0.25s ease' 
            : 'opacity 0.5s cubic-bezier(0.22, 1, 0.36, 1), transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
        }}>
          <Typography style={{
            fontSize: isMobile ? '22px' : '30px',
            fontWeight: 700,
            color: '#F8FAFC',
            marginBottom: '8px',
            letterSpacing: '-0.5px',
            lineHeight: '1.2',
          }}>
            {!isLogin ? `Let's Get Started` : 'Welcome Back!'}
          </Typography>
          <Typography style={{
            fontSize: isMobile ? '12px' : '14px',
            color: '#94A3B8',
            lineHeight: '1.7',
            marginBottom: isMobile ? '24px' : '40px',
          }}>
            {!isLogin 
              ? 'Create your account and discover a faster, smarter, and more secure way to communicate'
              : 'Continue your conversations where you left off'
            }
          </Typography>
        </div>

        {/* Features - hide on mobile if space is tight */}
        {!isMobile && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            marginBottom: '20px',
            opacity: isAnimating ? 0 : 1,
          }}>
            <FeatureItem 
              icon={Sparkles} 
              title="Simple & Seamless" 
              description="A clean, intuitive chat experience designed for everyone"
            />
            <FeatureItem 
              icon={Zap} 
              title="Instant Messaging" 
              description="Send and receive messages in real time without missing a moment"
            />
            <FeatureItem 
              icon={Shield} 
              title="Secure & Private" 
              description="Secure messaging designed with your privacy in mind"
            />
          </div>
        )}

        {/* Toggle text */}
        <div style={{
          opacity: isAnimating ? 0 : 1,
          transform: isAnimating ? 'translateY(12px)' : 'translateY(0)',
          transition: isAnimating 
            ? 'opacity 0.25s ease, transform 0.25s ease' 
            : 'opacity 0.5s cubic-bezier(0.22, 1, 0.36, 1), transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
        }}>
          <Typography style={{
            fontSize: isMobile ? '12px' : '14px',
            color: '#94A3B8',
            marginBottom: '10px',
            textAlign: 'center'
          }}>
            {!isLogin 
              ? 'Already a member?'
              : 'New to Connekt?'
            }
          </Typography>
        </div>

        {/* Toggle Button */}
        <button
          onClick={toggleForm}
          disabled={isAnimating}
          style={{
            width: '100%',
            padding: isMobile ? '12px 20px' : '14px 24px',
            borderRadius: '14px',
            border: '1.5px solid rgba(129, 140, 248, 0.25)',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(129, 140, 248, 0.05))',
            color: '#F8FAFC',
            fontSize: isMobile ? '13px' : '14px',
            fontWeight: 600,
            cursor: isAnimating ? 'wait' : 'pointer',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            backdropFilter: 'blur(20px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            position: 'relative',
            overflow: 'hidden',
            opacity: isAnimating ? 0 : 1,
          }}
          onMouseEnter={(e) => {
            if (!isAnimating) {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(129, 140, 248, 0.1))';
              e.currentTarget.style.borderColor = 'rgba(129, 140, 248, 0.5)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(99, 102, 241, 0.2)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(129, 140, 248, 0.05))';
            e.currentTarget.style.borderColor = 'rgba(129, 140, 248, 0.25)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.1), transparent)',
            transform: 'translateX(-100%)',
            transition: 'transform 0.6s',
          }} className="button-shimmer" />
          
          {isLogin ? (
            <>
              <UserPlus size={18} />
              Create Account
            </>
          ) : (
            <>
              <LogIn size={18} />
              Sign In
            </>
          )}
        </button>
      </div>
    </div>
  );

  const inputStyle = {
    width: '100%',
    height: '46px',
    paddingLeft: '44px',
    paddingRight: '16px',
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    border: '1px solid rgba(51, 65, 85, 0.4)',
    borderRadius: '12px',
    color: '#F8FAFC',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxSizing: 'border-box',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0F172A 0%, #111827 50%, #1E293B 100%)',
      padding: isMobile ? '12px' : '20px',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
    }}>
      {
        isMobile ?  <Typography
            sx={{
              fontFamily: "Black Ops One",
              marginTop: '10px',
              marginBottom: '8px',
              fontWeight: 200,
              fontSize: isMobile ? "2rem" : "3rem",
              color: "#fff",
              letterSpacing: "-1px",
              lineHeight: 1,
            }}
          >
            Connekt
          </Typography> : null
      }
      {/* Background effects - scaled for mobile */}
      <div style={{
        position: 'absolute',
        top: '-20%',
        left: '-10%',
        width: isMobile ? '300px' : '600px',
        height: isMobile ? '300px' : '600px',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, rgba(99, 102, 241, 0.1) 50%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(60px)',
        animation: 'backgroundOrb1 15s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-30%',
        right: '-15%',
        width: isMobile ? '250px' : '500px',
        height: isMobile ? '250px' : '500px',
        background: 'radial-gradient(circle, rgba(129, 140, 248, 0.1) 0%, rgba(129, 140, 248, 0.1) 50%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(60px)',
        animation: 'backgroundOrb2 18s ease-in-out infinite',
      }} />

      {/* Glass grid overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
        `,
        backgroundSize: isMobile ? '40px 40px' : '60px 60px',
        opacity: 0.3,
      }} />

      {!isOtpScreen ? (
        <div style={{
          position: 'relative',
          width: '100%',
          maxWidth: isMobile ? '100%' : '920px',
          minHeight: isMobile ? 'auto' : '580px',
          display: 'flex',
          overflow: 'hidden',
          borderRadius: isMobile ? '20px' : '28px',
          boxShadow: '0 30px 80px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(51, 65, 85, 0.3), 0 0 120px rgba(99, 102, 241, 0.1)',
          animation: 'cardEntry 0.8s cubic-bezier(0.22, 1, 0.36, 1) both',
        }}>
          <div style={{
            position: 'relative',
            width: '100%',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            border: '1px solid rgba(51, 65, 85, 0.3)',
            borderRadius: isMobile ? '20px' : '28px',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
            overflow: 'hidden',
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

            {/* Mobile Toggle Buttons */}
            {isMobile && (
              <div style={{
                display: 'flex',
                gap: '4px',
                padding: '12px 16px',
                background: 'rgba(30, 41, 59, 0.6)',
                borderBottom: '1px solid rgba(51, 65, 85, 0.3)',
              }}>
                <button
                  onClick={() => {
                    if (!isAnimating && !isLogin) {
                      setFormOpacity(0);
                      setTimeout(() => {
                        setIsLogin(true);
                        setError("");
                        setFormOpacity(1);
                      }, 300);
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '10px',
                    border: 'none',
                    background: isLogin ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                    color: isLogin ? '#F8FAFC' : '#94A3B8',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                  }}
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    if (!isAnimating && isLogin) {
                      setFormOpacity(0);
                      setTimeout(() => {
                        setIsLogin(false);
                        setError("");
                        setFormOpacity(1);
                      }, 300);
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '10px',
                    border: 'none',
                    background: !isLogin ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                    color: !isLogin ? '#F8FAFC' : '#94A3B8',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                  }}
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* Static Panel - Desktop */}
            {!isMobile && (
              <div style={{
                width: '45%',
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(39, 52, 73, 0.6))',
                backdropFilter: 'blur(40px)',
                borderRight: '1px solid rgba(51, 65, 85, 0.3)',
                transform: isLogin ? 'translateX(0)' : 'translateX(122.22%)',
                transition: 'transform 0.85s cubic-bezier(0.76, 0, 0.24, 1)',
                willChange: 'transform',
                position: 'relative',
                zIndex: 2,
              }}>
                <StaticPanel isLogin={isLogin} isAnimating={isAnimating} />
              </div>
            )}

            {/* Form Panel */}
            <div style={{
              width: isMobile ? '100%' : '55%',
              padding: isMobile ? '24px 20px' : '48px 44px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              transform: !isMobile ? (isLogin ? 'translateX(0)' : 'translateX(-81.82%)') : 'none',
              transition: 'transform 0.85s cubic-bezier(0.76, 0, 0.24, 1)',
              willChange: 'transform',
              position: 'relative',
              zIndex: 1,
              minHeight: isMobile ? 'auto' : '580px',
            }}>
              <div style={{
                opacity: formOpacity,
                transition: 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              }}>
                {isLogin ? (
                  // Login Form
                  <form onSubmit={loginSubmitHandler} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: isMobile ? '14px' : '18px',
                  }}>
                    <div style={{ marginBottom: isMobile ? '8px' : '12px' }}>
                      <Typography style={{
                        fontSize: isMobile ? '22px' : '26px',
                        fontWeight: 700,
                        color: '#F8FAFC',
                        marginBottom: '6px',
                        letterSpacing: '-0.5px',
                      }}>
                        Sign In
                      </Typography>
                      <Typography style={{
                        fontSize: isMobile ? '12px' : '13px',
                        color: '#94A3B8',
                        lineHeight: '1.5',
                      }}>
                        Welcome back! Please enter your details
                      </Typography>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '10px' : '14px' }}>
                      <div style={{ position: 'relative' }}>
                        <Mail size={16} style={{
                          position: 'absolute',
                          left: '15px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: '#94A3B8',
                          zIndex: 1,
                          transition: 'color 0.3s',
                        }} />
                        <input
                          type="email"
                          name="email"
                          placeholder="Email address"
                          value={loginData.email}
                          onChange={onChangeLoginHandler}
                          required
                          style={{
                            ...inputStyle,
                            fontSize: isMobile ? '16px' : '13px', // Prevent iOS zoom
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = '#6366F1';
                            e.target.style.boxShadow = '0 0 0 4px rgba(99, 102, 241, 0.1), inset 0 1px 0 rgba(99, 102, 241, 0.1)';
                            e.target.style.backgroundColor = 'rgba(30, 41, 59, 0.6)';
                            e.target.previousSibling.style.color = '#818CF8';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = 'rgba(51, 65, 85, 0.4)';
                            e.target.style.boxShadow = 'none';
                            e.target.style.backgroundColor = 'rgba(30, 41, 59, 0.4)';
                          }}
                        />
                      </div>

                      <div style={{ position: 'relative' }}>
                        <Lock size={16} style={{
                          position: 'absolute',
                          left: '15px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: '#94A3B8',
                          zIndex: 1,
                          transition: 'color 0.3s',
                        }} />
                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          placeholder="Password"
                          value={loginData.password}
                          onChange={onChangeLoginHandler}
                          required
                          style={{ 
                            ...inputStyle, 
                            paddingRight: '46px',
                            fontSize: isMobile ? '16px' : '13px',
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = '#6366F1';
                            e.target.style.boxShadow = '0 0 0 4px rgba(99, 102, 241, 0.1), inset 0 1px 0 rgba(99, 102, 241, 0.1)';
                            e.target.style.backgroundColor = 'rgba(30, 41, 59, 0.6)';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = 'rgba(51, 65, 85, 0.4)';
                            e.target.style.boxShadow = 'none';
                            e.target.style.backgroundColor = 'rgba(30, 41, 59, 0.4)';
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          style={{
                            position: 'absolute',
                            right: '14px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#94A3B8',
                            padding: isMobile ? '10px' : '6px',
                            zIndex: 1,
                            borderRadius: '8px',
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
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div style={{
                      marginLeft: '2px',
                      marginTop: '2px',
                    }}>
                      <button
                        type="button"
                        onClick={() => navigate('/resetPassWord/Link')}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#818CF8',
                          fontSize: isMobile ? '12px' : '12px',
                          cursor: 'pointer',
                          fontWeight: 500,
                          transition: 'color 0.2s',
                          padding: isMobile ? '8px 0' : '0',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#6366F1'}
                        onMouseLeave={(e) => e.currentTarget.style.color = '#818CF8'}
                      >
                        Forgot password?
                      </button>
                    </div>

                    {error && (
                      <div style={{
                        padding: '12px 16px',
                        borderRadius: '12px',
                        backgroundColor: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.15)',
                        animation: 'shake 0.5s ease',
                        backdropFilter: 'blur(10px)',
                      }}>
                        <Typography style={{ color: '#EF4444', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <X size={14} />
                          {error}
                        </Typography>
                      </div>
                    )}

                    <button
                      type="submit"
                      style={{
                        width: '100%',
                        height: isMobile ? '50px' : '48px',
                        background: 'linear-gradient(135deg, #6366F1, #818CF8)',
                        border: 'none',
                        borderRadius: '12px',
                        color: '#F8FAFC',
                        fontFamily: 'Alatsi',
                        fontSize: isMobile ? '18px' : '16px',
                        fontWeight: 400,
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        boxShadow: '0 8px 25px rgba(99, 102, 241, 0.35)',
                        marginTop: '6px',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 12px 30px rgba(99, 102, 241, 0.5)';
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
                      <LogIn size={18} />
                      Sign In
                    </button>

                    {/* Mobile-only toggle link */}
                    {isMobile && (
                      <div style={{ textAlign: 'center', marginTop: '8px' }}>
                        <Typography style={{ fontSize: '13px', color: '#94A3B8' }}>
                          New to Connekt?{' '}
                          <button
                            type="button"
                            onClick={() => {
                              setFormOpacity(0);
                              setTimeout(() => {
                                setIsLogin(false);
                                setFormOpacity(1);
                              }, 300);
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#818CF8',
                              fontSize: '13px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              padding: 0,
                            }}
                          >
                            Create Account
                          </button>
                        </Typography>
                      </div>
                    )}
                  </form>
                ) : (
                  // Signup Form
                  <form onSubmit={signupSubmitHandler} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: isMobile ? '10px' : '12px',
                  }}>
                    <div style={{ marginBottom: isMobile ? '4px' : '8px' }}>
                      <Typography style={{
                        fontSize: isMobile ? '22px' : '26px',
                        fontWeight: 700,
                        color: '#F8FAFC',
                        marginBottom: '6px',
                        letterSpacing: '-0.5px',
                      }}>
                        Create Account
                      </Typography>
                      <Typography style={{
                        fontSize: isMobile ? '12px' : '13px',
                        color: '#94A3B8',
                        lineHeight: '1.5',
                      }}>
                        Join us! Please enter your details
                      </Typography>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '8px' : '10px' }}>
                      {[
                        { icon: User, name: "name", placeholder: "Full name", type: "text", value: signupData.name },
                        { icon: AtSign, name: "userName", placeholder: "Username", type: "text", value: signupData.userName },
                        { icon: Mail, name: "email", placeholder: "Email address", type: "email", value: signupData.email },
                      ].map((field, index) => (
                        <div key={index} style={{ position: 'relative' }}>
                          <field.icon size={16} style={{
                            position: 'absolute',
                            left: '15px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#94A3B8',
                            zIndex: 1,
                          }} />
                          <input
                            type={field.type}
                            name={field.name}
                            placeholder={field.placeholder}
                            value={field.value}
                            onChange={onChangeSignUpHandler}
                            required
                            style={{ 
                              ...inputStyle, 
                              height: isMobile ? '46px' : '44px',
                              fontSize: isMobile ? '16px' : '13px',
                            }}
                            onFocus={(e) => {
                              e.target.style.borderColor = '#6366F1';
                              e.target.style.boxShadow = '0 0 0 4px rgba(99, 102, 241, 0.1), inset 0 1px 0 rgba(99, 102, 241, 0.1)';
                              e.target.style.backgroundColor = 'rgba(30, 41, 59, 0.6)';
                            }}
                            onBlur={(e) => {
                              e.target.style.borderColor = 'rgba(51, 65, 85, 0.4)';
                              e.target.style.boxShadow = 'none';
                              e.target.style.backgroundColor = 'rgba(30, 41, 59, 0.4)';
                            }}
                          />
                        </div>
                      ))}

                      {/* Password fields */}
                      {[
                        { show: showPassword, setShow: setShowPassword, name: "password", placeholder: "Password", value: signupData.password },
                        { show: showCnfPassword, setShow: setShowCnfPassword, name: "cnfpassword", placeholder: "Confirm password", value: signupData.cnfpassword },
                      ].map((field, index) => (
                        <div key={index} style={{ position: 'relative' }}>
                          <Lock size={16} style={{
                            position: 'absolute',
                            left: '15px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#94A3B8',
                            zIndex: 1,
                          }} />
                          <input
                            type={field.show ? "text" : "password"}
                            name={field.name}
                            placeholder={field.placeholder}
                            value={field.value}
                            onChange={onChangeSignUpHandler}
                            required
                            style={{ 
                              ...inputStyle, 
                              height: isMobile ? '46px' : '44px', 
                              paddingRight: '46px',
                              fontSize: isMobile ? '16px' : '13px',
                            }}
                            onFocus={(e) => {
                              e.target.style.borderColor = '#6366F1';
                              e.target.style.boxShadow = '0 0 0 4px rgba(99, 102, 241, 0.1), inset 0 1px 0 rgba(99, 102, 241, 0.1)';
                              e.target.style.backgroundColor = 'rgba(30, 41, 59, 0.6)';
                            }}
                            onBlur={(e) => {
                              e.target.style.borderColor = 'rgba(51, 65, 85, 0.4)';
                              e.target.style.boxShadow = 'none';
                              e.target.style.backgroundColor = 'rgba(30, 41, 59, 0.4)';
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => field.setShow(!field.show)}
                            style={{
                              position: 'absolute',
                              right: '14px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#94A3B8',
                              padding: isMobile ? '10px' : '6px',
                              zIndex: 1,
                              borderRadius: '8px',
                              transition: 'all 0.2s',
                            }}
                          >
                            {field.show ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      ))}
                    </div>

                    {signupData.password && (
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
                      }}>
                        <PasswordRequirement met={signupData.password.length >= 8} text="At least 8 characters" />
                        <PasswordRequirement met={/[A-Z]/.test(signupData.password)} text="One uppercase letter" />
                        <PasswordRequirement met={/[0-9]/.test(signupData.password)} text="One number" />
                        <PasswordRequirement met={/[!@#$%^&*(),.?":{}|<>]/.test(signupData.password)} text="One special character" />
                      </div>
                    )}

                    {error && (
                      <div style={{
                        padding: '12px 16px',
                        borderRadius: '12px',
                        backgroundColor: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.15)',
                        animation: 'shake 0.5s ease',
                        backdropFilter: 'blur(10px)',
                      }}>
                        <Typography style={{ color: '#EF4444', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <X size={14} />
                          {error}
                        </Typography>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading}
                      style={{
                        width: '100%',
                        height: isMobile ? '50px' : '48px',
                        background: 'linear-gradient(135deg, #6366F1, #818CF8)',
                        border: 'none',
                        borderRadius: '12px',
                        color: '#F8FAFC',
                        fontFamily: 'Alatsi',
                        fontSize: isMobile ? '16px' : '18px',
                        fontWeight: 400,
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        boxShadow: '0 8px 25px rgba(99, 102, 241, 0.35)',
                        opacity: isLoading ? 0.7 : 1,
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      {isLoading ? (
                        <CircularProgress size={18} style={{ color: '#F8FAFC' }} />
                      ) : (
                        <>
                          <UserPlus size={18} />
                          Create Account
                        </>
                      )}
                    </button>

                    {/* Mobile-only toggle link */}
                    {isMobile && (
                      <div style={{ textAlign: 'center', marginTop: '4px' }}>
                        <Typography style={{ fontSize: '13px', color: '#94A3B8' }}>
                          Already a member?{' '}
                          <button
                            type="button"
                            onClick={() => {
                              setFormOpacity(0);
                              setTimeout(() => {
                                setIsLogin(true);
                                setFormOpacity(1);
                              }, 300);
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#818CF8',
                              fontSize: '13px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              padding: 0,
                            }}
                          >
                            Sign In
                          </button>
                        </Typography>
                      </div>
                    )}
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        // OTP Screen
        <div style={{
          position: 'relative',
          width: '100%',
          maxWidth: isMobile ? '100%' : '440px',
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          border: '1px solid rgba(51, 65, 85, 0.3)',
          borderRadius: isMobile ? '20px' : '28px',
          padding: isMobile ? '32px 20px' : '44px',
          boxShadow: '0 30px 80px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
          animation: 'cardEntry 0.6s cubic-bezier(0.22, 1, 0.36, 1) both',
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
            zIndex: 3,
          }} />
          
          <form onSubmit={otpSubmitHandler} style={{
            display: 'flex',
            flexDirection: 'column',
            gap: isMobile ? '24px' : '28px',
          }}>
            <div style={{ textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => setIsOtpScreen(false)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  fontSize: '13px',
                  cursor: 'pointer',
                  marginBottom: '28px',
                  padding: isMobile ? '10px 16px' : '8px 16px',
                  borderRadius: '10px',
                  transition: 'all 0.2s',
                }}
              >
                <ArrowLeft size={16} />
                Back to Sign Up
              </button>
              
              <Typography style={{
                fontSize: isMobile ? '20px' : '24px',
                fontWeight: 700,
                color: '#F8FAFC',
                marginBottom: '10px',
              }}>
                Verify your email
              </Typography>
              <Typography style={{
                fontSize: '14px',
                color: '#94A3B8',
                lineHeight: '1.6',
              }}>
                Enter the 4-digit code sent to
              </Typography>
              <Typography style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#818CF8',
                marginTop: '6px',
                wordBreak: 'break-all',
              }}>
                {JSON.parse(sessionStorage.getItem('signupData'))?.email}
              </Typography>
            </div>

            <div 
              style={{ display: 'flex', justifyContent: 'center', gap: isMobile ? '10px' : '14px' }}
              onPaste={handleOtpPaste}
            >
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={otpRefs[index]}
                  type="text"
                  inputMode="numeric"
                  pattern="\d*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(e, index)}
                  onKeyDown={(e) => handleOtpBackspace(e, index)}
                  style={{
                    width: isMobile ? '60px' : '64px',
                    height: isMobile ? '60px' : '64px',
                    backgroundColor: 'rgba(30, 41, 59, 0.4)',
                    border: '1px solid rgba(51, 65, 85, 0.4)',
                    borderRadius: '14px',
                    textAlign: 'center',
                    fontSize: isMobile ? '24px' : '26px',
                    fontWeight: 700,
                    color: '#F8FAFC',
                    outline: 'none',
                    backdropFilter: 'blur(20px)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#6366F1';
                    e.target.style.boxShadow = '0 0 0 4px rgba(99, 102, 241, 0.15), inset 0 1px 0 rgba(99, 102, 241, 0.1)';
                    e.target.style.transform = 'scale(1.05)';
                    e.target.style.backgroundColor = 'rgba(30, 41, 59, 0.6)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(51, 65, 85, 0.4)';
                    e.target.style.boxShadow = 'none';
                    e.target.style.transform = 'scale(1)';
                    e.target.style.backgroundColor = 'rgba(30, 41, 59, 0.4)';
                  }}
                />
              ))}
            </div>

            {error && (
              <div style={{
                padding: '12px 16px',
                borderRadius: '12px',
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.15)',
                animation: 'shake 0.5s ease',
                backdropFilter: 'blur(10px)',
              }}>
                <Typography style={{ color: '#EF4444', fontSize: '12px' }}>{error}</Typography>
              </div>
            )}

            <button
              type="submit"
              style={{
                width: '100%',
                height: isMobile ? '50px' : '48px',
                background: 'linear-gradient(135deg, #6366F1, #818CF8)',
                border: 'none',
                borderRadius: '12px',
                color: '#F8FAFC',
                fontSize: isMobile ? '16px' : '14px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 8px 25px rgba(99, 102, 241, 0.35)',
                transition: 'all 0.3s',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              Verify & Create Account
            </button>

            <Typography style={{
              textAlign: 'center',
              fontSize: '13px',
              color: '#94A3B8',
            }}>
              Didn't receive code?{' '}
              <button
                type="button"
                onClick={signupSubmitHandler}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#818CF8',
                  fontSize: '13px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  padding: isMobile ? '8px 0' : 0,
                  transition: 'color 0.2s',
                }}
              >
                Resend
              </button>
            </Typography>
          </form>
        </div>
      )}

      <style>{`
        @keyframes liquidOrb1 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.8; }
          25% { transform: translate(30px, -20px) scale(1.1); opacity: 0.6; }
          50% { transform: translate(-10px, 10px) scale(0.9); opacity: 0.9; }
          75% { transform: translate(-20px, -15px) scale(1.05); opacity: 0.7; }
        }
        
        @keyframes liquidOrb2 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.7; }
          33% { transform: translate(-20px, 15px) scale(1.15); opacity: 0.5; }
          66% { transform: translate(10px, -10px) scale(0.95); opacity: 0.8; }
        }
        
        @keyframes liquidOrb3 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.6; }
          50% { transform: translate(15px, -15px) scale(1.1); opacity: 0.9; }
        }
        
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
        
        @keyframes featureSlideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        
        .button-shimmer:hover {
          transform: translateX(100%) !important;
        }

        /* Mobile-specific styles */
        @media (max-width: 768px) {
          input {
            -webkit-appearance: none;
            -moz-appearance: none;
            appearance: none;
          }
          
          /* Prevent zoom on iOS */
          input[type="text"],
          input[type="email"],
          input[type="password"] {
            font-size: 16px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AuthPage;