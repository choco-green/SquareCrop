import React, {useEffect, useState} from 'react';
import ReactCrop, {Crop} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css"
import "./styles/index.css"

function App() {
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
