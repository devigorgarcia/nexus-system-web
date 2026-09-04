"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch, ApiError } from "@/lib/api-client";

type CreatedCompany = {
  id: string;
  code: string;
  name: string;
  ownerEmail: string;
  emailSent: boolean;
  temporaryPassword?: string;
};

export function NovoClienteScreen() {
  const [name, setName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedCompany | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const result = await apiFetch<CreatedCompany>("/platform/companies", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          ownerName: ownerName.trim(),
          contactEmail: contactEmail.trim(),
          contactPhone: contactPhone.trim() || undefined,
        }),
      });
      setCreated(result);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Erro ao cadastrar o cliente.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (created) {
    return (
      <Card className="max-w-xl p-5">
        <h2 className="font-heading text-lg">{created.name}</h2>
        <p className="mt-1 font-mono text-sm text-muted-foreground">
          {created.code}
        </p>
        {created.emailSent ? (
          <p className="mt-4 text-sm">
            Senha de acesso enviada para{" "}
            <span className="font-medium">{created.ownerEmail}</span>.
          </p>
        ) : (
          <div className="mt-4 space-y-2 text-sm">
            <p>
              Cliente criado, mas o e-mail não saiu (SMTP não configurado).
              Envie esta senha para{" "}
              <span className="font-medium">{created.ownerEmail}</span>:
            </p>
            <p className="rounded-lg border border-border bg-muted px-3 py-2 font-mono text-base">
              {created.temporaryPassword}
            </p>
          </div>
        )}
        <div className="mt-6 flex flex-wrap gap-2">
          <Button render={<Link href="/painel-admin" />}>
            Ver clientes
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setCreated(null);
              setName("");
              setOwnerName("");
              setContactEmail("");
              setContactPhone("");
            }}
          >
            Cadastrar outro
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="max-w-xl p-5">
      <form className="flex flex-col gap-4" onSubmit={(event) => void handleSubmit(event)}>
        <Field
          id="company-name"
          label="Nome da empresa"
          value={name}
          onChange={setName}
          placeholder="Palácio das Velas"
          required
        />
        <Field
          id="owner-name"
          label="Nome do responsável"
          value={ownerName}
          onChange={setOwnerName}
          placeholder="Maria Silva"
          required
        />
        <Field
          id="owner-email"
          label="E-mail de acesso"
          type="email"
          value={contactEmail}
          onChange={setContactEmail}
          placeholder="maria@loja.com"
          required
        />
        <Field
          id="owner-phone"
          label="Telefone"
          value={contactPhone}
          onChange={setContactPhone}
          placeholder="(11) 99999-0000"
        />
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Uma senha é gerada automaticamente e enviada neste e-mail, com o
            link de login.
          </p>
        )}
        <div className="flex gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Cadastrando…" : "Cadastrar e enviar senha"}
          </Button>
          <Button variant="outline" render={<Link href="/painel-admin" />}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
