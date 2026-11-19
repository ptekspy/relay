import { SignUpPage } from "@acme-systems/auth/pages";

export default function RegisterPage() {
  return (
    <SignUpPage
      productName="Relay"
      defaultRedirect="/account"
      signInUrl="/login"
    />
  );
}
