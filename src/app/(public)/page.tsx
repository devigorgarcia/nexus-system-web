import { redirect } from "next/navigation";

// Landing institucional (T6.1) fica desligada — a entrada do app é o login.
export default function HomePage() {
  redirect("/login");
}
