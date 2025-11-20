import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export default function WalletConnection() {
    return (
        <div style={{ padding: "20px" }}>
            <WalletMultiButton />
        </div>
    );
}
