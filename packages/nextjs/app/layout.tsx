import "@rainbow-me/rainbowkit/styles.css";
import "@scaffold-ui/components/styles.css";
import { ClientProviders } from "~~/components/ClientProviders";
import "~~/styles/globals.css";
import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";

export const metadata = getMetadata({
  title: "$DOPPEL Vesting",
  description: "Linear token vesting for $DOPPEL on Base",
});

const ScaffoldEthApp = ({ children }: { children: React.ReactNode }) => {
  return (
    <html suppressHydrationWarning lang="en" className="antialiased" data-theme="dark">
      <body className="min-h-screen bg-bg-primary text-text-primary">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
};

export default ScaffoldEthApp;
