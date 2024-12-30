import userModel from "../models/userModel.js";

export const registerController = async (req,res,next) => {
    
        const {name,phone,email,password} = req.body
        //validate
        if(!name){
            next("name is required");
        }
        if(!phone){
            next("phone number is required");
        }
        if(!email){
            next("email is required");
        }
        if(!password){
            next("password is required and should be greater then six character");
        }
        const existingUser = await userModel.findOne({email}) 
        if(existingUser){
            next("Email already registered plaese login");
        }
        const user = await userModel.create({name,phone,email,password})

        //token
        const token = user.createJWT()

        res.status(201).send({
            success:true,
            message:"User created successfully",
            user,
            token,
        });
    
};

export const loginController = async (req,res,next)=>{
    const {email,password} = req.body

    //validation
    if(!email || !password){
        next('Please Provide All Fields')
    }
    //find user by email
    const user = await userModel.findOne({email}).select("+password");//selct function has been used to hide the password
    if(!user){
        next('Invalid Username or Password')
    }
    //compare password
    const isMatch = await user.comparePassword(password)
    if(!isMatch){
        next('Invalid Username or Password');
    }
    user.password = undefined; //this has been done to hide the password
    const token = user.createJWT();
    res.status(200).json({
        success:true,
        message:"LOGIN SUCCESSFULLY",
        user,
        token
    })
};