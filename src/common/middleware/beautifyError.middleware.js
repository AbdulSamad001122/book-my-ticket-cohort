const ErroToJson = ((err, req, res, next) => {
    
const statusCode = err.statusCode || 500;
const message = err.message || "Internal server error";


res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    stack: process.env.NODE_ENV === "development" ? err.stack : {}
})
})

export default ErroToJson