import User from '../Models/User.js';

export const checkUser = async (req, res) => {
    try {
        const {emailId} = req.body;
        const response = await User.findOne({emailId:emailId});
        
        if(response){
            response.password=undefined;
            return res.status(200).json({
                success:true,
                response:response,
                message:"User Found"
            })
        }
        else{
            return res.status(404).json({
                success:false,
                message:"User not exists"
            })
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

export const backUpChat = async (req,res)=>{
    try{

    }
    catch(err){
        console.error(err);
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
}