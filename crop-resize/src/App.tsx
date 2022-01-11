import React, {useEffect, useState} from 'react';
import ReactCrop, {Crop} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css"
import "./styles/index.css"

function App() {
    const [counter, setCounter] = useState<number>(0);
    const [srcImg, selectFile] = useState<string>();
    const [image, setImage] = useState<HTMLImageElement>();
    const [crop, setCrop] = useState<Crop>({
        aspect: 1,
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        unit: 'px' });
    const [result, setResult] = useState<string>();

    useEffect(() => {
        selectFile(require("./images/0.jpg"));
    }, [])

    const getCroppedImg = async () => {
        if (!image) return <div>error</div>;
        try {
            const canvas = document.createElement("canvas");
            const scaleX = image.naturalWidth / image.width;
            const scaleY = image.naturalHeight / image.height;
            canvas.width = crop.width;
            canvas.height = crop.height;
            const ctx = canvas.getContext("2d");
            ctx?.drawImage(
                image,
                crop.x * scaleX,
                crop.y * scaleY,
                crop.width * scaleX,
                crop.height * scaleY,
                0,
                0,
                crop.width,
                crop.height
            );

            const base64Image = canvas.toDataURL("image/jpeg", 1);
            setResult(base64Image);
            console.log(result);
        } catch (e) {
            console.log("crop the image");
        }
    };

    return (
            <div className="App flex content-center flex-col">
                <div className="flex flex-grow flex-row justify-center">
                    <button className="text-center bg-blue-400 p-5 rounded-2xl text-white flex-grow-0 ml-20" onClick={ () => {
                        setCounter(counter - 1)
                        selectFile(require(`./images/${counter - 1}.jpg`));
                    }}>
                        Previous Image
                    </button>
                    <div className="flex-grow"/>
                    <button className="text-center bg-blue-400 p-5 rounded-2xl text-white flex-grow-0 mr-20" onClick={ () => {
                        setCounter(counter + 1);
                        selectFile(require(`./images/${counter + 1}.jpg`));
                    }}>
                        Next Image
                    </button>
                </div>
                <div className="m-auto">{`attempting to load ${counter}.jpg`}</div>
                <ReactCrop className="m-auto" src={srcImg as string} crop={crop} onChange={setCrop} onImageLoaded={setImage}/>
                <button className="text-center bg-blue-400 p-5 rounded-2xl text-white m-auto" onClick={getCroppedImg}>
                    Crop Image
                </button>
                <img className="m-auto w-[128px] h-[128px]" src={result} alt="Cropped" />
            </div>
    );
}

export default App;
