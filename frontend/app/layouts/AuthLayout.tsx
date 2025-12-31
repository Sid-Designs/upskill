import React from "react";
import '@/public/styles/AuthLayout.css';

type AuthLayoutProps = {
    children: React.ReactNode;
};

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
    return (
        <div className="w-[100vw] h-[100vh] flex flex-col justify-center items-center authLayout">
            <div className="authContainer flex flex-col justify-center items-center" style={{marginTop: "8vh"}}>
                {children}
            </div>
        </div>
    );
};

export default AuthLayout;
