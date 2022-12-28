import React, { useRef, useEffect, useState } from 'react'
import type { NextPage } from 'next'
import styles from '../styles/Home.module.scss'

import sampleImg from '../sample/firefox_9HJSePiW27.png';

import * as bodySegmentation from '@tensorflow-models/body-segmentation';
import '@tensorflow/tfjs-backend-webgl';

const r=0, g=1, b=2,a=3;

const Home: NextPage = () => {
  const [processing, setProcessing] = useState<boolean>(false);

  const [exec, setExec] = useState<number | null>(null);
  const [fileLoaded, setFileLoaded] = useState<boolean>(false);

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
    setProcessing(true);

    // TODO: Consider loading directly into the canvas instead of img frame
    //const image = document.getElementById("image") as HTMLImageElement;

    bodySegmentation.createSegmenter(model, bodyPixConfig).then(async (segmenter) => {
      var startTime = performance.now()

      console.log("Begin image processing");
      const canvas = document.getElementById('canvas') as HTMLCanvasElement;

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

      for (var p = 0; p<pixel.length; p+=4)
      {
        if (
            pixel[p+r] == 255 &&
            pixel[p+g] == 255 &&
            pixel[p+b] == 255)
        {
          pixel[p+a] = 0;
        }
        else {
          // TODO: Build [[R,G,B], ..., n] array for colour quantization
        }
      }

      ctx.putImageData(imageData,0,0);

      setProcessing(false);

      var endTime = performance.now()
      setExec(endTime - startTime);
    });

    setFileLoaded(false);
  }, [fileLoaded]);

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

    setFileLoaded(true);
  }

  return (
    <div className={styles.container}><br/>
      <input type="file" onChange={e => loadImage(e, null)}/><br/><br/>
      <div>
        {/* Note: CORS issues */}
        <input type="text" onChange={e => setUrl(e.target.value)} placeholder="Image URL (CORS ISSUES)"></input>
        <button onClick={e => loadImage(null, url)}>Load Image</button><br/><br/>
      </div>
      {/* <img id="image" className={styles.image} src={fileLoaded ? "" : url} crossOrigin="anonymous"></img> */}
      <canvas id="canvas" className={styles.canvas}></canvas>
      {/* <canvas id="canvas2"></canvas> */}
      {processing ? <h4>Processing image...</h4> : null}
      {exec != null ? <h4>Took {exec}ms to process</h4> : null}
    </div>
  )
}

export default Home
