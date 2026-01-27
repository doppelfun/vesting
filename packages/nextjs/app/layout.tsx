import "@rainbow-me/rainbowkit/styles.css";
import "@scaffold-ui/components/styles.css";
import { ClientProviders } from "~~/components/ClientProviders";
import "~~/styles/globals.css";
import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";

export const metadata = getMetadata({
  title: "$CLAWD Vesting",
  description: "Linear token vesting for $CLAWD on Base",
});

const ScaffoldEthApp = ({ children }: { children: React.ReactNode }) => {
  return (
    <html suppressHydrationWarning className={``} data-theme="dark">
      <body>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
};

export default ScaffoldEthApp;
