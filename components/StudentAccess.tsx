"use client";

import { useState } from "react";
import StudentLogin from "./StudentLogin";
import StudentRegistration from "./StudentRegistration";

export default function StudentAccess() {
  const [tab, setTab] = useState<"login" | "register">("login");

  return (
    <div>
      <div className="access-tabs" role="tablist" aria-label="Student access">
        <button role="tab" aria-selected={tab === "login"} className={tab === "login" ? "at-active" : ""} onClick={() => setTab("login")}>
          Log in
        </button>
        <button role="tab" aria-selected={tab === "register"} className={tab === "register" ? "at-active" : ""} onClick={() => setTab("register")}>
          Register
        </button>
      </div>
      {tab === "login" ? <StudentLogin /> : <StudentRegistration />}
    </div>
  );
}
