import * as Yup from "yup";
import api from "../lib/axios";
import {Formik, Form, Field, ErrorMessage} from "formik";
import {useState} from "react";
import toast, { Toaster } from "react-hot-toast"

const ForgetPassword = () => {
  const [loading, setLoading] = useState(false);

  return (
    <div className="flex flex-col items-center h-screen justify-center bg-gradient-to-b from-50% to-gray-100 to-50% space-y-6">
        <h1 className="text-3xl text-black">Passwort vergessen</h1>
        <Formik 
          initialValues = {{
            email: "",
          }}
          validationSchema = {Yup.object({
            email: Yup.string().email("Ungültige E-Mail-Adresse").required("Erforderlich"),
          })}
          onSubmit = {(values) => {
            console.log("in onSubmit");
            api
              .post("/forgetPassword", values)
              .then((response) => {
                toast.success("Email erfolgreich gesendet");
                setTimeout(() => {
                  window.location.href = "/login";
                }, 3000);                
              })
              .catch((error) => {
                if (error.response.status === 404) {
                  toast.error("Email nicht gefunden");
                } else {
                  toast.error("Server error");
                }
              });
          }}
        >
        <div className="border shadow-lg p-6 w-80 bg-white">
            {/*({isSubmitting}) => (*/<Form> 
                <div className="mb-4">
                    <label className="block text-gray-700" htmlFor="email">Email</label>
                    <Field 
                        className="w-full px-3 py-2 border"
                        type="email"
                        id="email"
                        name="email"
                        placeholder="john@example.com"
                        required />
                    <ErrorMessage name="email" component="div" className="text-red-500" />
                </div>
                <button 
                    type="submit"
                    className="w-full bg-green-600 text-white py-2">
                    {loading ? "Lädt..." : "Passwort vergessen"}
                </button>
             </Form>
            /*)*/}
          </div>            
        </Formik>
    </div>
  );
};

export default ForgetPassword;