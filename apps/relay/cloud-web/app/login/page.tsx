import { SignInPage } from "@paddy-systems/auth/pages";

export default function LoginPage() {
  return (
    <SignInPage
      productName="Relay"
      defaultRedirect="/account"
      signUpUrl="/register"
    />
  );
}
