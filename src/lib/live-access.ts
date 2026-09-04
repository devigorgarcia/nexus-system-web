import { cookies } from "next/headers";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export type LiveAccess = {
  permissions: string[];
  enabledModules: string[];
};

export async function getLiveAccess(): Promise<LiveAccess | null> {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const fallback: LiveAccess = {
    permissions: session.user.permissions,
    enabledModules: session.user.enabledModules,
  };

  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ");
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
      headers: {
        Cookie: cookieHeader,
        "X-Requested-With": "XMLHttpRequest",
      },
      cache: "no-store",
    });
    if (!response.ok) return fallback;
    const body = (await response.json()) as LiveAccess;
    return {
      permissions: body.permissions ?? fallback.permissions,
      enabledModules: body.enabledModules ?? fallback.enabledModules,
    };
  } catch {
    return fallback;
  }
}
