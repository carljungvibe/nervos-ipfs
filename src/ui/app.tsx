/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-use-before-define */
import React, { useEffect, useState } from 'react';
import { create } from 'ipfs-http-client';
import Web3 from 'web3';
import { ToastContainer, toast } from 'react-toastify';
import './app.scss';
import 'react-toastify/dist/ReactToastify.css';
import { PolyjuiceHttpProvider } from '@polyjuice-provider/web3';
import { AddressTranslator } from 'nervos-godwoken-integration';

import { InstagramWrapper } from '../lib/contracts/InstagramWrapper';
import { CONFIG } from '../config';
import NavBar from './components/navbar';
import UploadImage from './components/upload';
import Show from './components/show';

const ipfs = create({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' });

async function createWeb3() {
    // Modern dapp browsers...
    if ((window as any).ethereum) {
        const godwokenRpcUrl = CONFIG.WEB3_PROVIDER_URL;
        const providerConfig = {
            rollupTypeHash: CONFIG.ROLLUP_TYPE_HASH,
            ethAccountLockCodeHash: CONFIG.ETH_ACCOUNT_LOCK_CODE_HASH,
            web3Url: godwokenRpcUrl
        };

        const provider = new PolyjuiceHttpProvider(godwokenRpcUrl, providerConfig);
        const web3 = new Web3(provider || Web3.givenProvider);

        try {
            // Request account access if needed
            await (window as any).ethereum.enable();
        } catch (error) {
            // User denied account access...
        }

        return web3;
    }

    console.log('Non-Ethereum browser detected. You should consider trying MetaMask!');
    return null;
}

export function App() {
    const [web3, setWeb3] = useState<Web3>(null);
    const [contract, setContract] = useState<InstagramWrapper>();
    const [accounts, setAccounts] = useState<string[]>();
    const [l2Balance, setL2Balance] = useState<bigint>();

    const [polyjuiceAddress, setPolyjuiceAddress] = useState<string | undefined>();
    const [transactionInProgress, setTransactionInProgress] = useState(false);
    const toastId = React.useRef(null);
    const [uploadedImage, setUploadedImage] = useState<File[]>();
    const [buffer, setBuffer] = useState<Buffer>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [images, setImages] = useState<any[]>([]);

    useEffect(() => {
        if (accounts?.[0]) {
            const addressTranslator = new AddressTranslator();
            setPolyjuiceAddress(addressTranslator.ethAddressToGodwokenShortAddress(accounts?.[0]));
        } else {
            setPolyjuiceAddress(undefined);
        }
    }, [accounts?.[0]]);

    useEffect(() => {
        if (contract) {
            getImages();
        }
    }, [contract]);
    useEffect(() => {
        if (transactionInProgress && !toastId.current) {
            toastId.current = toast.info(
                'Transaction in progress. Confirm MetaMask signing dialog and please wait...',
                {
                    position: 'top-right',
                    autoClose: false,
                    hideProgressBar: false,
                    closeOnClick: false,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    closeButton: false
                }
            );
        } else if (!transactionInProgress && toastId.current) {
            toast.dismiss(toastId.current);
            toastId.current = null;
        }
    }, [transactionInProgress, toastId.current]);

    const account = accounts?.[0];

    // async function getStoredValue() {
    //     const value = await contract.getStoredValue(account);
    //     toast('Successfully read latest stored value.', { type: 'success' });

    //     setStoredValue(value);
    // }

    // async function setNewStoredValue() {
    //     try {
    //         setTransactionInProgress(true);
    //         await contract.setStoredValue(newStoredNumberInputValue, account);
    //         toast(
    //             'Successfully set latest stored value. You can refresh the read value now manually.',
    //             { type: 'success' }
    //         );
    //     } catch (error) {
    //         console.error(error);
    //         toast.error(
    //             'There was an error sending your transaction. Please check developer console.'
    //         );
    //     } finally {
    //         setTransactionInProgress(false);
    //     }
    // }

    useEffect(() => {
        if (web3) {
            return;
        }

        (async () => {
            const _web3 = await createWeb3();
            setWeb3(_web3);

            const _accounts = [(window as any).ethereum.selectedAddress];
            setAccounts(_accounts);
            console.log({ _accounts });

            const _contract = new InstagramWrapper(_web3);
            setContract(_contract);

            if (_accounts && _accounts[0]) {
                const _l2Balance = BigInt(await _web3.eth.getBalance(_accounts[0]));
                setL2Balance(_l2Balance);
            }
        })();
    });

    const onCaptureFile = (imageList: any) => {
        console.log(imageList);
        setUploadedImage(imageList);

        const file = imageList[0].file as File;
        console.log('FILEE::', file);
        const reader = new window.FileReader();
        reader.readAsArrayBuffer(file);

        reader.onloadend = () => {
            setBuffer(Buffer.from(reader.result));
            console.log('buffer', buffer);
        };
    };

    const uploadImage = async () => {
        if (!buffer) {
            return;
        }
        try {
            setTransactionInProgress(true);
            const ipfsFile = await ipfs.add(buffer);
            console.log('ipfsFile', ipfsFile);

            const hash = ipfsFile.path;

            await contract.uploadImage(hash, 'Nervos coding tips', account);
            toast('Image uploaded successfully to Nervos network 😇 ', { type: 'success' });
            await getImages();
        } catch (error) {
            console.log('IPFS err:', error);
            toast.error(
                'There was an error sending your transaction. Please check developer console. 😠 '
            );
        } finally {
            setTransactionInProgress(false);
        }
    };

    // const LoadingIndicator = () => <span className="rotating-icon">⚙️</span>;

    const getImages = async () => {
        try {
            setLoading(true);
            const _images = [];
            const imageCount = Number(await contract.getImageCount(account));

            for (let i = 1; i <= imageCount; i++) {
                const image = await contract.getImage(i, account);
                _images.push(image);
            }

            setImages(_images);

            // console.log('image', image);
            setLoading(false);
        } catch (error) {
            toast.error('There is an error loading images. Please check developer console. 😠 ');
            setLoading(false);
        }
    };
    const LoadingIndicator = () => (
        <div>
            {' '}
            <span className="rotating-icon">⚙️</span>
            <span>Images loading...</span>
        </div>
    );
    return (
        <div>
            <NavBar
                ethereumAddress={accounts?.[0] || '-'}
                polyjuiceAddress={polyjuiceAddress || ' - '}
                l2Balance={l2Balance}
            />
            <div className="app">
                <UploadImage images={uploadedImage} onChange={onCaptureFile} />
                <button className="btn-upload mt-1 mb-1" onClick={uploadImage}>
                    Share image to Nervos Network 🚀
                </button>
                {loading && <LoadingIndicator />}

                {!loading && <Show images={images} />}
            </div>

            <ToastContainer />
        </div>
    );
}
