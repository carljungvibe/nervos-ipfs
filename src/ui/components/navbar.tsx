import React from 'react';
import '../styles/navbar.scss';

interface Props {
    ethereumAddress?: string;
    polyjuiceAddress?: string;
    l2Balance?: bigint;
}

// const LoadingIndicator = () => <span className="rotating-icon">⚙️</span>;

function NavBar(props: Props) {
    const { ethereumAddress, polyjuiceAddress } = props;

    return (
        <div className="navbar mb-1">
            <div className="nav-header">
                <h2>Nervos-IPFS Images</h2>
            </div>
            {/* <div className="nav-balance">
                L2 balance: {(l2Balance / 10n ** 8n).toString() || <LoadingIndicator />}
            </div> */}
            <div className="nav-accounts">
                <h4>ETH:</h4> {ethereumAddress}
                <h4>PolyJuice:</h4> {polyjuiceAddress}
            </div>
        </div>
    );
}

export default NavBar;
