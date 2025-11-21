import ratelimit from "../config/upstash.js"

const rateLimiter = async (req, res,next) => {
    try {
        // console.log("req.user:", req.user); 
        const {success} = await ratelimit.limit(req.user?.id || req.ip)

        if(!success) {
            return res.status(429).json({
                message: "Too many requests, please try again later"
            });
        }

        next();
    } catch(error) {
        console.log("Rate limit error", error);
        next(error);
    }
}

export default rateLimiter;