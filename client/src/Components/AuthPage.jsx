import React, { useState, useRef } from 'react';
import { Button, TextField, Typography, CircularProgress, Box } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const AuthPage = ({setemailId}) => {
  const [isLogin, setIsLogin] = useState(true); // Toggle between login and signup
  const [isOtpScreen, setIsOtpScreen] = useState(false); // Toggle between signup and OTP screens
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({
    name: "",
    userName: "",
    email: "",
    password: "",
    cnfpassword: ""
  });
  const [otp, setOtp] = useState(["", "", "", ""]); // OTP input state as an array
  const [isLoading, setIsLoading] = useState(false); // Loading state
  const [error, setError] = useState(""); // Error handling
  const otpRefs = [useRef(), useRef(), useRef(), useRef()]; // Refs for OTP input fields
  const navigate = useNavigate();

  const toggleForm = () => {
    setIsLogin(!isLogin);
    setIsOtpScreen(false); // Reset OTP screen when switching forms
    setError("");
  };

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
    if (e.target.value.length <= 1) {
      newOtp[index] = e.target.value;
      setOtp(newOtp);
      if (e.target.value && index < otp.length - 1) {
        otpRefs[index + 1].current.focus(); // Automatically move to next box
      }
    }
  };

  const handleOtpBackspace = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs[index - 1].current.focus(); // Move to previous box on backspace
    }
  };

  // Handle login submission
  const loginSubmitHandler = async (e) => {
    e.preventDefault();
    const emailId = loginData.email;
  
    try {
      const response = await fetch('http://localhost:3000/api/v1/logIn', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailId: loginData.email,
          password: loginData.password,
        }),
      });
  
      // Check if the response is OK (status code 200-299)
      if (!response.ok) {
        const errorData = await response.json();
        toast.error(`${errorData.message}`);
        return;
      }
  
      // Parse the response as JSON
      const data = await response.json();
  
      // Check for success in the response data
      if (data.success) {
        toast.success(`${data.message}`);

        localStorage.setItem('token', data.token);
        setemailId(emailId);
        // Delay navigation to allow toast to be displayed
        setTimeout(() => {
          navigate(`/chat/${emailId}`);
        }, 2000); // Adjust the delay time as needed (2000ms)
      } else {
        toast.error(`${data.message}`);
      }
    } catch (err) {
      toast.error('An error occurred during login.');
      console.log(err);
    }
  
    // Reset the form state after submission
    setLoginData({ email: "", password: "" });
  };
  
  // Handle signup submission
  const signupSubmitHandler = async(e) => {
    e.preventDefault();
    if (signupData.password !== signupData.cnfpassword) {
      setError("Passwords do not match!");
      return;
    }
    const minLengthPattern = /.{8,}/;
    const uppercasePattern = /[A-Z]/;
    const numberPattern = /[0-9]/;
    const specialCharPattern = /[!@#$%^&*(),.?":{}|<>]/;

    // Check if the password meets all criteria
    if (!minLengthPattern.test(signupData.password)) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (!uppercasePattern.test(signupData.password)) {
        setError ('Password must contain at least one uppercase letter.');
        return;
    }
    if (!numberPattern.test(signupData.password)) {
        setError ('Password must contain at least one number.');
        return;
    }
    if (!specialCharPattern.test(signupData.password)) {
        setError ('Password must contain at least one special character.');
         return;
    }
    setError("");
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/v1/otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email:signupData.email,
        }),
      });
  
      // Parse the response as JSON
      const data = await response.json();
  
      // Check for success in the response data
      if (data.success) {
        toast.success(`${data.message}`);
        // store in local and will access in time to verify otp
        sessionStorage.setItem('signupData', JSON.stringify(signupData));
        setIsLoading(false);
        setIsOtpScreen(true);
      } else {
        toast.error(`${data.message}`);
        setIsLoading(false);
      }
    } catch (err) {
      toast.error('An error occurred during login.');
      console.log(err);
      setIsLoading(false);
      return;
    }
    
    setSignupData({
      name: "",
      userName: "",
      email: "",
      password: "",
      cnfpassword: ""
    });
    
  };

  // Handle OTP submission
  const otpSubmitHandler = async(e) => {
    e.preventDefault();
    const otpValue = otp.join(""); // Combine all 4 OTP boxes into a single string
    if (otpValue.length !== 4) {
      setError("Invalid OTP. Please enter a 4-digit OTP.");
      return;
    }
    setError("");
    const data1 = sessionStorage.getItem('signupData');
    const parsedData = JSON.parse(data1);
    if(!parsedData){
      toast.error("Sign Up Again");
    }
    try {
      const response = await fetch('http://localhost:3000/api/v1/signUp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name:parsedData.name,
          userName:parsedData.userName,
          emailId:parsedData.email,
          password:parsedData.password,
          cnfPassword:parsedData.cnfpassword,
          otp:otpValue
        }),
      });
  
      // Check if the response is OK (status code 200-299)
      if (!response.ok) {
        const errorData = await response.json();
        toast.error(`${errorData.message}`);
        return;
      }
  
      // Parse the response as JSON
      const data = await response.json();
  
      // Check for success in the response data
      if (data.success) {
        toast.success(`${data.message}`);
  
        setIsOtpScreen(false);
        setIsLogin(true);
      } else {
        toast.error(`${data.message}`);
      }
    } catch (err) {
      toast.error(`${err}`);
      console.log(err);
    }
    // setIsOtpScreen(false);
    // setIsLogin(true);
    setOtp(["", "", "", ""]); // Reset OTP
    // Proceed with navigation or next step after OTP verification
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full h-fit max-w-md bg-white rounded-lg shadow-md p-8 ">
        {!isOtpScreen ? (
          isLogin ? (
            // Login form
            <form className="space-y-4" onSubmit={loginSubmitHandler}>
              <Typography variant="h4" className="text-center mb-4">Login</Typography>
              <TextField
                fullWidth
                required
                name="email"
                label="Email"
                type="email"
                onChange={onChangeLoginHandler}
                value={loginData.email}
                variant="outlined"
                className="mb-4"
              />
              <TextField
                fullWidth
                required
                name="password"
                label="Password"
                type="password"
                onChange={onChangeLoginHandler}
                value={loginData.password}
                variant="outlined"
                className="mb-4"
              />

              <p onClick={()=>navigate('/resetPassWord/Link')} className='text-blue-400 text-sm ml-2 cursor-pointer hover:text-blue-500 hover:underline' >Reset Password</p>

              {error && <Typography color="error">{error}</Typography>}
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                className="transition-colors duration-500 hover:bg-blue-600"
              >
                Login
              </Button>
            </form>
          ) : (
            // Signup form
            <form className="space-y-4" onSubmit={signupSubmitHandler}>
              <Typography variant="h4" className="text-center mb-4">Sign Up</Typography>
              <TextField
                fullWidth
                required
                name="name"
                label="Full Name"
                variant="outlined"
                onChange={onChangeSignUpHandler}
                value={signupData.name}
                className="mb-4"
              />
              <TextField
                fullWidth
                required
                name="userName"
                label="UserName"
                variant="outlined"
                onChange={onChangeSignUpHandler}
                value={signupData.userName}
                className="mb-4"
              />
              <TextField
                fullWidth
                required
                name="email"
                label="Email"
                type="email"
                variant="outlined"
                onChange={onChangeSignUpHandler}
                value={signupData.email}
                className="mb-4"
              />
              <TextField
                fullWidth
                required
                name="password"
                label="Password"
                type="password"
                variant="outlined"
                helperText='Password must be at least 8 characters long and include 1 uppercase letter, 1 number, and 1 special character '
                onChange={onChangeSignUpHandler}
                value={signupData.password}
                className="mb-4"
              />
              <TextField
                fullWidth
                required
                name="cnfpassword"
                label="Confirm Password"
                type="password"
                variant="outlined"
                onChange={onChangeSignUpHandler}
                value={signupData.cnfpassword}
                className="mb-4"
              />
              {error && <Typography color="error">{error}</Typography>}
              <Button
                variant="contained"
                color="primary"
                fullWidth
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? <CircularProgress size={24} /> : "Sign Up"}
              </Button>
            </form>
          )
        ) : (
          // OTP form (displayed after successful signup)
          <form className="space-y-4" onSubmit={otpSubmitHandler}>
            <Typography variant="h4" className="text-center mb-4">Verify OTP</Typography>

            {/* OTP Input with individual boxes */}
            <Box display="flex" justifyContent="space-between" >
              {otp.map((digit, index) => (
                <TextField
                 
                  key={index}
                  value={digit}
                  onChange={(e) => handleOtpChange(e, index)}
                  onKeyDown={(e) => handleOtpBackspace(e, index)}
                  slotProps={{
                    // Use slotProps to customize the HTML input element
                    input: {
                      maxLength: 1, // Limit to one digit
                      style: { fontSize: '22px'},
                    }
                  }}
                  inputRef={otpRefs[index]}
                  variant="outlined"
                  
                  style={{ width: '60px' }}
                />
              ))}
            </Box>

            {error && <Typography color="error">{error}</Typography>}
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
            >
              Verify OTP
            </Button>
          </form>
        )}

        {/* Switch between Login and Signup */}
        <div className="absolute bottom-0 left-0 right-0 text-center">
          <Typography variant="body2">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <Button
              variant="text"
              color="primary"
              onClick={toggleForm}
              className="ml-2"
            >
              {isLogin ? "Sign Up" : "Login"}
            </Button>
          </Typography>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
