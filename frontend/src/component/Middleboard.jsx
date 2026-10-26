import { Outlet } from "react-router-dom";



export default function MiddleboardLayout() {
  return (


      <div className="w-full min-h-screen max-w-4xl min-w-3xl bg-slate-500 border border-slate-700 rounded-2xl shadow-2xl p-6 sm:p-10 text-slate-100">
        <Outlet/>
       
      </div>

  );
}
