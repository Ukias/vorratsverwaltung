import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bycrypt from "bcrypt";
import dotenv from "dotenv";
dotenv.config();
import nodemailer from "nodemailer"; // INSTALL

export const forgetPassword = async (req, res) => {
  try {
    // Find the user by email
    const user = await User.findOne({ email: req.body.email });

    // If user not found, send error message
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    // Generate a unique JWT token for the user that contains the user's id
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {expiresIn: "10m",});
    
    // Send the token to the user's email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD_APP_EMAIL,
      },
      connectionTimeout: 10000,
      greetingTimeout: 100000, 
      socketTimeout: 10000,
    });

    // Email configuration (!!! change href of link for production !!!)
    const mailOptions = {
      from: process.env.EMAIL,
      to: req.body.email,
      subject: "Passwort zurücksetzen",
      html: `<h1>Setzen Sie Ihr Passwort zurück</h1>
    <p>Klicken Sie auf folgenden Link, um Ihr Passwort zurückzusetzen:</p>
    <a href="https://vorratsverwaltung.onrender.com/reset-password/${token}">https://vorratsverwaltung.onrender.com/reset-password/${token}</a>
    <p>Der Link ist nur 10 Minuten gültig.</p>
    <p>Wenn Sie Ihr Passwort nicht zurücksetzen möchten, ignorieren Sie diese E-Mail.</p>`,
    };

    console.log("Vor sendMail für: ", req.body.email);
    // Send the email
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error("Fehler beim E-Mail-Versand: ", err);
        return res.status(500).send({ message: err.message });
      }
      console.log("E-Mail erfolgreich gesendet: ", info.response);
      res.status(200).send({ message: "Email gesendet" });
    });
  } catch (err) {
    console.error("Fehler im forgetPassword-Controller", err);
    res.status(500).send({ message: err.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    // Verify the token sent by the user
    const decodedToken = jwt.verify(
      req.params.token,
      process.env.JWT_SECRET
    );

    // If the token is invalid, return an error
    if (!decodedToken) {      
      return res.status(401).send({ message: "Invalid token" });
    }

    // find the user with the id from the token
    const user = await User.findOne({ _id: decodedToken.userId });
    if (!user) {
      return res.status(401).send({ message: "Kein Benutzer gefunden" });
    }
    
    // Hash the new password
    const salt = await bycrypt.genSalt(10);
    req.body.newPassword = await bycrypt.hash(req.body.newPassword, salt);

    // Update user's password, clear reset token and expiration time
    user.password = req.body.newPassword;
    await user.save();

    // Send success response
    res.status(200).send({ message: "Passwort aktualisiert" });
  } catch (err) {
    // Send error response if any error occurs
    res.status(500).send({ message: err.message });
  }
};