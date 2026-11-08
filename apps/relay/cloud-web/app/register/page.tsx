import { SignUpPage } from "@paddy-systems/auth/pages";

export default function RegisterPage() {
  return (
    <SignUpPage
      productName="Relay"
      defaultRedirect="/account"
      signInUrl="/login"
    />
  );
}
