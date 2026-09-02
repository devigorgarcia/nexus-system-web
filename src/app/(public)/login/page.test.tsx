import { render, screen } from "@testing-library/react";
import LoginPage from "./page";

// `next/navigation` exige um App Router de verdade em runtime — mockado aqui
// porque este teste só renderiza o formulário, não exercita o submit real
// (isso é o Playwright em e2e/login.spec.ts).
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

describe("LoginPage", () => {
  it("renders the login form", () => {
    render(<LoginPage />);

    expect(screen.getByLabelText("Usuário")).toBeInTheDocument();
    expect(screen.getByLabelText("Senha")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Entrar" })).toBeInTheDocument();
  });
});
