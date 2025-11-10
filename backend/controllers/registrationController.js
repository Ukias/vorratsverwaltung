import User from '../models/User.js';
import bcrypt from 'bcrypt';

const register = async (req, res) => {
    try {
        const {email, password} = req.body
        const hashPassword = await bcrypt.hash(password, 10);
        const user = new User({email: email, password: hashPassword, role: "customer"})
        const savedUser = await user.save()
        res.status(201).json(savedUser)
    } catch(error) {
        console.error("Error in register controller");
        res.status(500).json({message:"Internal server error"});
    }
}

export {register};