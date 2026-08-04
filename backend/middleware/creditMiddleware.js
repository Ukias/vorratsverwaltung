import User from '../models/User.js';

function requireCredits(cost) {
  return async (req, res, next) => {
    const user = await User.findById(req.user.id);
    
    if (!user || user.credits < cost || user.credits == undefined) {
      return res.status(402).json({ error: "Nicht genügend Guthaben" });
    }
    
    req.creditCost = cost * 3; // für spätere Nutzung im Handler (eine Anfrage kostet 3 Cent)
    next();
  };
}

export {requireCredits};