import React, { useRef, useEffect, useState } from 'react'
import type { NextPage } from 'next'
import styles from '../styles/Home.module.scss'

import * as bodySegmentation from '@tensorflow-models/body-segmentation';
import '@tensorflow/tfjs-backend-webgl';
import Head from 'next/head';
import Script from 'next/script';

const r=0, g=1, b=2,a=3;

const Home: NextPage = () => {
  const [processing, setProcessing] = useState<boolean>(false);
  const [quantizedHexArray, setQuantizedHexArray] = useState<string[]>([]);

  const [exec, setExec] = useState<number | null>(null);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);

  // mike-von-YsiSAp3ccvk-unsplash
  const [url, setUrl] = useState<string>("https://i.imgur.com/M5QR39R.png");

  // https://google.github.io/mediapipe/solutions/selfie_segmentation.html
  //const model = bodySegmentation.SupportedModels.MediaPipeSelfieSegmentation;

  // https://blog.tensorflow.org/2019/11/updated-bodypix-2.html
  // Current prefer this model as it provides a more "magazine clipping" look
  // Selfie segmentation is intended to be used with heavy edge blurring for live video conferencing
  const model = bodySegmentation.SupportedModels.BodyPix;

  // TODO: Need to mess around with this
  const bodyPixConfig: any = {
    architecture: 'ResNet50',
    multiplier: 1,
    multiSegmentation: false,
    segmentBodyParts: true,
    modelType: "general"
  }

  useEffect(() => {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;

    if (imageLoaded){
      setProcessing(true);

      bodySegmentation.createSegmenter(model, bodyPixConfig).then(async (segmenter) => {
        var startTime = performance.now()

        console.log("Begin image processing");

        var ctx = canvas.getContext('2d')!;
        var imageData = ctx.getImageData(0,0, canvas.width, canvas.height);

        // PixelInput = Tensor3D | ImageData | HTMLVideoElement | HTMLImageElement | HTMLCanvasElement | ImageBitmap;
        const segmentation = await segmenter.segmentPeople(imageData, bodyPixConfig);
        console.log("Segmentation completed")

        const foregroundColor = {r: 255, g: 255, b: 255, a: 0};
        const backgroundColor = {r: 255, g: 255, b: 255, a: 255};
        const backgroundDarkeningMask = await bodySegmentation.toBinaryMask(
            segmentation, foregroundColor, backgroundColor);

        const opacity = 1;
        const maskBlurAmount = 0; // range [0,20], default: 0
        const flipHorizontal = false;

        // await bodySegmentation.drawBokehEffect(canvas, image, segmentation);
        await bodySegmentation.drawMask(
          canvas, imageData, backgroundDarkeningMask, opacity, maskBlurAmount, flipHorizontal);

        ctx = canvas.getContext('2d')!;
        imageData = ctx.getImageData(0,0, canvas.width, canvas.height);

        const pixel = imageData.data;
        let rgbArray = []

        for (var p = 0; p<pixel.length; p+=4)
        {
          if ( // White pixel
              pixel[p+r] == 255 &&
              pixel[p+g] == 255 &&
              pixel[p+b] == 255)
          {
            pixel[p+a] = 0; // Make transparent
          }
          else {
            // Build [[R,G,B], ..., n] array for colour quantization
            rgbArray.push([pixel[p+r], pixel[p+g], pixel[p+b]]);
          }
        }

        ctx.putImageData(imageData,0,0);

        console.log("Begin quantization");
        const quantize = require('quantize');
        const colorMap = quantize(rgbArray, 6);
        const quantizedResult: number[][] = colorMap.palette();

        let bufferQuantizedHexArray: string[] = []
        quantizedResult.forEach((rgb) => {
          bufferQuantizedHexArray.push(rgbToHex(rgb[0], rgb[1], rgb[2]));
        })

        setQuantizedHexArray(bufferQuantizedHexArray);
        console.log(bufferQuantizedHexArray);

        setProcessing(false);
        setImageLoaded(false);

        var endTime = performance.now()
        setExec(endTime - startTime);
      });
    }
  }, [imageLoaded]);

  const loadImage = (event: React.ChangeEvent<HTMLInputElement> | null, src: string | null) => {
    var img: HTMLImageElement = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      var canvas = document.getElementById('canvas') as HTMLCanvasElement;

      canvas.width = (500);
      canvas.height = ((500/img.width) * img.height);

      var ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0,0, canvas.width, canvas.height);
    };
    img.onerror = () => alert("The provided src couldn't be loaded");

    img.src = src == null ? URL.createObjectURL(event!.target.files![0]) : src;

    setImageLoaded(true);
  }

  return (
    <div className={styles.container}><br/>
      {/* <Head>
        <script src="https://coolors.co/palette-widget/widget.js"></script>
      </Head> */}
      <h2>Hextract (Proof of Concept)</h2>
      <p>A colour palette generator with subject extraction.</p>
      <p>Note: this will download ~100mb of Tensorflow models on first run - only use on uncapped data plans</p>
      <input type="file" onChange={e => loadImage(e, null)}/><br/><br/>
      <div>
        {/* Note: CORS issues - Consider proxying URLs https://github.com/Rob--W/cors-anywhere*/}
        <input type="text" onChange={e => setUrl(e.target.value)} placeholder="Image URL (CORS ISSUES)"></input>
        <button onClick={e => loadImage(null, url)}>Load Image</button><br/><br/>
      </div>
      {/* <img id="image" className={styles.image} src={imageLoaded ? "" : url} crossOrigin="anonymous"></img> */}
      <canvas id="canvas" className={styles.canvas}></canvas><br/>
      {/* <canvas id="canvas2"></canvas> */}

      {quantizedHexArray.length != 0 ? <a href={"https://coolors.co/" + quantizedHexArray.join("-")} target="_blank" rel="noreferrer">Palette</a> : null}

      {/* {quantizedHexArray.length != 0 ? <div className={styles.palette}>
        <Script data-id="09199291287329397">new CoolorsPaletteWidget("09199291287329397", {quantizedHexArray})</Script>
      </div> : null} */}
      {processing ? <h4>Processing image...</h4> : null}
      {exec != null && !processing ? <h4>Took {exec}ms to process</h4> : null}
    </div>
  )
}

function componentToHex(c:number) {
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r:number, g:number, b:number): string {
  return componentToHex(r) + componentToHex(g) + componentToHex(b);
}

export default Home
