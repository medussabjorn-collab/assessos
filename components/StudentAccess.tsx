"use client";

import { useState, type SyntheticEvent } from "react";
import { Tabs, Tab } from "@mui/material";
import { MuiShell } from "./mui/MuiShell";
import StudentLogin from "./StudentLogin";
import StudentRegistration from "./StudentRegistration";

export default function StudentAccess() {
  const [tab, setTab] = useState<"login" | "register">("login");

  function onChange(_e: SyntheticEvent, value: "login" | "register") {
    setTab(value);
  }

  return (
    <MuiShell>
      <div>
        <Tabs value={tab} onChange={onChange} aria-label="Student access">
          <Tab value="login" label="Log in" />
          <Tab value="register" label="Register" />
        </Tabs>
        {tab === "login" ? <StudentLogin /> : <StudentRegistration />}
      </div>
    </MuiShell>
  );
}
