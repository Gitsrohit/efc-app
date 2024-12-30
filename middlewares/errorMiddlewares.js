// error middleware || NEXT function

const errorMiddleware = (err,req,res,next) => {
    console.log(err);
    const defaulErrors ={
        statusCode :500,
        message: err,
    }
    
    //missing field error
    if(err.name === 'ValidationError'){
        defaulErrors.statusCode = 400
        defaulErrors.message = Object.values(err.errors).map(item => item.message).join(',')
    }

    //duplicate error
    if(err.code && err.code === 11000){
        defaultErrors.statusCode = 400
        defaulErrors.message = `${Object.keys(
            err.keyValue
        )} field has to be unique`;
    }

    res.status(defaulErrors.statusCode).json({message : defaulErrors.message});
};

export default errorMiddleware;