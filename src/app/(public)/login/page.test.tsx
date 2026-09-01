import { render, screen } from "@testing-library/react";
import LoginPage from "./page";

describe("LoginPage", () => {
  it("renders the login form", () => {
    render(<LoginPage />);

    expect(screen.getByLabelText("Usuário")).toBeInTheDocument();
    expect(screen.getByLabelText("Senha")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Entrar" })).toBeInTheDocument();
  });
});
