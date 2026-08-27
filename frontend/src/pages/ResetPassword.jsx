import * as Yup from "yup";
import api from "../lib/axios";
import {Formik, Form, Field, ErrorMessage} from "formik";
import {useState} from "react";
import toast, { Toaster } from "react-hot-toast"

const ResetPassword = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  return (
    <div className="password-reset-container">
        <h1 className="text-4xl dark:text-white max-w-sm mx-auto my-7">Passwort zurücksetzen</h1>
        {error && (
            <div className="bg-red-200 text-red-700 p-2 mb-4 rounded">
                {error}
            </div>
        )}
        <Formik 
          initialValues = {{
            newPassword: "",
            confirmPassword: "",
          }}
          validationSchema = {Yup.object({
            newPassword: Yup.string().required("Erforderlich").min(6, "Zu kurz!"),
            confirmPassword: Yup.string()
              .oneOf([Yup.ref("newPassword"), null], "Passwörter müssen übereinstimmen.")
              .required("Erforderlich"),
          })}
          onSubmit = {(values) => {
            const { newPassword } = values;
            const token = window.location.pathname.split("/").pop();

            api
              .post(`/reset-password/${token}`, { newPassword })
              .then((response) => {
                toast.success(response.data.message);
                setTimeout(() => {
                  window.location.href = "/login";
                }, 3000);
              })
              .catch((error) => {
                // Auf Status 401 prüfen, nur dann Link abgelaufen
                toast.error("Der Link ist abgelaufen.");
              });
          }}                    
        >
        <Form className="max-w-sm mx-auto">
          <div className="mb-5">
              <label htmlFor="newPassword" className="block mb-2.5 text-sm font-medium text-heading">Passwort:</label>
              <Field 
                  className="bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand block w-full px-3 py-2.5 shadow-xs placeholder:text-body"
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  placeholder="Passwort eingeben"
                  required />
              <ErrorMessage name="newPassword" component="div" class="text-red-500"/>
          </div>
          <div className="mb-5">
              <label htmlFor="confirmPassword" className="block mb-2.5 text-sm font-medium text-heading">Passwort bestätigen</label>
              <Field 
                  className="bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand block w-full px-3 py-2.5 shadow-xs placeholder:text-body"
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="Passwort bestätigen"
                  required />
              <ErrorMessage name="confirmPassword" component="div" class="text-red-500" />
          </div>
          <button type="submit" className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
              {loading ? "Lädt..." : "Passwort ändern"}
          </button>
        </Form>
        </Formik>
    </div>
  );
};

export default ResetPassword;