"use client";

import { ConfigProvider } from "antd";
import { AntdRegistry } from "@ant-design/nextjs-registry";

// Scoped provider for the Ant Design "enterprise/data-heavy" surfaces only
// (/platform, /product-tour, the analytics product page). Importing this
// only from those components keeps AntD's runtime out of every other
// route's bundle — Next.js code-splits per route, so a page that never
// imports AntdShell never ships AntD JS.
//
// Token values below are the resolved default (light + corporate palette)
// hex values from app/globals.css :root, so first paint matches the site's
// brand even before any live theme/palette bridging is wired.
export function AntdShell({ children }: { children: React.ReactNode }) {
  return (
    <AntdRegistry>
      <ConfigProvider
        theme={{
          cssVar: {},
          token: {
            colorPrimary: "#1F72B4",
            colorSuccess: "#5FA234",
            colorBgContainer: "#FFFFFF",
            colorBgLayout: "#FBFCFE",
            colorBgElevated: "#FFFFFF",
            colorBorder: "#E2E7F1",
            colorBorderSecondary: "#CBD3E4",
            colorText: "#0A0E17",
            colorTextSecondary: "#414B63",
            colorTextTertiary: "#6B7488",
            fontFamily: "var(--font-sans)",
            borderRadius: 10,
          },
        }}
      >
        {children}
      </ConfigProvider>
    </AntdRegistry>
  );
}
