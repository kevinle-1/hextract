import React, { useRef, useEffect, useState } from 'react'
import type { NextPage } from 'next'
import Image from 'next/image'
import styles from '../styles/Home.module.scss'

import sampleImg from '../sample/firefox_9HJSePiW27.png';

import * as bodySegmentation from '@tensorflow-models/body-segmentation';
import '@tensorflow/tfjs-backend-webgl';

const r=0, g=1, b=2,a=3;

const Home: NextPage = () => {
  const [processing, setProcessing] = useState<boolean>(false);

  const [exec, setExec] = useState<number | null>(null);
  const [fileLoaded, setFileLoaded] = useState<boolean>(false);
  const [url, setUrl] = useState<string>("https://i.imgur.com/M5QR39R.png");

  // https://google.github.io/mediapipe/solutions/selfie_segmentation.html
  //const model = bodySegmentation.SupportedModels.MediaPipeSelfieSegmentation;

  // https://blog.tensorflow.org/2019/11/updated-bodypix-2.html
  // Current prefer this model as it provides a more "magazine clipping" look
  // Selfie segmentation is intended to be used with heavy edge blurring for live video conferencing
  const model = bodySegmentation.SupportedModels.BodyPix;

  // TODO: Need to mess around with this
  const bodyPixConfig = {
    architecture: 'ResNet50',
    multiplier: 1,
    multiSegmentation: false,
    segmentBodyParts: true,
    modelType: "general"
  }

  useEffect(() => {
    setProcessing(true);

    // TODO: Consider loading directly into the canvas instead of img frame
    const image = document.getElementById("image") as HTMLImageElement;

    bodySegmentation.createSegmenter(model, bodyPixConfig).then(async (segmenter) => {
      var startTime = performance.now()

      console.log("Begin image processing");

      // PixelInput = Tensor3D | ImageData | HTMLVideoElement | HTMLImageElement | HTMLCanvasElement | ImageBitmap;

      // TODO: Image seems to not be ready when this event is triggered
      // Error: Requested texture size [0x0] is invalid.
      const segmentation = await segmenter.segmentPeople(image, bodyPixConfig);

      const canvas = document.getElementById('canvas') as HTMLCanvasElement;

      const foregroundColor = {r: 255, g: 255, b: 255, a: 0};
      const backgroundColor = {r: 255, g: 255, b: 255, a: 255};
      const backgroundDarkeningMask = await bodySegmentation.toBinaryMask(
          segmentation, foregroundColor, backgroundColor);

      const opacity = 1;
      const maskBlurAmount = 0; // range [0,20], default: 0
      const flipHorizontal = false;

      // await bodySegmentation.drawBokehEffect(canvas, image, segmentation);
      await bodySegmentation.drawMask(
        canvas, image, backgroundDarkeningMask, opacity, maskBlurAmount, flipHorizontal);

      const ctx = canvas.getContext('2d')!;
      const imageData = ctx.getImageData(0,0, canvas.width, canvas.height);

      const pixel = imageData.data;

      for (var p = 0; p<pixel.length; p+=4)
      {
        if (
            pixel[p+r] == 255 &&
            pixel[p+g] == 255 &&
            pixel[p+b] == 255) // if white then change alpha to 0
        {pixel[p+a] = 0;}
      }

      ctx.putImageData(imageData,0,0);

      setProcessing(false);

      var endTime = performance.now()
      setExec(endTime - startTime);
    });

  }, [fileLoaded, url]);

  const onFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    var selectedFile = event.target.files![0];
    var reader = new FileReader();

    var img = document.getElementById("image") as HTMLImageElement;
    img.title = selectedFile.name;

    reader.onload = function(event: ProgressEvent<FileReader>) {
      // console.log(event.target!.result);
      img.src = event.target!.result;
      setFileLoaded(true);
    };

    reader.readAsDataURL(selectedFile);
  }

  return (
    <div className={styles.container}><br/>
      <input type="file" onChange={e => onFileSelected(e)}/><br/><br/>
      <img id="image" className={styles.image} src={fileLoaded ? "" : url} crossOrigin="anonymous"></img>
      <canvas id="canvas" className={styles.canvas}></canvas>
      {/* <canvas id="canvas2"></canvas> */}
      {processing ? <h4>Processing image...</h4> : null}
      {exec != null ? <h4>Took {exec}ms to process</h4> : null}
    </div>
  )
}

export default Home
