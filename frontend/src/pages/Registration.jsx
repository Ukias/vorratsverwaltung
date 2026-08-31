// passende Fehlermeldung, wenn User bereits vergeben ist.

import React, {useState} from 'react';
// import {useNavigate} from "react-router"
import api from "../lib/axios";
import {Formik, Form, Field, ErrorMessage} from "formik";
import * as Yup from "yup";
import toast, { Toaster } from "react-hot-toast"

const Registration = () => {
    const [loading, setLoading] = useState(false);

  return (
    <div className="flex flex-col items-center h-screen justify-center bg-gradient-to-b from-green-600 from-50% to-gray-100 to-50% space-y-6">
        <h1 className="text-3xl text-white">Registration</h1>
        <Formik 
          initialValues = {{
            email: "",
            password: "",
          }}
          validationSchema = {Yup.object({
            email: Yup.string().email("Ungültige E-Mail-Adresse").required("Erforderlich"),
            password: Yup.string().required("Erforderlich").min(6, "Zu kurz!"),
          })}
          onSubmit = {(values) => {
            const { email, password } = values;
            api
              .post("/registration", {
                            email, 
                            password
                        })
              .then((response) => {
                toast.success("Registrierung erfolgreich.");
                setTimeout(() => {
                  window.location.href = "/login";
                }, 3000);                
              })
              .catch((error) => {                
                    toast.error("Server error");
              })
              .finally(() => {
                setLoading(false);
              });
          }}
        >        
        <div className="border shadow-lg p-6 w-80 bg-white">
            <Form>
                <div className="mb-4">
                    <label className="block text-gray-700" htmlFor="email">Email</label>
                    <Field 
                        className="w-full px-3 py-2 border"
                        type="email"
                        id="email"
                        name="email"
                        placeholder="E-Mail eingeben"
                        required />
                    <ErrorMessage name="email" component="div" className="text-red-500" />                        
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700" htmlFor="password">Password</label>
                    <Field 
                        className="w-full px-3 py-2 border"
                        type="password"
                        id="password"
                        name="password"
                        placeholder="Passwort eingeben"
                        required />
                    <ErrorMessage name="password" component="div" className="text-red-500" />    
                </div>
                <button 
                    type="submit"
                    className="w-full bg-green-600 text-white py-2">
                    {loading ? "Lädt..." : "Registrieren"}
                </button>
            </Form>
        </div>
        </Formik>
    </div>
  )
}

export default Registration;