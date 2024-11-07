import { jwtDecode } from "jwt-decode";

export const getEmailFromToken = () => {
    const token = localStorage.getItem('token');

    if (token) {
        const decodedToken = jwtDecode(token);
        const time = decodedToken.exp;
        if(time<Math.floor(Date.now() / 1000)){
            localStorage.removeItem('token');
            return null;
        } 
        return decodedToken.email;
    }

    return null;
};
